import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { finalizeTransactionUpdates } from './utils';

export const duplicatedTransactions = functions.firestore
    .document('rapid_log/{logId}')
    .onCreate(async (snapshot, context) => {
        const batch = admin.firestore().batch();
        const filename = snapshot.data().filename;
        const collectionPath = `transactions/${filename}/sub_transactions`;
        const transactionsSnapshot = await admin.firestore().collection(collectionPath).get();

        const updatePromises = transactionsSnapshot.docs.map(async (doc) => {
            const transactionData = doc.data();
            const userId = transactionData.userId;
            const merchantName = transactionData.merchantName;

            const startTime = new Date(transactionData.timestamp.toMillis() - 5 * 60000);
            const endTime = transactionData.timestamp;

            const transactionsRef = admin.firestore().collection(collectionPath);
            const transactionsSnapshot = await transactionsRef
                .where('userId', '==', userId)
                .where('timestamp', '>', startTime)
                .where('timestamp', '<=', endTime)
                .where('merchantName', '==', merchantName)
                .where('amount', '==', transactionData.amount)
                .get();

            if (transactionsSnapshot.size >= 2) {
                batch.update(doc.ref, { duplicatedTransactionsFlag: true });
            }
        })
        await finalizeTransactionUpdates(updatePromises, batch, filename, 'duplicated');
    });
