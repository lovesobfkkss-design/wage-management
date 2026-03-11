'use strict';

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readServiceAccount() {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    return JSON.parse(rawJson);
  }

  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
    || process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!serviceAccountPath) {
    throw new Error(
      'Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_PATH, GOOGLE_APPLICATION_CREDENTIALS, or FIREBASE_SERVICE_ACCOUNT_JSON.'
    );
  }

  const resolvedPath = path.resolve(serviceAccountPath);
  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
}

function getDatabaseUrl(serviceAccount) {
  if (process.env.FIREBASE_DATABASE_URL) {
    return process.env.FIREBASE_DATABASE_URL;
  }

  if (serviceAccount.project_id === 'ganghan-wage') {
    return 'https://ganghan-wage-default-rtdb.asia-southeast1.firebasedatabase.app';
  }

  return requireEnv('FIREBASE_DATABASE_URL');
}

function getApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = readServiceAccount();
  const databaseURL = getDatabaseUrl(serviceAccount);

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL
  });
}

function getDatabase() {
  return getApp().database();
}

module.exports = {
  getApp,
  getDatabase
};
