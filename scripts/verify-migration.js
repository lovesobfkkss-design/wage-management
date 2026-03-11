'use strict';

const { getDatabase } = require('./lib/firebase-admin');
const {
  assertRequiredArgs,
  buildMigrationId,
  countCollection,
  parseArgs,
  timestampIso
} = require('./lib/migration-utils');
const {
  calculateCommission,
  calculateDeduction,
  calculateInsurancePayroll,
  calculateSpecialLecture,
  calculateWage
} = require('./lib/payroll-utils');

function normalizeLegacyData(data) {
  return {
    businesses: data.businesses || [],
    staff: data.staff || [],
    workLogs: data.workLogs || [],
    workLogHistories: data.workLogHistories || [],
    commissionInstructors: data.commissionInstructors || [],
    commissionStudents: data.commissionStudents || [],
    insuranceTeachers: data.insuranceTeachers || [],
    insuranceAbsences: data.insuranceAbsences || [],
    specialLectures: data.specialLectures || [],
    specialLectureStudents: data.specialLectureStudents || [],
    settings: data.settings || {}
  };
}

function normalizeAcademyData(data) {
  return {
    businesses: data.businesses || [],
    staff: data.staff || [],
    workLogs: data.workLogs || [],
    workLogHistories: data.workLogHistories || [],
    commissionInstructors: data.commissionInstructors || [],
    commissionStudents: data.commissionStudents || [],
    insuranceTeachers: data.insuranceTeachers || [],
    insuranceAbsences: data.insuranceAbsences || [],
    specialLectures: data.specialLectures || [],
    specialLectureStudents: data.specialLectureStudents || [],
    settings: (data.settings && data.settings.payrollRules) || data.settings || {}
  };
}

function buildCountMap(data) {
  return {
    businesses: countCollection(data.businesses),
    staff: countCollection(data.staff),
    workLogs: countCollection(data.workLogs),
    workLogHistories: countCollection(data.workLogHistories),
    commissionInstructors: countCollection(data.commissionInstructors),
    commissionStudents: countCollection(data.commissionStudents),
    insuranceTeachers: countCollection(data.insuranceTeachers),
    insuranceAbsences: countCollection(data.insuranceAbsences),
    specialLectures: countCollection(data.specialLectures),
    specialLectureStudents: countCollection(data.specialLectureStudents)
  };
}

function compareMaps(left, right) {
  const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort();
  return keys.map((key) => ({
    key,
    left: left[key],
    right: right[key],
    ok: left[key] === right[key]
  }));
}

function collectMonthKeys(data) {
  const monthSet = new Set();

  (data.workLogs || []).forEach((log) => {
    if (typeof log.date === 'string' && log.date.length >= 7) {
      monthSet.add(log.date.slice(0, 7));
    }
  });

  ['commissionStudents', 'insuranceAbsences', 'specialLectureStudents'].forEach((key) => {
    (data[key] || []).forEach((record) => {
      if (record && typeof record.monthKey === 'string') {
        monthSet.add(record.monthKey);
      }
    });
  });

  return Array.from(monthSet).sort();
}

function selectMonths(data, monthsArg) {
  if (monthsArg) {
    return String(monthsArg)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return collectMonthKeys(data).slice(-3);
}

function getCommissionStudents(records, instructorId, monthKey) {
  const record = records.find((item) => item.instructorId === instructorId && item.monthKey === monthKey);
  return Array.isArray(record && record.students) ? record.students : [];
}

function getInsuranceAbsenceDays(records, teacherId, monthKey) {
  const record = records.find((item) => item.teacherId === teacherId && item.monthKey === monthKey);
  return record ? record.absentDays : 0;
}

function getSpecialLectureStudents(records, lectureId, monthKey) {
  const record = records.find((item) => item.lectureId === lectureId && item.monthKey === monthKey);
  return Array.isArray(record && record.students) ? record.students : [];
}

function summarizeMonth(data, monthKey) {
  const summary = {
    grossPay: 0,
    totalDeduction: 0,
    netPay: 0
  };

  data.staff.forEach((staff) => {
    const logs = data.workLogs.filter((log) => log.staffId === staff.id && String(log.date).startsWith(monthKey));
    const totalHours = logs.reduce((sum, log) => sum + (Number(log.hours) || 0), 0);
    if (totalHours === 0) {
      return;
    }

    const wage = calculateWage(staff, totalHours);
    const deduction = calculateDeduction(staff, wage.grossPay, data.settings);
    summary.grossPay += Math.round(wage.grossPay);
    summary.totalDeduction += Math.round(deduction.deduction);
    summary.netPay += Math.round(deduction.netPay);
  });

  data.commissionInstructors.forEach((instructor) => {
    const students = getCommissionStudents(data.commissionStudents, instructor.id, monthKey);
    if (students.length === 0) {
      return;
    }

    const calc = calculateCommission(instructor, students, data.settings);
    summary.grossPay += Math.round(calc.grossPay);
    summary.totalDeduction += Math.round(calc.totalDeduction);
    summary.netPay += Math.round(calc.netPay);
  });

  data.insuranceTeachers.forEach((teacher) => {
    const absentDays = getInsuranceAbsenceDays(data.insuranceAbsences, teacher.id, monthKey);
    const calc = calculateInsurancePayroll(teacher.monthlySalary || 0, absentDays);
    summary.grossPay += Math.round(calc.grossPay);
    summary.totalDeduction += Math.round(calc.totalDeduction + calc.absenceDeduction);
    summary.netPay += Math.round(calc.finalNetPay);
  });

  data.specialLectures.forEach((lecture) => {
    const students = getSpecialLectureStudents(data.specialLectureStudents, lecture.id, monthKey);
    if (students.length === 0) {
      return;
    }

    const calc = calculateSpecialLecture(lecture, students, data.settings);
    summary.grossPay += Math.round(calc.grossPay);
    summary.totalDeduction += Math.round(calc.totalDeduction);
    summary.netPay += Math.round(calc.netPay);
  });

  return summary;
}

function compareMonthlySummaries(sourceData, targetData, months) {
  return months.map((monthKey) => {
    const source = summarizeMonth(sourceData, monthKey);
    const target = summarizeMonth(targetData, monthKey);

    return {
      monthKey,
      source,
      target,
      ok: source.grossPay === target.grossPay
        && source.totalDeduction === target.totalDeduction
        && source.netPay === target.netPay
    };
  });
}

function headcountByBusiness(staff) {
  return staff.reduce((acc, item) => {
    const key = String(item.businessId || 'unknown');
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function compareSettings(source, target) {
  const keys = ['minimumWage', 'assistantDeduction', 'instructorDeduction', 'cardFeeRate'];
  return keys.map((key) => ({
    key,
    left: source[key],
    right: target[key],
    ok: source[key] === target[key]
  }));
}

function printCountResults(results) {
  results.forEach((result) => {
    console.log(`- ${result.key}: ${result.ok ? 'OK' : 'MISMATCH'} (${result.left} vs ${result.right})`);
  });
}

function printMonthResults(results) {
  results.forEach((result) => {
    const left = `${result.source.grossPay}/${result.source.totalDeduction}/${result.source.netPay}`;
    const right = `${result.target.grossPay}/${result.target.totalDeduction}/${result.target.netPay}`;
    console.log(`- payroll ${result.monthKey}: ${result.ok ? 'OK' : 'MISMATCH'} (${left} vs ${right})`);
  });
}

async function updateMigrationLog(database, migrationId, payload) {
  await database.ref(`migrationLogs/${migrationId}`).update(payload);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  assertRequiredArgs(args, ['academyId']);

  const database = getDatabase();
  const [legacySnapshot, academySnapshot] = await Promise.all([
    database.ref('appData').once('value'),
    database.ref(`academies/${args.academyId}`).once('value')
  ]);

  if (!legacySnapshot.exists()) {
    throw new Error('Legacy source path "appData" does not exist.');
  }

  if (!academySnapshot.exists()) {
    throw new Error(`Target academy path "academies/${args.academyId}" does not exist.`);
  }

  const sourceData = normalizeLegacyData(legacySnapshot.val());
  const targetData = normalizeAcademyData(academySnapshot.val());
  const months = selectMonths(sourceData, args.months);
  const countResults = compareMaps(buildCountMap(sourceData), buildCountMap(targetData));
  const settingsResults = compareSettings(sourceData.settings, targetData.settings);
  const monthResults = compareMonthlySummaries(sourceData, targetData, months);
  const headcountResults = compareMaps(
    headcountByBusiness(sourceData.staff),
    headcountByBusiness(targetData.staff)
  );

  console.log(`Migration verify: ${args.academyId}`);
  printCountResults(countResults);
  settingsResults.forEach((result) => {
    console.log(`- setting ${result.key}: ${result.ok ? 'OK' : 'MISMATCH'} (${result.left} vs ${result.right})`);
  });
  printMonthResults(monthResults);
  headcountResults.forEach((result) => {
    console.log(`- business headcount ${result.key}: ${result.ok ? 'OK' : 'MISMATCH'} (${result.left} vs ${result.right})`);
  });

  const allOk = [
    ...countResults,
    ...settingsResults,
    ...monthResults,
    ...headcountResults
  ].every((result) => result.ok);

  const summary = {
    verification: {
      verifiedAt: timestampIso(),
      months,
      result: allOk ? 'success' : 'failed',
      counts: countResults,
      settings: settingsResults,
      payroll: monthResults,
      businessHeadcount: headcountResults
    }
  };

  if (args.migrationId) {
    await updateMigrationLog(database, args.migrationId, summary);
  } else if (args['write-log'] === true || args['write-log'] === 'true') {
    const migrationId = buildMigrationId();
    await database.ref(`migrationLogs/${migrationId}`).set({
      migrationId,
      academyId: args.academyId,
      sourcePath: 'appData',
      targetPath: `academies/${args.academyId}`,
      status: allOk ? 'verification-success' : 'verification-failed',
      ...summary
    });
  }

  console.log(`Result: ${allOk ? 'PASSED' : 'FAILED'}`);

  if (!allOk) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`Verify failed: ${error.message}`);
  process.exitCode = 1;
});
