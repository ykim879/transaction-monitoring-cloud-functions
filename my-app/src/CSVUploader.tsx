// src/CSVUploader.tsx
import React, { useState } from "react";
import { db, storage } from "./firebaseConfig";
import { ref, uploadBytes } from "firebase/storage";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { Timestamp } from 'firebase/firestore';

const columnOrder = [
    "transactionId",
    "userId",
    "merchantName",
    "amount",
    "highValueFlag",
    "rapidTransactionFlag",
    "duplicatedTransactionsFlag",
    "detectAbnormalTimeTransactionsFlag",
    "timestamp"
];

const CSVUploader: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploadId, setUploadId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const [transactions, setTransactions] = useState<any[]>([]);
    const [viewTransactions, setViewTransactions] = useState<boolean>(false);

    const handleUpload = async () => {
        if (file) {
            setLoading(true);
            const uniqueId = Date.now().toString();
            setUploadId(uniqueId); 
            const storageRef = ref(storage, `${uniqueId}`);

            try {
                const snapshot = await uploadBytes(storageRef, file);
                console.log("Uploaded a blob or file!", snapshot);
                setLoading(false);
            } catch (error) {
                console.error("Upload failed", error);
                setUploadId(null);
                setLoading(false);
            }
        }
    };

    const handleViewTransactions = async () => {
        if (uploadId) {
            // Check for the existence of the file in the 'abnormal_log' collection
            const abnormalLogQuery = query(collection(db, "abnormal_log"), where("filename", "==", uploadId));
            const abnormalLogSnapshot = await getDocs(abnormalLogQuery);

            if (!abnormalLogSnapshot.empty) {
                // If a document with the uniqueId exists, fetch transactions
                const transactionsQuery = query(
                    collection(db, `transactions/${uploadId}/sub_transactions`),
                    orderBy("timestamp") // This will order the results by the `timestamp` field in ascending order
                );
                const transactionsSnapshot = await getDocs(transactionsQuery);

                const fetchedTransactions = transactionsSnapshot.docs.map((doc) => doc.data());
                setTransactions(fetchedTransactions);
                setViewTransactions(true); // This will render the table
            } else {
                console.log('No matching documents in "abnormal_log" collection with the given uniqueId', uploadId);
                setViewTransactions(false);
            }
        }
    };

    return (
        <div>
            <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
            <button onClick={handleUpload}>Upload CSV</button>
            {loading && <p>Loading...</p>}
            {!loading && uploadId && (
                <button onClick={handleViewTransactions}>
                    View Transactions
                </button>
            )}
            {viewTransactions && (
                <table>
                    <thead>
                        <tr>
                            {columnOrder.map((columnName) => (
                                <th key={columnName}>{columnName}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((transaction, index) => (
                            <tr key={index}>
                                {columnOrder.map((columnName, idx) => {
                                    const val = transaction[columnName] || false;
                                    let displayValue: string;
                                    if (val instanceof Timestamp) {
                                        displayValue = val.toDate().toLocaleString();
                                    } else if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                                        displayValue = val.toString();
                                    } else {
                                        displayValue = 'N/A';
                                    }

                                    return <td key={idx}>{displayValue}</td>;
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default CSVUploader;
