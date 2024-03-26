import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { finalizeTransactionUpdates } from './utils';

export const detectHighValueTransactions = functions.firestore
    .document('upload_log/{logId}')
    .onCreate(async (snapshot) => {
        const newDocument = snapshot.data();
        const filename = newDocument.filename;
        const collectionPath = `transactions/${filename}/sub_transactions`;

        const transactionsSnapshot = await admin.firestore().collection(collectionPath).get();

        const batch = admin.firestore().batch();
        const updatePromises = transactionsSnapshot.docs.map(async (doc) => {
            const transactionData = doc.data();
            var highValueThreshold = 10000;

            if (transactionData.amount > highValueThreshold) {
                batch.update(doc.ref, { highValueFlag: true });
            }
        });
        await finalizeTransactionUpdates(updatePromises, batch, filename, 'high_value')
    });