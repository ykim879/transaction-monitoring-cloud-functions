import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { finalizeTransactionUpdates } from './utils';

export const detectRapidTransactions = functions.firestore
    .document('high_value_log/{logId}')
    .onCreate(async (snapshot, context) => {
        const batch = admin.firestore().batch();
        const filename = snapshot.data().filename;
        const collectionPath = `transactions/${filename}/sub_transactions`;

        const transactionsSnapshot = await admin.firestore().collection(collectionPath).get();

        const updatePromises = transactionsSnapshot.docs.map(async (doc) => {
            const transactionData = doc.data();
            const transactionDate = transactionData.timestamp.toDate();

            const startTime = admin.firestore.Timestamp.fromDate(new Date(transactionDate.setHours(0, 0, 0, 0)));
            const endTime = admin.firestore.Timestamp.fromDate(new Date(transactionDate.setHours(23, 59, 59, 999)));

            const querySnapshot = await admin.firestore().collection(collectionPath)
                .where('userId', '==', transactionData.userId)
                .where('timestamp', '>=', startTime)
                .where('timestamp', '<=', endTime)
                .get();

            if (querySnapshot.size >= 20) {
                batch.update(doc.ref, { rapidTransactionFlag: true });
            }
        });
        await finalizeTransactionUpdates(updatePromises, batch, filename, 'rapid');
    });
