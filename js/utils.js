/* ============================================
   강한영어수학학원 급여관리시스템 - 유틸리티 함수
   ============================================ */

// 상수
const MINIMUM_WAGE = 10320;

// 금액 포맷 (원화)
function formatKRW(num) {
  return Math.round(num).toLocaleString('ko-KR') + '원';
}

// 시간 포맷
function formatHours(hours) {
  return hours.toFixed(2) + '시간';
}

// 현재 월 키 (YYYY-MM)
function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// 월 키 파싱
function parseMonthKey(key) {
  const [year, month] = key.split('-').map(Number);
  return { year, month };
}

// 시간 계산 (반올림 규칙 적용)
function calculateHours(startTime, endTime, breakMinutes = 0, roundingRule = 'exact') {
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  let diffMinutes = (end - start) / 60000 - breakMinutes;

  if (roundingRule === 'hour') {
    // 1시간 단위 반올림 (30분 이상 = 올림)
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    return mins >= 30 ? hours + 1 : hours;
  } else if (roundingRule === 'half') {
    // 30분 단위 반올림 (15-44분 = 0.5, 45분 이상 = 1)
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    if (mins >= 45) return hours + 1;
    if (mins >= 15) return hours + 0.5;
    return hours;
  }

  return diffMinutes / 60;
}

// 급여 계산 (시급 구간제 적용)
function calculateWage(staff, totalHours) {
  if (staff.tier1Hours > 0 && staff.tier1Rate > 0) {
    const tier1Hours = Math.min(totalHours, staff.tier1Hours);
    const tier2Hours = Math.max(0, totalHours - staff.tier1Hours);
    const tier1Pay = tier1Hours * staff.tier1Rate;
    const tier2Pay = tier2Hours * staff.tier2Rate;
    return {
      tier1Hours,
      tier2Hours,
      tier1Pay,
      tier2Pay,
      grossPay: tier1Pay + tier2Pay,
      breakdown: `${formatKRW(staff.tier1Rate)} × ${tier1Hours}시간 + ${formatKRW(staff.tier2Rate)} × ${tier2Hours}시간`
    };
  } else {
    const grossPay = totalHours * (staff.tier2Rate || staff.hourlyRate);
    return {
      tier1Hours: 0,
      tier2Hours: totalHours,
      tier1Pay: 0,
      tier2Pay: grossPay,
      grossPay,
      breakdown: `${formatKRW(staff.tier2Rate || staff.hourlyRate)} × ${totalHours}시간`
    };
  }
}

// 공제액 계산 (시급제)
function calculateDeduction(staff, grossPay, settings) {
  let rate = 0;
  let typeName = '';

  if (staff.type === 'assistant') {
    rate = settings.assistantDeduction;
    typeName = '고용보험(0.8%)';
  } else if (staff.type === 'partInstructor' || staff.type === 'instructor') {
    rate = settings.instructorDeduction;
    typeName = '사업소득세(3.3%)';
  }

  const deduction = Math.round(grossPay * rate);
  return {
    rate,
    typeName,
    deduction,
    netPay: grossPay - deduction
  };
}

// ============ 4대보험 공제 계산 ============

/**
 * 4대보험 공제율 (근로자 부담분)
 * - 국민연금: 4.75%
 * - 건강보험: 3.595%
 * - 장기요양: 건강보험의 13.14%
 * - 고용보험: 0.9%
 */
const INSURANCE_RATES = {
  nationalPension: 0.0475,      // 국민연금 4.75%
  healthInsurance: 0.03595,     // 건강보험 3.595%
  longTermCare: 0.1314,         // 장기요양 13.14% (건강보험의)
  employmentInsurance: 0.009    // 고용보험 0.9%
};

/**
 * 근로소득 간이세액표 (2026년 기준, 부양가족 1인 본인)
 * 실제 세액표 기반
 */
function getIncomeTax(monthlySalary) {
  // 2026년 간이세액표 (부양가족 1인 기준) - 실제 값
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

  // 해당 구간의 세액 반환
  for (let i = taxTable.length - 1; i >= 0; i--) {
    if (monthlySalary > taxTable[i].min) {
      return taxTable[i].tax;
    }
  }
  return 0;
}

/**
 * 4대보험 + 소득세 공제액 계산
 */
function calculateInsuranceDeduction(monthlySalary) {
  // 국민연금
  const nationalPension = Math.round(monthlySalary * INSURANCE_RATES.nationalPension);

  // 건강보험
  const healthInsurance = Math.round(monthlySalary * INSURANCE_RATES.healthInsurance);

  // 장기요양보험 (건강보험료의 13.14%)
  const longTermCare = Math.round(healthInsurance * INSURANCE_RATES.longTermCare);

  // 고용보험
  const employmentInsurance = Math.round(monthlySalary * INSURANCE_RATES.employmentInsurance);

  // 소득세 (간이세액표 기준)
  const incomeTax = getIncomeTax(monthlySalary);

  // 지방소득세 (소득세의 10%)
  const localIncomeTax = Math.round(incomeTax * 0.1);

  // 총 공제액
  const totalDeduction = nationalPension + healthInsurance + longTermCare + employmentInsurance + incomeTax + localIncomeTax;

  // 실지급액
  const netPay = monthlySalary - totalDeduction;

  return {
    monthlySalary,
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    incomeTax,
    localIncomeTax,
    totalDeduction,
    netPay,
    breakdown: [
      { name: '국민연금', amount: nationalPension, rate: '4.75%' },
      { name: '건강보험', amount: healthInsurance, rate: '3.595%' },
      { name: '장기요양', amount: longTermCare, rate: '건강보험의 13.14%' },
      { name: '고용보험', amount: employmentInsurance, rate: '0.9%' },
      { name: '소득세', amount: incomeTax, rate: '간이세액' },
      { name: '지방소득세', amount: localIncomeTax, rate: '소득세의 10%' }
    ]
  };
}

function calculateInsurancePayroll(monthlySalary, absentDays = 0) {
  const insurance = calculateInsuranceDeduction(monthlySalary);
  const normalizedAbsentDays = Math.max(0, parseInt(absentDays, 10) || 0);
  const dailyDeduction = Math.round(monthlySalary / 28);
  const absenceDeduction = dailyDeduction * normalizedAbsentDays;

  return {
    ...insurance,
    absentDays: normalizedAbsentDays,
    dailyDeduction,
    absenceDeduction,
    finalNetPay: monthlySalary - absenceDeduction - insurance.totalDeduction
  };
}

// ============ 비율제 강사 정산 계산 ============

/**
 * 비율제 강사 정산 계산
 * 계산 순서:
 * 1. 총 수강료 합계
 * 2. 카드 수수료 1% 공제 (전체 수강료에서)
 * 3. 강사 비율 적용
 * 4. 사업소득세 3.3% 공제 (강사 몫에서)
 * 5. 실지급액 산출
 */
function calculateCommission(instructor, students, settings) {
  // 1. 총 수강료 합계
  const totalTuition = students.reduce((sum, s) => sum + (s.tuition || 0), 0);

  // 2. 카드 수수료 공제
  const cardFee = Math.round(totalTuition * settings.cardFeeRate);
  const afterCardFee = totalTuition - cardFee;

  // 3. 강사 비율 적용
  const instructorGross = Math.round(afterCardFee * instructor.commissionRate);
  const academyShare = afterCardFee - instructorGross;

  // 4. 사업소득세 공제
  const incomeTax = Math.round(instructorGross * settings.instructorDeduction);

  // 5. 실지급액
  const netPay = instructorGross - incomeTax;

  // 총 공제액
  const totalDeduction = cardFee + incomeTax;

  // 정산 내역 문자열
  const ratePercent = Math.round(instructor.commissionRate * 100);
  const breakdown = `수강료 ${formatKRW(totalTuition)} - 카드1% ${formatKRW(cardFee)} = ${formatKRW(afterCardFee)} × ${ratePercent}%`;

  return {
    totalTuition,
    cardFee,
    afterCardFee,
    instructorGross,
    academyShare,
    incomeTax,
    netPay,
    totalDeduction,
    breakdown,
    studentCount: students.length
  };
}

// ============ 특강 정산 계산 ============

/**
 * 특강 정산 계산
 * - 동일한 강사가 과목별로 다른 비율 적용 가능
 * - 카드수수료 1% 적용
 * - 필요 시 사업소득세 3.3% 제외 가능
 */
function calculateSpecialLecture(lecture, students, settings) {
  // 1. 총 수강료 합계
  const totalTuition = students.reduce((sum, s) => sum + (s.tuition || 0), 0);

  // 2. 카드 수수료 공제
  const cardFee = Math.round(totalTuition * settings.cardFeeRate);
  const afterCardFee = totalTuition - cardFee;

  // 3. 강사 비율 적용
  const instructorGross = Math.round(afterCardFee * lecture.commissionRate);
  const academyShare = afterCardFee - instructorGross;

  // 4. 사업소득세 공제
  const taxExcluded = !!lecture.excludeInstructorTax;
  const incomeTax = taxExcluded ? 0 : Math.round(instructorGross * settings.instructorDeduction);

  // 5. 실지급액
  const netPay = instructorGross - incomeTax;

  // 총 공제액
  const totalDeduction = cardFee + incomeTax;

  // 정산 내역 문자열
  const ratePercent = Math.round(lecture.commissionRate * 100);
  const breakdown = `수강료 ${formatKRW(totalTuition)} - 카드1% ${formatKRW(cardFee)} = ${formatKRW(afterCardFee)} × ${ratePercent}%`;

  return {
    lectureName: lecture.name,
    subject: lecture.subject,
    instructorName: lecture.instructorName,
    totalTuition,
    cardFee,
    afterCardFee,
    instructorGross,
    academyShare,
    incomeTax,
    taxExcluded,
    netPay,
    totalDeduction,
    breakdown,
    studentCount: students.length
  };
}

// Toast 메시지 표시
function showToast(message) {
  const toast = document.getElementById('copyToast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

// 클립보드 복사
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('클립보드에 복사되었습니다!');
  });
}

// 날짜 포맷 (YYYY-MM-DD)
function formatDate(date = new Date()) {
  return date.toISOString().split('T')[0];
}

// 시간 포맷 (HH:MM)
function formatTime(date = new Date()) {
  return date.toTimeString().slice(0, 5);
}

// CSV 이스케이프
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

// CSV 생성
function arrayToCSV(data, headers) {
  const headerRow = headers.map(h => escapeCSV(h)).join(',');
  const rows = data.map(row =>
    row.map(cell => escapeCSV(cell)).join(',')
  );
  return '\uFEFF' + headerRow + '\n' + rows.join('\n'); // BOM for Excel
}

// CSV 다운로드
function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============ CSV/Excel 파싱 ============

/**
 * CSV 문자열을 파싱하여 학생 배열로 반환
 * 형식 1: 학생명,수강료
 * 형식 2: 학생명만 (기본 수강료 적용)
 *
 * @param {string} csvText - CSV 텍스트
 * @param {number} defaultTuition - 기본 수강료 (이름만 있을 때 적용)
 */
function parseStudentCSV(csvText, defaultTuition = 0) {
  const lines = csvText.trim().split('\n');
  const students = [];

  // 첫 번째 줄은 헤더로 건너뛰기 (선택적)
  const startIndex = lines[0].includes('학생') || lines[0].includes('이름') || lines[0].includes('수강') ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // CSV 파싱 (쉼표 또는 탭 구분)
    let cells;
    if (line.includes('\t')) {
      cells = line.split('\t');
    } else {
      cells = parseCSVLine(line);
    }

    const name = cells[0]?.trim();
    if (!name) continue;

    // 수강료: 입력값 있으면 사용, 없으면 기본값 적용
    let tuition = 0;
    if (cells.length >= 2 && cells[1]) {
      tuition = parseInt(cells[1].replace(/[^\d]/g, '')) || 0;
    }

    // 수강료가 없으면 기본 수강료 적용
    if (tuition === 0 && defaultTuition > 0) {
      tuition = defaultTuition;
    }

    students.push({ name, tuition });
  }

  return students;
}

/**
 * CSV 한 줄 파싱 (따옴표 처리)
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

/**
 * 파일 객체에서 CSV 읽기
 * @param {File} file - 파일 객체
 * @param {number} defaultTuition - 기본 수강료 (이름만 있을 때 적용)
 */
function readCSVFile(file, defaultTuition = 0) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const students = parseStudentCSV(text, defaultTuition);
        resolve(students);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Excel 파일(.xlsx, .xls) 또는 CSV 파일 읽기
 * @param {File} file - 파일 객체
 * @param {number} defaultTuition - 기본 수강료 (이름만 있을 때 적용)
 */
function readStudentFile(file, defaultTuition = 0) {
  console.log('[readStudentFile] 함수 호출됨 - v6');
  return new Promise((resolve, reject) => {
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    console.log('[readStudentFile] 파일명:', fileName, '엑셀여부:', isExcel);

    if (isExcel) {
      // Excel 파일 읽기
      console.log('[readStudentFile] 엑셀 파일 처리 시작');

      if (typeof XLSX === 'undefined') {
        reject(new Error('XLSX 라이브러리가 로드되지 않았습니다. 페이지를 새로고침하세요.'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          console.log('[readStudentFile] FileReader 완료, 데이터 크기:', e.target.result.byteLength);
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          console.log('[readStudentFile] XLSX 파싱 성공, 시트:', workbook.SheetNames);

          // 첫 번째 시트 사용
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // 시트를 JSON으로 변환
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const students = parseExcelData(jsonData, defaultTuition);
          resolve(students);
        } catch (err) {
          reject(new Error('엑셀 파일 읽기 실패: ' + err.message));
        }
      };
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsArrayBuffer(file);
    } else {
      // CSV/TXT 파일 읽기
      readCSVFile(file, defaultTuition).then(resolve).catch(reject);
    }
  });
}

/**
 * Excel 데이터(2차원 배열)를 학생 배열로 변환
 * @param {Array} data - 2차원 배열 [[row1], [row2], ...]
 * @param {number} defaultTuition - 기본 수강료
 */
function parseExcelData(data, defaultTuition = 0) {
  const students = [];

  if (!data || data.length === 0) return students;

  // 첫 번째 행이 헤더인지 확인
  const firstRow = data[0];
  const isHeader = firstRow && (
    String(firstRow[0]).includes('학생') ||
    String(firstRow[0]).includes('이름') ||
    String(firstRow[0]).includes('성명') ||
    String(firstRow[0]).includes('수강')
  );

  const startIndex = isHeader ? 1 : 0;

  for (let i = startIndex; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    const name = String(row[0] || '').trim();
    if (!name) continue;

    // 수강료: 두 번째 열이 있으면 사용, 없으면 기본값
    let tuition = 0;
    if (row.length >= 2 && row[1] !== undefined && row[1] !== null && row[1] !== '') {
      tuition = parseInt(String(row[1]).replace(/[^\d]/g, '')) || 0;
    }

    // 수강료가 없으면 기본 수강료 적용
    if (tuition === 0 && defaultTuition > 0) {
      tuition = defaultTuition;
    }

    students.push({ name, tuition });
  }

  return students;
}

// ============ 문자 생성 ============

// 급여 확인 문자 생성 (시급제)
function generatePayrollMessage(staff, monthKey, totalHours, wage, ded) {
  const { month } = parseMonthKey(monthKey);

  let message = `[${month}월 급여 정산 확인 요청]\n`;
  message += `${staff.name}님, ${month}월 급여 정산 내역 공유드립니다.\n\n`;

  if (staff.tier1Hours > 0 && wage.tier1Hours > 0) {
    message += `• ${month}월 OT: ${wage.tier1Hours}시간 × ${formatKRW(staff.tier1Rate)} = ${formatKRW(wage.tier1Pay)}\n`;
    message += `• ${month}월 근무: ${wage.tier2Hours}시간 × ${formatKRW(staff.tier2Rate)} = ${formatKRW(wage.tier2Pay)}\n`;
  } else {
    message += `• ${month}월 인정 근무시간: ${totalHours}시간\n`;
    message += `• 시급: ${formatKRW(staff.tier2Rate || staff.hourlyRate)}\n`;
  }

  message += `→ 총 정산(세전): ${formatKRW(wage.grossPay)}\n\n`;
  message += `${ded.typeName} 공제: ${formatKRW(ded.deduction)}\n`;
  message += `→ 최종 지급예정액: ${formatKRW(ded.netPay)}\n\n`;
  message += `맞는지 확인 후 답변 부탁드립니다.`;

  return message;
}

// 급여 확인 문자 생성 (비율제)
function generateCommissionMessage(instructor, monthKey, calc) {
  const { month } = parseMonthKey(monthKey);
  const ratePercent = Math.round(instructor.commissionRate * 100);

  let message = `[${month}월 급여 정산 확인 요청]\n`;
  message += `${instructor.name}님, ${month}월 급여 정산 내역 공유드립니다.\n\n`;

  message += `• 담당 학생 수: ${calc.studentCount}명\n`;
  message += `• 총 수강료: ${formatKRW(calc.totalTuition)}\n`;
  message += `• 카드수수료(1%): -${formatKRW(calc.cardFee)}\n`;
  message += `• 수수료 공제 후: ${formatKRW(calc.afterCardFee)}\n`;
  message += `• 강사 비율(${ratePercent}%): ${formatKRW(calc.instructorGross)}\n\n`;

  message += `사업소득세(3.3%) 공제: -${formatKRW(calc.incomeTax)}\n`;
  message += `→ 최종 지급예정액: ${formatKRW(calc.netPay)}\n\n`;
  message += `맞는지 확인 후 답변 부탁드립니다.`;

  return message;
}

// 퍼센트 포맷 (비율 → 표시용)
function formatPercent(rate) {
  return Math.round(rate * 100) + '%';
}

// 급여 확인 문자 생성 (4대보험 직원)
function generateInsuranceMessage(teacher, monthKey, calc) {
  const { month } = parseMonthKey(monthKey);

  let message = `[${month}월 급여 정산 확인 요청]\n`;
  message += `${teacher.name}님, ${month}월 급여 정산 내역 공유드립니다.\n\n`;

  message += `• 월 급여: ${formatKRW(calc.monthlySalary)}\n\n`;
  if (calc.absentDays > 0) {
    message += `• 결근 ${calc.absentDays}일 공제: -${formatKRW(calc.absenceDeduction)}\n\n`;
  }
  message += `[4대보험 공제 내역]\n`;
  calc.breakdown.forEach(item => {
    message += `• ${item.name} (${item.rate}): -${formatKRW(item.amount)}\n`;
  });
  message += `\n총 공제액: -${formatKRW(calc.totalDeduction)}\n`;
  message += `→ 최종 지급예정액: ${formatKRW(calc.finalNetPay)}\n\n`;
  message += `맞는지 확인 후 답변 부탁드립니다.`;

  return message;
}

// 급여 확인 문자 생성 (특강)
function generateSpecialLectureMessage(lecture, monthKey, calc) {
  const { month } = parseMonthKey(monthKey);
  const ratePercent = Math.round(lecture.commissionRate * 100);

  let message = `[${month}월 특강 정산 확인 요청]\n`;
  message += `${lecture.instructorName}님, ${month}월 ${lecture.name} 정산 내역 공유드립니다.\n\n`;

  message += `• 특강명: ${lecture.name}\n`;
  message += `• 과목: ${lecture.subject}\n`;
  message += `• 수강 학생 수: ${calc.studentCount}명\n`;
  message += `• 총 수강료: ${formatKRW(calc.totalTuition)}\n`;
  message += `• 카드수수료(1%): -${formatKRW(calc.cardFee)}\n`;
  message += `• 수수료 공제 후: ${formatKRW(calc.afterCardFee)}\n`;
  message += `• 강사 비율(${ratePercent}%): ${formatKRW(calc.instructorGross)}\n\n`;

  message += calc.taxExcluded
    ? '사업소득세(3.3%): 제외\n'
    : `사업소득세(3.3%) 공제: -${formatKRW(calc.incomeTax)}\n`;
  message += `→ 최종 지급예정액: ${formatKRW(calc.netPay)}\n\n`;
  message += `맞는지 확인 후 답변 부탁드립니다.`;

  return message;
}
