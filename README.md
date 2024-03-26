# Transaction-Monitoring-UI

This project is designed for monitoring transactions on-demand using a CSV file that is uploaded by the user.

## Tech Stack

My tech stack for this project includes TypeScript and Firebase (including Google Cloud). I use Cloud Storage for uploading CSV files and automate transaction monitoring through Cloud Functions.

## Limitations

### Execution Level of Cloud Functions

Due to the nature of CSV processing, I designed the Cloud Functions to execute after the entire CSV file has been uploaded. This is necessary because the order of the rows in the CSV cannot always be guaranteed. Consequently, I chose to trigger the function at the batch level.

### Maximum of 500 Rows

While the initial requirement was to handle up to 10k rows, my initial code utilized a simple Firebase batch commit suitable for up to 500 operations. However, by adapting the code as shown below, the system can now accommodate up to 10k rows:

```typescript
let batchArray = [firestore.batch()];

// ...

if (operationCounter > 100) {
  const newBatch = firestore.batch();
  batchArray.push(newBatch);
  batchIndex++;
  operationCounter = 0;
}
```
(ref) https://stackoverflow.com/questions/74255527/firestore-batch-write-500-maximum-writes-exceeded
### Lack of User Data
I opted to use a pseudo-detection matrix due to absence of user data. Nevertheless, I plan to propose a more tailored approach in the interview.

## Features
The project's features are divided into two main layers: the Transaction-Monitoring Layer and the UI Layer.

### Transaction-Monitoring Layer
The Transaction Monitoring Layer comprises one Cloud Function for parsing CSV files and five additional Cloud Functions for transaction monitoring. These functions are triggered sequentially to prevent concurrent operations on the same document.

#### parseCsvAndStore
This function is activated when a CSV file is uploaded to Cloud Storage. It parses the CSV and stores its contents as documents in Firebase.

#### Transaction Monitoring Cloud Functions
**1. detectHighValueTransactions**
I created this function to flag high-value transactions, which could indicate attempts at large-scale fraud. I set the threshold for high-value transactions at 10,000, but I believe using user-specific data would allow for a more accurate determination.

**2. detectRapidTransactions**
This function aims to detect sudden increases in transaction volume, a potential sign of fraudulent activity. The current threshold is 20 transactions per day, but with access to user data, it could be refined to reflect typical user behavior more closely.

**3. duplicatedTransactions**
Here, I identify duplicate transactions to address issues where a transaction might be processed multiple times by mistake. An alert is generated if the same transaction occurs more than twice.

**4. detectRepeatedTransactions**
This function flags multiple transactions at the same merchant within a single day, which could indicate merchant-level fraud.

**5. detectAbnormalTimeTransactions**
I designed this function to detect transactions made at unusual times, potentially indicating fraud, especially if the transaction times do not match the user's usual pattern of activity.

### UI Layer
The UI layer allows me to upload a CSV file and view the transactions once all transaction-monitoring processes are complete.

## How to Run the Code
Inside the my-app folder, I start by running:

```command
npm install
```
Next, I log in to my Firebase account:

```bash
firebase login
firebase init
```
I select Firestore, Functions, and Storage features, then move to the functions folder in my-app and run:

```bash
npm install
```
Returning to the my-app directory, I deploy the functions to my Firebase project:

```bash
firebase deploy --only functions
```
Finally, to start the UI, I use the following command:

```bash
npm start
```
