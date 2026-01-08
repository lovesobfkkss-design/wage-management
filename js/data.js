/* ============================================
   강한영어수학학원 급여관리시스템 - 데이터 관리
   ============================================ */

const STORAGE_KEY = 'ganghan_wage_system';
const ADMIN_PASSWORD = '1234'; // 실제로는 더 안전하게 관리하세요

// 기본 데이터 구조
function getDefaultData() {
  return {
    staff: [
      // 시급제 조교들
      { id: 1, name: '박태균', type: 'assistant', hourlyRate: 13000, tier1Hours: 0, tier1Rate: 0, tier2Rate: 13000 },
      { id: 2, name: '김시연', type: 'assistant', hourlyRate: 12000, tier1Hours: 3, tier1Rate: MINIMUM_WAGE, tier2Rate: 12000 },
      { id: 3, name: '이재준', type: 'assistant', hourlyRate: 12000, tier1Hours: 4, tier1Rate: MINIMUM_WAGE, tier2Rate: 12000 },
      { id: 4, name: '이예원', type: 'assistant', hourlyRate: 12000, tier1Hours: 5, tier1Rate: MINIMUM_WAGE, tier2Rate: 12000 },
      { id: 5, name: '김은재', type: 'assistant', hourlyRate: 12000, tier1Hours: 3, tier1Rate: MINIMUM_WAGE, tier2Rate: 12000 },
      { id: 6, name: '김주은', type: 'assistant', hourlyRate: 12000, tier1Hours: 0, tier1Rate: 0, tier2Rate: 12000 },
      { id: 7, name: '인지원', type: 'assistant', hourlyRate: 13000, tier1Hours: 0, tier1Rate: 0, tier2Rate: 13000 },
      { id: 8, name: '김세희', type: 'assistant', hourlyRate: 13000, tier1Hours: 0, tier1Rate: 0, tier2Rate: 13000 },
      { id: 9, name: '홍대현', type: 'assistant', hourlyRate: 13000, tier1Hours: 0, tier1Rate: 0, tier2Rate: 13000 },
      { id: 10, name: '박범수', type: 'assistant', hourlyRate: 12000, tier1Hours: 6, tier1Rate: MINIMUM_WAGE, tier2Rate: 12000 },
      { id: 11, name: '박소은', type: 'assistant', hourlyRate: 12000, tier1Hours: 4, tier1Rate: MINIMUM_WAGE, tier2Rate: 12000 },
      // 시급제 파트강사들
      { id: 12, name: '곽병학', type: 'partInstructor', hourlyRate: 25000, tier1Hours: 0, tier1Rate: 0, tier2Rate: 25000 },
      { id: 13, name: '유향순', type: 'partInstructor', hourlyRate: 25000, tier1Hours: 0, tier1Rate: 0, tier2Rate: 25000 },
      { id: 14, name: '김준경', type: 'partInstructor', hourlyRate: 25000, tier1Hours: 0, tier1Rate: 0, tier2Rate: 25000, roundingRule: 'hour' },
      { id: 15, name: '오혜림', type: 'partInstructor', hourlyRate: 25000, tier1Hours: 0, tier1Rate: 0, tier2Rate: 25000, roundingRule: 'half' },
    ],
    workLogs: [],
    settings: {
      minimumWage: MINIMUM_WAGE,
      assistantDeduction: 0.008, // 0.8% 고용보험
      instructorDeduction: 0.033 // 3.3% 사업소득세
    }
  };
}

// 데이터 로드
function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return getDefaultData();
}

// 데이터 저장
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// 직원 조회
function getStaffById(id) {
  return appData.staff.find(s => s.id === id);
}

// 직원 근무 로그 조회
function getStaffWorkLogs(staffId, monthKey) {
  return appData.workLogs.filter(log =>
    log.staffId === staffId && log.date.startsWith(monthKey)
  );
}

// 직원 추가
function addStaff(staffInfo) {
  const newId = Math.max(...appData.staff.map(s => s.id), 0) + 1;
  const newStaff = {
    id: newId,
    ...staffInfo
  };
  appData.staff.push(newStaff);
  saveData(appData);
  return newStaff;
}

// 직원 수정
function updateStaff(staffId, updates) {
  const staff = getStaffById(staffId);
  if (staff) {
    Object.assign(staff, updates);
    saveData(appData);
  }
  return staff;
}

// 직원 삭제
function deleteStaff(staffId) {
  appData.staff = appData.staff.filter(s => s.id !== staffId);
  saveData(appData);
}

// 근무 로그 추가
function addWorkLog(logInfo) {
  const newId = Math.max(...appData.workLogs.map(l => l.id), 0) + 1;
  const newLog = {
    id: newId,
    ...logInfo
  };
  appData.workLogs.push(newLog);
  saveData(appData);
  return newLog;
}

// 근무 로그 수정
function updateWorkLog(logId, updates) {
  const log = appData.workLogs.find(l => l.id === logId);
  if (log) {
    Object.assign(log, updates);
    saveData(appData);
  }
  return log;
}

// 근무 로그 삭제
function deleteWorkLog(logId) {
  appData.workLogs = appData.workLogs.filter(l => l.id !== logId);
  saveData(appData);
}

// 데이터 내보내기 (JSON)
function exportDataAsJSON() {
  const dataStr = JSON.stringify(appData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `급여데이터_${formatDate()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// 데이터 가져오기 (JSON)
function importDataFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.staff && data.workLogs && data.settings) {
          appData = data;
          saveData(appData);
          resolve(data);
        } else {
          reject(new Error('잘못된 데이터 형식입니다.'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// 근무기록 Excel(CSV) 내보내기
function exportWorkLogsToExcel(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  const logs = appData.workLogs.filter(l => l.date.startsWith(monthKey));

  const headers = ['날짜', '이름', '유형', '출근시간', '퇴근시간', '휴게(분)', '근무시간', '메모'];
  const data = logs
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(log => {
      const staff = getStaffById(log.staffId);
      const typeName = staff?.type === 'assistant' ? '조교' : '강사';
      return [
        log.date,
        staff?.name || '알수없음',
        typeName,
        log.startTime || '',
        log.endTime || '',
        log.breakMinutes || 0,
        log.hours.toFixed(2),
        log.memo || ''
      ];
    });

  const csv = arrayToCSV(data, headers);
  downloadCSV(csv, `근무기록_${year}년${month}월.csv`);
}

// 급여정산 Excel(CSV) 내보내기
function exportPayrollToExcel(monthKey) {
  const { year, month } = parseMonthKey(monthKey);

  const headers = ['이름', '유형', '총근무시간', '시급정보', '세전급여', '공제유형', '공제액', '실지급액'];
  const data = appData.staff
    .map(staff => {
      const logs = getStaffWorkLogs(staff.id, monthKey);
      const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
      if (totalHours === 0) return null;

      const wage = calculateWage(staff, totalHours);
      const ded = calculateDeduction(staff, wage.grossPay, appData.settings);
      const typeName = staff.type === 'assistant' ? '조교' : '강사';

      return [
        staff.name,
        typeName,
        totalHours.toFixed(2),
        wage.breakdown,
        Math.round(wage.grossPay),
        ded.typeName,
        Math.round(ded.deduction),
        Math.round(ded.netPay)
      ];
    })
    .filter(row => row !== null);

  const csv = arrayToCSV(data, headers);
  downloadCSV(csv, `급여정산_${year}년${month}월.csv`);
}

// 전체 데이터 초기화
function resetAllData() {
  if (confirm('모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
    appData = getDefaultData();
    saveData(appData);
    return true;
  }
  return false;
}

// 전역 데이터 변수
let appData = loadData();
