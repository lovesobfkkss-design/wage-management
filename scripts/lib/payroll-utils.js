'use strict';

function calculateWage(staff, totalHours) {
  if (staff.tier1Hours > 0 && staff.tier1Rate > 0) {
    const tier1Hours = Math.min(totalHours, staff.tier1Hours);
    const tier2Hours = Math.max(0, totalHours - staff.tier1Hours);
    const tier1Pay = tier1Hours * staff.tier1Rate;
    const tier2Pay = tier2Hours * staff.tier2Rate;

    return {
      grossPay: tier1Pay + tier2Pay
    };
  }

  return {
    grossPay: totalHours * (staff.tier2Rate || staff.hourlyRate || 0)
  };
}

function calculateDeduction(staff, grossPay, settings) {
  let rate = 0;

  if (staff.type === 'assistant') {
    rate = settings.assistantDeduction || 0;
  } else if (staff.type === 'partInstructor' || staff.type === 'instructor') {
    rate = settings.instructorDeduction || 0;
  }

  const deduction = Math.round(grossPay * rate);
  return {
    deduction,
    netPay: grossPay - deduction
  };
}

const INSURANCE_RATES = {
  nationalPension: 0.0475,
  healthInsurance: 0.03595,
  longTermCare: 0.1314,
  employmentInsurance: 0.009
};

function getIncomeTax(monthlySalary) {
  const taxTable = [
    { min: 0, max: 1060000, tax: 0 },
    { min: 1060000, max: 1500000, tax: 15000 },
    { min: 1500000, max: 2000000, tax: 26000 },
    { min: 2000000, max: 2500000, tax: 35600 },
    { min: 2500000, max: 3000000, tax: 58990 },
    { min: 3000000, max: 3500000, tax: 85540 },
    { min: 3500000, max: 4000000, tax: 122170 },
    { min: 4000000, max: 5000000, tax: 176040 },
    { min: 5000000, max: 6000000, tax: 257040 },
    { min: 6000000, max: 7000000, tax: 340370 },
    { min: 7000000, max: Infinity, tax: 450000 }
  ];

  for (let index = taxTable.length - 1; index >= 0; index -= 1) {
    if (monthlySalary > taxTable[index].min) {
      return taxTable[index].tax;
    }
  }

  return 0;
}

function calculateInsuranceDeduction(monthlySalary) {
  const nationalPension = Math.round(monthlySalary * INSURANCE_RATES.nationalPension);
  const healthInsurance = Math.round(monthlySalary * INSURANCE_RATES.healthInsurance);
  const longTermCare = Math.round(healthInsurance * INSURANCE_RATES.longTermCare);
  const employmentInsurance = Math.round(monthlySalary * INSURANCE_RATES.employmentInsurance);
  const incomeTax = getIncomeTax(monthlySalary);
  const localIncomeTax = Math.round(incomeTax * 0.1);
  const totalDeduction = nationalPension + healthInsurance + longTermCare + employmentInsurance + incomeTax + localIncomeTax;

  return {
    totalDeduction,
    netPay: monthlySalary - totalDeduction
  };
}

function calculateInsurancePayroll(monthlySalary, absentDays) {
  const insurance = calculateInsuranceDeduction(monthlySalary);
  const normalizedAbsentDays = Math.max(0, parseInt(absentDays, 10) || 0);
  const absenceDeduction = Math.round(monthlySalary / 28) * normalizedAbsentDays;

  return {
    grossPay: monthlySalary,
    totalDeduction: insurance.totalDeduction,
    finalNetPay: monthlySalary - absenceDeduction - insurance.totalDeduction,
    absenceDeduction
  };
}

function calculateCommission(instructor, students, settings) {
  const totalTuition = students.reduce((sum, student) => sum + (student.tuition || 0), 0);
  const cardFee = Math.round(totalTuition * (settings.cardFeeRate || 0));
  const afterCardFee = totalTuition - cardFee;
  const instructorGross = Math.round(afterCardFee * (instructor.commissionRate || 0));
  const incomeTax = Math.round(instructorGross * (settings.instructorDeduction || 0));

  return {
    grossPay: instructorGross,
    totalDeduction: cardFee + incomeTax,
    netPay: instructorGross - incomeTax
  };
}

function calculateSpecialLecture(lecture, students, settings) {
  const totalTuition = students.reduce((sum, student) => sum + (student.tuition || 0), 0);
  const cardFee = Math.round(totalTuition * (settings.cardFeeRate || 0));
  const afterCardFee = totalTuition - cardFee;
  const instructorGross = Math.round(afterCardFee * (lecture.commissionRate || 0));
  const incomeTax = lecture.excludeInstructorTax
    ? 0
    : Math.round(instructorGross * (settings.instructorDeduction || 0));

  return {
    grossPay: instructorGross,
    totalDeduction: cardFee + incomeTax,
    netPay: instructorGross - incomeTax
  };
}

module.exports = {
  calculateCommission,
  calculateDeduction,
  calculateInsurancePayroll,
  calculateSpecialLecture,
  calculateWage
};
