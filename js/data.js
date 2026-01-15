/* ============================================
   강한영어수학학원 급여관리시스템 - 데이터 관리 (Firebase 연동)
   ============================================ */

const STORAGE_KEY = 'ganghan_wage_system';
const ADMIN_PASSWORD = '1234'; // 실제로는 더 안전하게 관리하세요

// Firebase 데이터 참조
const dataRef = database.ref('appData');

// 기본 데이터 구조
function getDefaultData() {
  return {
    // 사업장 목록
    businesses: [
      { id: 1, name: '강한코칭학원' },
      { id: 2, name: '강한영어수학학원' }
    ],
    // 시급제 직원 (조교, 파트강사)
    staff: [
      // 시급제 조교들 - 기본값으로 강한영어수학학원(id:2) 소속
      { id: 1, name: '박태균', type: 'assistant', hourlyRate: 13000, tier1Hours: 0, tier1Rate: 0, tier2Rate: 13000, businessId: 2 },
      { id: 2, name: '김시연', type: 'assistant', hourlyRate: 12000, tier1Hours: 3, tier1Rate: MINIMUM_WAGE, tier2Rate: 12000, businessId: 2 },
      { id: 3, name: '이재준', type: 'assistant', hourlyRate: 12000, tier1Hours: 4, tier1Rate: MINIMUM_WAGE, tier2Rate: 12000, businessId: 2 },
      { id: 4, name: '이예원', type: 'assistant', hourlyRate: 12000, tier1Hours: 5, tier1Rate: MINIMUM_WAGE, tier2Rate: 12000, businessId: 2 },
      { id: 5, name: '김은재', type: 'assistant', hourlyRate: 12000, tier1Hours: 3, tier1Rate: MINIMUM_WAGE, tier2Rate: 12000, businessId: 2 },
      { id: 6, name: '김주은', type: 'assistant', hourlyRate: 12000, tier1Hours: 0, tier1Rate: 0, tier2Rate: 12000, businessId: 2 },
      { id: 7, name: '인지원', type: 'assistant', hourlyRate: 13000, tier1Hours: 0, tier1Rate: 0, tier2Rate: 13000, businessId: 2 },
      { id: 8, name: '김세희', type: 'assistant', hourlyRate: 13000, tier1Hours: 0, tier1Rate: 0, tier2Rate: 13000, businessId: 2 },
      { id: 9, name: '홍대현', type: 'assistant', hourlyRate: 13000, tier1Hours: 0, tier1Rate: 0, tier2Rate: 13000, businessId: 2 },
      { id: 10, name: '박범수', type: 'assistant', hourlyRate: 12000, tier1Hours: 6, tier1Rate: MINIMUM_WAGE, tier2Rate: 12000, businessId: 2 },
      { id: 11, name: '박소은', type: 'assistant', hourlyRate: 12000, tier1Hours: 4, tier1Rate: MINIMUM_WAGE, tier2Rate: 12000, businessId: 2 },
      // 시급제 파트강사들
      { id: 14, name: '김준경', type: 'partInstructor', hourlyRate: 25000, tier1Hours: 0, tier1Rate: 0, tier2Rate: 25000, roundingRule: 'hour', businessId: 2 },
      { id: 15, name: '오혜림', type: 'partInstructor', hourlyRate: 25000, tier1Hours: 0, tier1Rate: 0, tier2Rate: 25000, roundingRule: 'half', businessId: 2 },
    ],
    // 근무 기록 (시급제)
    workLogs: [],
    // 비율제 강사
    commissionInstructors: [],
    // 비율제 강사 학생 데이터 (월별)
    // 형식: { instructorId, monthKey, students: [{ name, tuition }] }
    commissionStudents: [],
    // 설정
    settings: {
      minimumWage: MINIMUM_WAGE,
      assistantDeduction: 0.008,    // 0.8% 고용보험
      instructorDeduction: 0.033,   // 3.3% 사업소득세
      cardFeeRate: 0.01             // 1% 카드수수료 (비율제 강사용)
    }
  };
}

// 데이터 호환성 처리
function ensureDataCompatibility(data) {
  if (!data) return getDefaultData();

  // 기존 데이터에 새 필드가 없으면 추가
  if (!data.commissionInstructors) data.commissionInstructors = [];
  if (!data.commissionStudents) data.commissionStudents = [];
  if (!data.workLogs) data.workLogs = [];
  if (!data.settings) data.settings = getDefaultData().settings;
  if (!data.settings.cardFeeRate) data.settings.cardFeeRate = 0.01;

  // 사업장 데이터 호환성 처리
  if (!data.businesses) {
    data.businesses = [
      { id: 1, name: '강한코칭학원' },
      { id: 2, name: '강한영어수학학원' }
    ];
  }

  // staff가 없으면 기본값 사용
  if (!data.staff) {
    data.staff = getDefaultData().staff;
  }

  // 기존 직원에 businessId 없으면 기본값(2: 강한영어수학학원) 할당
  data.staff.forEach(s => {
    if (!s.businessId) s.businessId = 2;
  });
  // 기존 비율제 강사에 businessId 없으면 기본값 할당
  data.commissionInstructors.forEach(i => {
    if (!i.businessId) i.businessId = 2;
  });

  return data;
}

// 데이터 로드 (Firebase에서)
function loadData() {
  // 먼저 로컬 캐시에서 로드 (빠른 초기 로딩)
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return ensureDataCompatibility(JSON.parse(saved));
  }
  return getDefaultData();
}

// 데이터 저장 (Firebase + localStorage)
function saveData(data) {
  // 로컬 캐시에 저장 (빠른 응답)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  // Firebase에 저장 (서버 동기화)
  console.log('Firebase에 저장 시도...', new Date().toLocaleTimeString());
  dataRef.set(data).then(() => {
    console.log('Firebase 저장 성공!', new Date().toLocaleTimeString());
  }).catch(err => {
    console.error('Firebase 저장 실패:', err);
    showToast('데이터 동기화 실패. 인터넷 연결을 확인해주세요.');
  });
}

// Firebase 실시간 동기화 설정
function setupFirebaseSync() {
  console.log('Firebase 실시간 동기화 설정 중...');

  dataRef.on('value', (snapshot) => {
    console.log('Firebase에서 데이터 수신!', new Date().toLocaleTimeString());
    const firebaseData = snapshot.val();
    if (firebaseData) {
      const compatibleData = ensureDataCompatibility(firebaseData);
      // 로컬 캐시 업데이트
      localStorage.setItem(STORAGE_KEY, JSON.stringify(compatibleData));
      // 전역 데이터 업데이트
      appData = compatibleData;
      console.log('workLogs 개수:', appData.workLogs ? appData.workLogs.length : 0);
      // 화면 다시 렌더링 (로그인 상태일 때만)
      if (typeof currentUser !== 'undefined' && currentUser) {
        renderContent();
      }
      // 직원 선택 목록 업데이트
      if (typeof populateStaffSelect === 'function') {
        populateStaffSelect();
      }
    } else {
      console.log('Firebase에 데이터 없음, 기본 데이터로 초기화');
    }
  }, (error) => {
    console.error('Firebase 동기화 오류:', error);
    alert('Firebase 연결 오류: ' + error.message);
  });
}

// 초기 데이터 마이그레이션 (localStorage -> Firebase)
function migrateToFirebase() {
  console.log('Firebase 마이그레이션 확인 중...');
  const localData = localStorage.getItem(STORAGE_KEY);

  dataRef.once('value').then((snapshot) => {
    const firebaseData = snapshot.val();
    console.log('Firebase 기존 데이터:', firebaseData ? '있음' : '없음');
    console.log('로컬 데이터:', localData ? '있음' : '없음');

    if (!firebaseData) {
      // Firebase에 데이터가 없으면
      if (localData) {
        // 로컬 데이터 업로드
        const data = ensureDataCompatibility(JSON.parse(localData));
        dataRef.set(data).then(() => {
          console.log('로컬 데이터를 Firebase로 마이그레이션 완료');
        });
      } else {
        // 기본 데이터로 초기화
        dataRef.set(getDefaultData()).then(() => {
          console.log('기본 데이터로 Firebase 초기화 완료');
        });
      }
    } else {
      console.log('Firebase에 이미 데이터 있음, 마이그레이션 불필요');
    }
  }).catch(err => {
    console.error('Firebase 연결 실패:', err);
    alert('Firebase 연결 실패: ' + err.message + '\n\n보안 규칙을 확인해주세요.');
  });
}

// Firebase 동기화 시작
console.log('=== Firebase 초기화 시작 ===');
migrateToFirebase();
setupFirebaseSync();

// ============ 사업장 관리 ============

// 사업장 조회
function getBusinessById(id) {
  return appData.businesses.find(b => b.id === id);
}

// 사업장 이름 조회
function getBusinessName(id) {
  const business = getBusinessById(id);
  return business ? business.name : '미지정';
}

// 사업장 추가
function addBusiness(name) {
  const newId = Math.max(...appData.businesses.map(b => b.id), 0) + 1;
  const newBusiness = { id: newId, name };
  appData.businesses.push(newBusiness);
  saveData(appData);
  return newBusiness;
}

// 사업장 수정
function updateBusiness(id, name) {
  const business = getBusinessById(id);
  if (business) {
    business.name = name;
    saveData(appData);
  }
  return business;
}

// 사업장 삭제 (소속 직원이 있으면 삭제 불가)
function deleteBusiness(id) {
  // 소속 직원 확인
  const hasStaff = appData.staff.some(s => s.businessId === id);
  const hasInstructor = appData.commissionInstructors.some(i => i.businessId === id);

  if (hasStaff || hasInstructor) {
    return { success: false, message: '해당 사업장에 소속된 직원이 있어 삭제할 수 없습니다.' };
  }

  appData.businesses = appData.businesses.filter(b => b.id !== id);
  saveData(appData);
  return { success: true };
}

// 사업장별 직원 목록 조회 (businessId가 'all'이면 전체)
function getStaffByBusiness(businessId) {
  if (businessId === 'all') {
    return appData.staff;
  }
  return appData.staff.filter(s => s.businessId === businessId);
}

// 사업장별 비율제 강사 목록 조회
function getCommissionInstructorsByBusiness(businessId) {
  if (businessId === 'all') {
    return appData.commissionInstructors;
  }
  return appData.commissionInstructors.filter(i => i.businessId === businessId);
}

// ============ 시급제 직원 관리 ============

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

// ============ 비율제 강사 관리 ============

// 비율제 강사 조회
function getCommissionInstructorById(id) {
  return appData.commissionInstructors.find(i => i.id === id);
}

// 비율제 강사 추가
function addCommissionInstructor(info) {
  const newId = Math.max(...appData.commissionInstructors.map(i => i.id), 0) + 1;
  const newInstructor = {
    id: newId,
    name: info.name,
    commissionRate: info.commissionRate, // 강사 몫 비율 (0.5 = 50%)
    businessId: info.businessId // 소속 사업장
  };
  appData.commissionInstructors.push(newInstructor);
  saveData(appData);
  return newInstructor;
}

// 비율제 강사 수정
function updateCommissionInstructor(id, updates) {
  const instructor = getCommissionInstructorById(id);
  if (instructor) {
    Object.assign(instructor, updates);
    saveData(appData);
  }
  return instructor;
}

// 비율제 강사 삭제
function deleteCommissionInstructor(id) {
  appData.commissionInstructors = appData.commissionInstructors.filter(i => i.id !== id);
  // 관련 학생 데이터도 삭제
  appData.commissionStudents = appData.commissionStudents.filter(s => s.instructorId !== id);
  saveData(appData);
}

// ============ 비율제 강사 학생 관리 ============

// 특정 강사의 월별 학생 데이터 조회
function getCommissionStudents(instructorId, monthKey) {
  const record = appData.commissionStudents.find(
    s => s.instructorId === instructorId && s.monthKey === monthKey
  );
  return record ? record.students : [];
}

// 특정 강사의 월별 학생 데이터 설정 (덮어쓰기)
function setCommissionStudents(instructorId, monthKey, students) {
  const existingIndex = appData.commissionStudents.findIndex(
    s => s.instructorId === instructorId && s.monthKey === monthKey
  );

  if (existingIndex >= 0) {
    appData.commissionStudents[existingIndex].students = students;
  } else {
    appData.commissionStudents.push({
      instructorId,
      monthKey,
      students
    });
  }
  saveData(appData);
}

// 학생 추가 (개별)
function addCommissionStudent(instructorId, monthKey, student) {
  const students = getCommissionStudents(instructorId, monthKey);
  const newId = students.length > 0 ? Math.max(...students.map(s => s.id || 0)) + 1 : 1;
  students.push({ id: newId, ...student });
  setCommissionStudents(instructorId, monthKey, students);
  return newId;
}

// 학생 수정
function updateCommissionStudent(instructorId, monthKey, studentId, updates) {
  const students = getCommissionStudents(instructorId, monthKey);
  const student = students.find(s => s.id === studentId);
  if (student) {
    Object.assign(student, updates);
    setCommissionStudents(instructorId, monthKey, students);
  }
}

// 학생 삭제
function deleteCommissionStudent(instructorId, monthKey, studentId) {
  let students = getCommissionStudents(instructorId, monthKey);
  students = students.filter(s => s.id !== studentId);
  setCommissionStudents(instructorId, monthKey, students);
}

// ============ 데이터 내보내기/가져오기 ============

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
        if (data.staff && data.settings) {
          const compatibleData = ensureDataCompatibility(data);
          appData = compatibleData;
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
      const typeName = staff?.type === 'assistant' ? '조교' : '파트강사';
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

// 급여정산 Excel(CSV) 내보내기 (시급제 + 비율제 통합)
function exportPayrollToExcel(monthKey) {
  const { year, month } = parseMonthKey(monthKey);

  const headers = ['이름', '유형', '총근무시간/수강료합계', '정산내역', '세전급여', '공제내역', '공제액', '실지급액'];
  const data = [];

  // 시급제 직원
  appData.staff.forEach(staff => {
    const logs = getStaffWorkLogs(staff.id, monthKey);
    const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
    if (totalHours === 0) return;

    const wage = calculateWage(staff, totalHours);
    const ded = calculateDeduction(staff, wage.grossPay, appData.settings);
    const typeName = staff.type === 'assistant' ? '조교' : '파트강사';

    data.push([
      staff.name,
      typeName,
      totalHours.toFixed(2) + '시간',
      wage.breakdown,
      Math.round(wage.grossPay),
      ded.typeName,
      Math.round(ded.deduction),
      Math.round(ded.netPay)
    ]);
  });

  // 비율제 강사
  appData.commissionInstructors.forEach(instructor => {
    const students = getCommissionStudents(instructor.id, monthKey);
    if (students.length === 0) return;

    const calc = calculateCommission(instructor, students, appData.settings);

    data.push([
      instructor.name,
      `비율제(${instructor.commissionRate * 100}%)`,
      formatKRW(calc.totalTuition),
      calc.breakdown,
      Math.round(calc.instructorGross),
      `카드1%+3.3%`,
      Math.round(calc.totalDeduction),
      Math.round(calc.netPay)
    ]);
  });

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
