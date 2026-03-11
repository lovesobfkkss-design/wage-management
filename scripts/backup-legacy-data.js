'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getDatabase } = require('./lib/firebase-admin');
const { parseArgs } = require('./lib/migration-utils');

function ensureDirectory(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function buildDefaultOutputPath() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.resolve(process.cwd(), 'backups', `appData-${timestamp}.json`);
}

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function writeSnapshotMetadata(database, snapshotId, metadata) {
  await database.ref(`legacySnapshots/${snapshotId}`).set(metadata);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outPath = path.resolve(args.out || buildDefaultOutputPath());
  const writeMetadata = args['write-metadata'] === true || args['write-metadata'] === 'true';
  const failOnEmpty = args['allow-empty'] !== true && args['allow-empty'] !== 'true';

  const database = getDatabase();
  const snapshot = await database.ref('appData').once('value');
  const appData = snapshot.val();

  if (!appData && failOnEmpty) {
    throw new Error('Firebase path "appData" is empty. Backup aborted.');
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    sourcePath: 'appData',
    data: appData
  };

  const serialized = `${JSON.stringify(payload, null, 2)}\n`;
  ensureDirectory(path.dirname(outPath));
  fs.writeFileSync(outPath, serialized, 'utf8');

  const stats = fs.statSync(outPath);
  const checksum = sha256(serialized);
  const snapshotId = `snapshot_${new Date().toISOString().replace(/[-:.TZ]/g, '')}`;

  if (writeMetadata) {
    await writeSnapshotMetadata(database, snapshotId, {
      snapshotId,
      sourcePath: 'appData',
      localPath: outPath,
      sizeBytes: stats.size,
      sha256: checksum,
      createdAt: payload.exportedAt
    });
  }

  console.log(`Backup complete: ${outPath}`);
  console.log(`Size: ${stats.size} bytes`);
  console.log(`SHA256: ${checksum}`);
  if (writeMetadata) {
    console.log(`Metadata written: legacySnapshots/${snapshotId}`);
  }
}

main().catch((error) => {
  console.error(`Backup failed: ${error.message}`);
  process.exitCode = 1;
});
