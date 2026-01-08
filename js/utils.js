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

// 공제액 계산
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

// 급여 확인 문자 생성
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
