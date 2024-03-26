import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { finalizeTransactionUpdates } from './utils';

export const detectAbnormalTimeTransactions = functions.firestore
    .document('repeated_log/{logId}')
    .onCreate(async (snapshot, context) => {
        const batch = admin.firestore().batch();
        const filename = snapshot.data().filename;
        const collectionPath = `transactions/${filename}/sub_transactions`;
        const transactionsSnapshot = await admin.firestore().collection(collectionPath).get();

        const updatePromises = transactionsSnapshot.docs.map(async (doc) => {
            const transactionData = doc.data();
            const transactionTimestamp: admin.firestore.Timestamp = transactionData.timestamp;
            const transactionHour = transactionTimestamp.toDate().getHours();

            if (transactionHour >= 3 && transactionHour <= 6) {
                batch.update(doc.ref, { detectAbnormalTimeTransactionsFlag: true });
            }
        })
        await finalizeTransactionUpdates(updatePromises, batch, filename, 'abnormal');
    });