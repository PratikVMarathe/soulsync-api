import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

function initializeFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  const projectId = process.env.FIREBASE_PROJECT_ID || 'soulsync-b29c8';

  let credential = null;

  if (rawServiceAccount) {
    try {
      let parsedJson;
      if (rawServiceAccount.trim().startsWith('{')) {
        parsedJson = JSON.parse(rawServiceAccount);
      } else {
        const decoded = Buffer.from(rawServiceAccount, 'base64').toString('utf8');
        parsedJson = JSON.parse(decoded);
      }
      credential = admin.credential.cert(parsedJson);
    } catch (err) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT environment variable:', err);
    }
  } else if (serviceAccountPath) {
    try {
      const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);
      if (fs.existsSync(resolvedPath)) {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        const parsedJson = JSON.parse(fileContent);
        credential = admin.credential.cert(parsedJson);
      }
    } catch (err) {
      console.error(`Failed to load service account file from ${serviceAccountPath}:`, err);
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      credential = admin.credential.applicationDefault();
    } catch (err) {
      console.error('Failed to load application default credentials:', err);
    }
  }

  const options = {
    projectId,
  };

  if (credential) {
    options.credential = credential;
  }

  return admin.initializeApp(options);
}

const firebaseApp = initializeFirebaseAdmin();

export const firebaseAuth = admin.auth(firebaseApp);
export const firestoreDb = admin.firestore(firebaseApp);
export default admin;
