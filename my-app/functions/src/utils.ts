import * as admin from 'firebase-admin';

export const finalizeTransactionUpdates = async (
    updatePromises: Promise<void>[],
    batch: FirebaseFirestore.WriteBatch,
    filename: string,
    collectionType: string
) => {
    await Promise.all(updatePromises);
    try {
        await batch.commit();
        console.log('Transaction ', collectionType, 'flags updated successfully.');
    } catch (error) {
        console.error('Error updating ', collectionType, ' transaction flags:', error);
    }
    try {
        const uploadLogRef = admin.firestore().collection(`${collectionType}_log`).doc();
        await uploadLogRef.set({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            filename: filename,
        });
        console.log(`Log entry added to ${collectionType}.`);
    } catch (error) {
        console.error(`Error logging to ${collectionType}:`, error);
    }
};
