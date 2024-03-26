import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as storage from '@google-cloud/storage';

const csvParser = require('csv-parser');
const gcs = new storage.Storage();

export const parseCsvAndStore = functions.storage.object().onFinalize(async (object) => {
    if (!object.name) return null;
    const bucket = gcs.bucket(object.bucket);
    const fileName = object.name;
    const file = bucket.file(fileName);
    const collectionPath = `transactions/${fileName}/sub_transactions`;
    const documents: any[] = [];
    return new Promise((resolve, reject) => {
        file.createReadStream()
            .pipe(csvParser())
            .on('data', (data: any) => {
                if (data.amount) {
                    data.amount = parseFloat(data.amount);
                }
                if (data.timestamp) {
                    data.timestamp = admin.firestore.Timestamp.fromDate(new Date(data.timestamp));
                }
                documents.push(data)
            })
            .on('end', async () => {
                try {
                    const batch = admin.firestore().batch();
                    documents.forEach((doc) => {
                        const docRef = admin.firestore().collection(collectionPath).doc();
                        batch.set(docRef, { ...doc });
                    });
                    await batch.commit();
                    const uploadLogRef = admin.firestore().collection('upload_log').doc();
                    await uploadLogRef.set({
                        timestamp: admin.firestore.FieldValue.serverTimestamp(), 
                        filename: fileName,
                    });
                    resolve('Upload complete');
                } catch (error) {
                    console.error('Failed to upload documents:', error, ". Please try again later.");
                    admin.firestore().collection(collectionPath).get().then(snapshot => {
                        snapshot.forEach(doc => doc.ref.delete());
                    }).catch(console.error);
                    reject(error);
                }
            })
            .on('error', reject);
    });
});