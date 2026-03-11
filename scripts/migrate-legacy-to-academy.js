'use strict';

const { getDatabase } = require('./lib/firebase-admin');
const {
  assertRequiredArgs,
  buildMigrationId,
  countCollection,
  parseArgs,
  timestampIso
} = require('./lib/migration-utils');

function buildCollectionCounts(appData) {
  return {
    businesses: countCollection(appData.businesses),
    staff: countCollection(appData.staff),
    workLogs: countCollection(appData.workLogs),
    workLogHistories: countCollection(appData.workLogHistories),
    commissionInstructors: countCollection(appData.commissionInstructors),
    commissionStudents: countCollection(appData.commissionStudents),
    insuranceTeachers: countCollection(appData.insuranceTeachers),
    insuranceAbsences: countCollection(appData.insuranceAbsences),
    specialLectures: countCollection(appData.specialLectures),
    specialLectureStudents: countCollection(appData.specialLectureStudents)
  };
}

function mapAcademyPayload(appData, options) {
  const now = timestampIso();

  return {
    profile: {
      academyId: options.academyId,
      academyCode: options.academyCode,
      name: options.academyName,
      status: 'active',
      createdAt: now,
      migratedAt: now,
      source: 'legacy-appData'
    },
    settings: {
      payrollRules: appData.settings || {},
      ui: {
        loginTitle: '급여관리시스템',
        academyDisplayName: options.academyName
      }
    },
    businesses: appData.businesses || [],
    staff: appData.staff || [],
    commissionInstructors: appData.commissionInstructors || [],
    commissionStudents: appData.commissionStudents || [],
    insuranceTeachers: appData.insuranceTeachers || [],
    insuranceAbsences: appData.insuranceAbsences || [],
    specialLectures: appData.specialLectures || [],
    specialLectureStudents: appData.specialLectureStudents || [],
    workLogs: appData.workLogs || [],
    workLogHistories: appData.workLogHistories || [],
    users: options.includeUsers === false ? {} : {
      [options.adminUserId]: {
        userId: options.adminUserId,
        role: 'academyAdmin',
        academyId: options.academyId,
        loginId: options.adminLoginId,
        status: 'active',
        mustChangePassword: true,
        createdAt: now,
        migratedAt: now,
        source: 'migration-bootstrap'
      }
    }
  };
}

async function targetExists(database, academyId, academyCode) {
  const [academySnapshot, codeSnapshot] = await Promise.all([
    database.ref(`academies/${academyId}`).once('value'),
    database.ref(`academiesByCode/${academyCode}`).once('value')
  ]);

  return academySnapshot.exists() || codeSnapshot.exists();
}

async function writeMigration(database, payload, options) {
  const migrationId = buildMigrationId();
  const startedAt = timestampIso();
  const counts = buildCollectionCounts(payload);
  const academyPayload = mapAcademyPayload(payload, options);

  await database.ref(`migrationLogs/${migrationId}`).set({
    migrationId,
    academyId: options.academyId,
    academyCode: options.academyCode,
    sourcePath: 'appData',
    targetPath: `academies/${options.academyId}`,
    status: 'started',
    startedAt,
    writeMode: true,
    counts
  });

  await database.ref(`academies/${options.academyId}`).set(academyPayload);
  await database.ref(`academiesByCode/${options.academyCode}`).set({
    academyId: options.academyId,
    status: 'active',
    createdAt: startedAt
  });

  await database.ref(`migrationLogs/${migrationId}`).update({
    status: 'success',
    finishedAt: timestampIso()
  });

  return { migrationId, counts };
}

function printPlan(options, counts, exists) {
  console.log(`Migration plan for academy "${options.academyId}"`);
  console.log(`- academyCode: ${options.academyCode}`);
  console.log(`- academyName: ${options.academyName}`);
  console.log(`- target path: academies/${options.academyId}`);
  console.log(`- code index path: academiesByCode/${options.academyCode}`);
  console.log(`- target exists: ${exists ? 'yes' : 'no'}`);
  console.log(`- write mode: ${options.write ? 'enabled' : 'dry-run'}`);
  console.log(`- admin loginId: ${options.adminLoginId}`);
  console.log(`- admin userId: ${options.adminUserId}`);
  console.log('Counts to copy:');
  Object.entries(counts).forEach(([key, value]) => {
    console.log(`- ${key}: ${value}`);
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  assertRequiredArgs(args, ['academyId', 'academyCode', 'academyName']);

  const options = {
    academyId: args.academyId,
    academyCode: args.academyCode,
    academyName: args.academyName,
    adminLoginId: args.adminLoginId || 'admin',
    adminUserId: args.adminUserId || `usr_admin_${args.academyCode}`,
    includeUsers: args['include-users'] !== 'false' && args['include-users'] !== false,
    write: args.write === true || args.write === 'true',
    force: args.force === true || args.force === 'true'
  };

  const database = getDatabase();
  const legacySnapshot = await database.ref('appData').once('value');
  const appData = legacySnapshot.val();

  if (!appData) {
    throw new Error('Firebase path "appData" is empty. Migration aborted.');
  }

  const counts = buildCollectionCounts(appData);
  const exists = await targetExists(database, options.academyId, options.academyCode);
  if (exists && !options.force) {
    throw new Error(
      `Target academy path or code already exists. Re-run with --force only after confirming the target can be replaced.`
    );
  }

  printPlan(options, counts, exists);

  if (!options.write) {
    console.log('Dry-run complete. No Firebase data was written.');
    return;
  }

  const result = await writeMigration(database, appData, options);
  console.log(`Migration complete: ${result.migrationId}`);
}

main().catch((error) => {
  console.error(`Migration failed: ${error.message}`);
  process.exitCode = 1;
});
