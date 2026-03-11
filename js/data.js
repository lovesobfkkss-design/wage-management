/* ============================================
   강한영어수학학원 급여관리시스템 - 데이터 관리 (Firebase 연동)
   ============================================ */

const LEGACY_STORAGE_KEY = 'ganghan_wage_system';
const ADMIN_PASSWORD = '1234'; // 실제로는 더 안전하게 관리하세요

// Firebase 데이터 참조
let dataRef = database.ref('appData');
let dataMode = 'legacy';
let currentAcademyId = null;
let currentAcademyCode = null;
let currentAcademyProfile = null;
let firebaseValueHandler = null;

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
    // 근무기록 수정 이력
    workLogHistories: [],
    // 비율제 강사
    commissionInstructors: [],
    // 비율제 강사 학생 데이터 (월별)
    // 형식: { instructorId, monthKey, students: [{ name, tuition }] }
    commissionStudents: [],
    // 4대보험 직원 (월급제)
    insuranceTeachers: [],
    // 4대보험 직원 결근 데이터 (월별)
    insuranceAbsences: [],
    // 특강 목록
    specialLectures: [],
    // 특강 학생 데이터 (월별)
    // 형식: { lectureId, monthKey, students: [{ id, name, tuition }] }
    specialLectureStudents: [],
    // 설정
    settings: {
      minimumWage: MINIMUM_WAGE,
      assistantDeduction: 0.009,    // 0.9% 고용보험
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
  if (!data.workLogHistories) data.workLogHistories = [];
  if (!data.insuranceAbsences) data.insuranceAbsences = [];
  if (!data.messageLogs) data.messageLogs = [];
  if (!data.settings) data.settings = getDefaultData().settings;
  if (data.settings.cardFeeRate === undefined) data.settings.cardFeeRate = 0.01;
  if (data.settings.assistantDeduction === undefined || data.settings.assistantDeduction === 0.008) {
    data.settings.assistantDeduction = 0.009;
  }

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
  // 기존 직원에 password 없으면 기본값 '0000' 할당
  // 기존 직원에 새 필드(hireDate, terminationDate, position) 없으면 null 할당
  data.staff.forEach(s => {
    if (!s.businessId) s.businessId = 2;
    if (!s.password) s.password = '0000';
    if (s.phoneNumber === undefined) s.phoneNumber = '';
    if (s.hireDate === undefined) s.hireDate = null;
    if (s.terminationDate === undefined) s.terminationDate = null;
    if (s.position === undefined) s.position = null;
  });
  // 기존 비율제 강사에 businessId 없으면 기본값 할당
  data.commissionInstructors.forEach(i => {
    if (!i.businessId) i.businessId = 2;
    if (i.phoneNumber === undefined) i.phoneNumber = '';
  });
  data.commissionStudents.forEach(record => {
    if (!Array.isArray(record.students)) record.students = [];
  });

  // 4대보험 직원 데이터 호환성 처리
  if (!data.insuranceTeachers) data.insuranceTeachers = [];
  data.insuranceTeachers.forEach(t => {
    if (!t.businessId) t.businessId = 2;
    if (t.hireDate === undefined) t.hireDate = null;
    if (t.terminationDate === undefined) t.terminationDate = null;
    if (t.position === undefined) t.position = null;
    if (t.residentId === undefined) t.residentId = null;
  });

  // 특강 데이터 호환성 처리
  if (!data.specialLectures) data.specialLectures = [];
  if (!data.specialLectureStudents) data.specialLectureStudents = [];
  if (!data.pendingStaffRequests) data.pendingStaffRequests = [];
  data.specialLectures.forEach(l => {
    if (!l.businessId) l.businessId = 2;
    if (l.excludeInstructorTax === undefined) l.excludeInstructorTax = false;
  });

  return data;
}

function getStorageKey() {
  if (dataMode === 'academy' && currentAcademyId) {
    return `${LEGACY_STORAGE_KEY}_${currentAcademyId}`;
  }
  return LEGACY_STORAGE_KEY;
}

function normalizeUserMap(users) {
  if (!users) return {};
  if (Array.isArray(users)) {
    return users.reduce((acc, user, index) => {
      const key = user.userId || `user_${index + 1}`;
      acc[key] = { ...user, userId: key };
      return acc;
    }, {});
  }
  return { ...users };
}

function generateUniqueLoginId(base, users, fallback) {
  const normalizedBase = String(base || fallback || 'user').trim().replace(/\s+/g, '').toLowerCase();
  const seed = normalizedBase || fallback || 'user';
  const existing = new Set(Object.values(users).map(user => user.loginId));

  if (!existing.has(seed)) {
    return seed;
  }

  let suffix = 2;
  while (existing.has(`${seed}${suffix}`)) {
    suffix += 1;
  }

  return `${seed}${suffix}`;
}

function ensureAcademyUsersCompatibility(data, academyId) {
  data.users = normalizeUserMap(data.users);
  let changed = false;
  const users = data.users;
  const userList = Object.values(users);

  let adminUser = userList.find(user => user.role === 'academyAdmin' || user.role === 'admin');
  if (!adminUser) {
    const userId = 'usr_admin';
    users[userId] = {
      userId,
      role: 'academyAdmin',
      academyId,
      loginId: 'admin',
      password: ADMIN_PASSWORD,
      status: 'active',
      mustChangePassword: true,
      createdAt: new Date().toISOString()
    };
    adminUser = users[userId];
    changed = true;
  }

  if (!adminUser.loginId) {
    adminUser.loginId = 'admin';
    changed = true;
  }
  if (!adminUser.password) {
    adminUser.password = ADMIN_PASSWORD;
    changed = true;
  }

  data.staff.forEach(staff => {
    let user = Object.values(users).find(item => item.staffId === staff.id);
    if (!user) {
      const userId = `usr_staff_${staff.id}`;
      const loginId = generateUniqueLoginId(staff.loginId || staff.name, users, `staff${staff.id}`);
      users[userId] = {
        userId,
        role: 'staff',
        academyId,
        staffId: staff.id,
        loginId,
        password: staff.password || '0000',
        status: 'active',
        mustChangePassword: !staff.password || staff.password === '0000',
        createdAt: new Date().toISOString()
      };
      user = users[userId];
      changed = true;
    }

    if (!user.loginId) {
      user.loginId = generateUniqueLoginId(staff.loginId || staff.name, users, `staff${staff.id}`);
      changed = true;
    }
    if (!user.password) {
      user.password = staff.password || '0000';
      changed = true;
    }
    if (!user.role) {
      user.role = 'staff';
      changed = true;
    }
    if (!user.academyId && academyId) {
      user.academyId = academyId;
      changed = true;
    }

    if (staff.loginId !== user.loginId) {
      staff.loginId = user.loginId;
      changed = true;
    }
    if (!staff.password || staff.password !== user.password) {
      staff.password = user.password;
      changed = true;
    }
  });

  return changed;
}

function ensureAcademyDataCompatibility(academyData, academyId, academyCode) {
  if (!academyData) return null;

  const workingData = ensureDataCompatibility({
    businesses: academyData.businesses || [],
    staff: academyData.staff || [],
    workLogs: academyData.workLogs || [],
    workLogHistories: academyData.workLogHistories || [],
    commissionInstructors: academyData.commissionInstructors || [],
    commissionStudents: academyData.commissionStudents || [],
    insuranceTeachers: academyData.insuranceTeachers || [],
    insuranceAbsences: academyData.insuranceAbsences || [],
    specialLectures: academyData.specialLectures || [],
    specialLectureStudents: academyData.specialLectureStudents || [],
    pendingStaffRequests: academyData.pendingStaffRequests || [],
    messageLogs: academyData.messageLogs || [],
    settings: (academyData.settings && academyData.settings.payrollRules) || academyData.settings || getDefaultData().settings
  });

  workingData.profile = academyData.profile || {
    academyId,
    academyCode,
    name: '학원',
    status: 'active'
  };
  workingData.uiSettings = (academyData.settings && academyData.settings.ui) || {};
  workingData.users = normalizeUserMap(academyData.users);

  const changed = ensureAcademyUsersCompatibility(workingData, academyId);

  return {
    data: workingData,
    changed
  };
}

function buildAcademyPayload(data) {
  return {
    profile: data.profile || {
      academyId: currentAcademyId,
      academyCode: currentAcademyCode,
      name: '학원',
      status: 'active'
    },
    settings: {
      payrollRules: data.settings || getDefaultData().settings,
      ui: data.uiSettings || {}
    },
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
    pendingStaffRequests: data.pendingStaffRequests || [],
    messageLogs: data.messageLogs || [],
    users: normalizeUserMap(data.users)
  };
}

function persistLocalCache(data) {
  localStorage.setItem(getStorageKey(), JSON.stringify(data));
}

function detachFirebaseSync() {
  if (!firebaseValueHandler) return;
  dataRef.off('value', firebaseValueHandler);
  firebaseValueHandler = null;
}

// 데이터 로드 (Firebase에서)
function loadData() {
  // 먼저 로컬 캐시에서 로드 (빠른 초기 로딩)
  const saved = localStorage.getItem(getStorageKey());
  if (saved) {
    return ensureDataCompatibility(JSON.parse(saved));
  }
  return getDefaultData();
}

// 데이터 저장 (Firebase + localStorage)
function saveData(data) {
  // 로컬 캐시에 저장 (빠른 응답)
  persistLocalCache(data);

  // Firebase에 저장 (서버 동기화)
  console.log('Firebase에 저장 시도...', new Date().toLocaleTimeString());
  const payload = dataMode === 'academy' ? buildAcademyPayload(data) : data;
  dataRef.set(payload).then(() => {
    console.log('Firebase 저장 성공!', new Date().toLocaleTimeString());
  }).catch(err => {
    console.error('Firebase 저장 실패:', err);
    showToast('데이터 동기화 실패. 인터넷 연결을 확인해주세요.');
  });
}

// Firebase 실시간 동기화 설정
function setupFirebaseSync() {
  console.log('Firebase 실시간 동기화 설정 중...');

  detachFirebaseSync();
  firebaseValueHandler = (snapshot) => {
    console.log('Firebase에서 데이터 수신!', new Date().toLocaleTimeString());
    const firebaseData = snapshot.val();
    if (firebaseData) {
      let compatibleData = null;
      let changed = false;

      if (dataMode === 'academy') {
        const academyCompat = ensureAcademyDataCompatibility(firebaseData, currentAcademyId, currentAcademyCode);
        compatibleData = academyCompat.data;
        changed = academyCompat.changed;
        currentAcademyProfile = compatibleData.profile || null;
      } else {
        compatibleData = ensureDataCompatibility(firebaseData);
      }

      persistLocalCache(compatibleData);
      appData = compatibleData;
      console.log('workLogs 개수:', appData.workLogs ? appData.workLogs.length : 0);

      if (changed) {
        dataRef.set(buildAcademyPayload(compatibleData));
      }

      // 화면 다시 렌더링 (로그인 상태일 때만)
      if (typeof currentUser !== 'undefined' && currentUser) {
        if (typeof updateBranding === 'function') {
          updateBranding();
        }
        if (currentUser.role === 'staff' && currentUser.staffId) {
          currentUser.staff = getStaffById(currentUser.staffId);
        }
        renderContent();
      }
    } else {
      console.log('Firebase에 데이터 없음, 기본 데이터로 초기화');
    }
  };

  dataRef.on('value', firebaseValueHandler, (error) => {
    console.error('Firebase 동기화 오류:', error);
    alert('Firebase 연결 오류: ' + error.message);
  });
}

// 초기 데이터 마이그레이션 (localStorage -> Firebase)
function migrateToFirebase() {
  if (dataMode !== 'legacy') return;
  console.log('Firebase 마이그레이션 확인 중...');
  const localData = localStorage.getItem(getStorageKey());

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

async function activateAcademyDataMode(academyId, academyCode, preloadedData = null) {
  detachFirebaseSync();
  dataMode = 'academy';
  currentAcademyId = academyId;
  currentAcademyCode = academyCode;
  dataRef = database.ref(`academies/${academyId}`);

  const rawData = preloadedData || (await dataRef.once('value')).val();
  const compat = ensureAcademyDataCompatibility(rawData, academyId, academyCode);
  appData = compat.data;
  currentAcademyProfile = appData.profile || null;
  persistLocalCache(appData);

  if (compat.changed) {
    await dataRef.set(buildAcademyPayload(appData));
  }

  setupFirebaseSync();
  return appData;
}

async function authenticateAcademyUser(academyCode, loginId, password, expectedRole) {
  const normalizedCode = String(academyCode || '').trim().toLowerCase();
  const normalizedLoginId = String(loginId || '').trim().toLowerCase();

  if (!normalizedCode || !normalizedLoginId || !password) {
    return { success: false, message: '학원코드, 로그인 ID, 비밀번호를 모두 입력해주세요.' };
  }

  const academyCodeSnapshot = await database.ref(`academiesByCode/${normalizedCode}`).once('value');
  if (!academyCodeSnapshot.exists()) {
    return { success: false, message: '학원코드를 찾을 수 없습니다.' };
  }

  const academyId = academyCodeSnapshot.val().academyId;
  const academySnapshot = await database.ref(`academies/${academyId}`).once('value');
  if (!academySnapshot.exists()) {
    return { success: false, message: '학원 데이터를 찾을 수 없습니다.' };
  }

  const compat = ensureAcademyDataCompatibility(academySnapshot.val(), academyId, normalizedCode);
  const users = Object.values(compat.data.users || {});
  const user = users.find(item => String(item.loginId || '').trim().toLowerCase() === normalizedLoginId);

  if (!user) {
    return { success: false, message: '로그인 ID를 찾을 수 없습니다.' };
  }

  if (user.status === 'pending') {
    return { success: false, message: '관리자 승인 대기 중인 계정입니다.' };
  }
  if (user.status === 'rejected' || user.status === 'disabled') {
    return { success: false, message: '사용할 수 없는 계정입니다. 관리자에게 문의해주세요.' };
  }

  if (expectedRole === 'admin' && !(user.role === 'academyAdmin' || user.role === 'admin')) {
    return { success: false, message: '관리자 계정이 아닙니다.' };
  }
  if (expectedRole === 'staff' && user.role !== 'staff') {
    return { success: false, message: '직원 계정이 아닙니다.' };
  }

  if ((user.password || '') !== password) {
    return { success: false, message: '비밀번호가 올바르지 않습니다.' };
  }

  await activateAcademyDataMode(academyId, normalizedCode, academySnapshot.val());

  const sessionUser = {
    role: user.role === 'staff' ? 'staff' : 'admin',
    accountRole: user.role,
    academyId,
    academyCode: normalizedCode,
    userId: user.userId,
    loginId: user.loginId
  };

  if (sessionUser.role === 'staff') {
    sessionUser.staffId = user.staffId;
    sessionUser.staff = getStaffById(user.staffId);
  }

  return {
    success: true,
    user: sessionUser
  };
}

function getCurrentAcademyName() {
  if (appData?.uiSettings?.academyDisplayName) return appData.uiSettings.academyDisplayName;
  if (appData?.profile?.name) return appData.profile.name;
  if (currentAcademyProfile?.name) return currentAcademyProfile.name;
  return '급여관리시스템';
}

function getUserByStaffId(staffId) {
  return Object.values(normalizeUserMap(appData?.users)).find(user => user.staffId === staffId) || null;
}

function normalizeLoginIdValue(value) {
  return String(value || '').trim().replace(/\s+/g, '');
}

function getPendingStaffRequests() {
  return Array.isArray(appData?.pendingStaffRequests) ? appData.pendingStaffRequests : [];
}

function getPendingStaffRequestById(requestId) {
  return getPendingStaffRequests().find(request => request.id === requestId) || null;
}

function getExistingLoginIds() {
  const ids = new Set();
  Object.values(normalizeUserMap(appData?.users)).forEach((user) => {
    if (user.loginId) ids.add(String(user.loginId).toLowerCase());
  });
  getPendingStaffRequests().forEach((request) => {
    if (request.status === 'pending' && request.loginId) {
      ids.add(String(request.loginId).toLowerCase());
    }
  });
  return ids;
}

function buildUniqueRequestedLoginId(name, requestedLoginId) {
  const base = normalizeLoginIdValue(requestedLoginId || name);
  const fallback = normalizeLoginIdValue(name) || 'staff';
  const desired = base || fallback;
  const existing = getExistingLoginIds();

  if (!existing.has(desired.toLowerCase())) {
    return desired;
  }

  let suffix = 2;
  while (existing.has(`${desired}${suffix}`.toLowerCase())) {
    suffix += 1;
  }

  return `${desired}${suffix}`;
}

async function createAcademySignup(signupInfo) {
  const academyName = String(signupInfo.academyName || '').trim();
  const academyCode = normalizeLoginIdValue(signupInfo.academyCode || '').toLowerCase();
  const adminName = String(signupInfo.adminName || '').trim();
  const loginId = normalizeLoginIdValue(signupInfo.loginId || '');
  const password = String(signupInfo.password || '');

  if (!academyName || !academyCode || !adminName || !loginId || !password) {
    return { success: false, message: '모든 항목을 입력해주세요.' };
  }

  if (!/^[a-z0-9][a-z0-9-]{2,19}$/.test(academyCode)) {
    return { success: false, message: '학원코드는 영문 소문자, 숫자, 하이픈으로 3~20자여야 합니다.' };
  }

  if (password.length < 4) {
    return { success: false, message: '비밀번호는 4자리 이상이어야 합니다.' };
  }

  const codeRef = database.ref(`academiesByCode/${academyCode}`);
  const codeSnapshot = await codeRef.once('value');
  if (codeSnapshot.exists()) {
    return { success: false, message: '이미 사용 중인 학원코드입니다.' };
  }

  const academyId = `acad_${academyCode}`;
  const academyPayload = buildAcademyPayload({
    profile: {
      academyId,
      academyCode,
      name: academyName,
      status: 'active',
      createdAt: new Date().toISOString()
    },
    settings: getDefaultData().settings,
    uiSettings: {
      academyDisplayName: academyName,
      loginTitle: '급여관리시스템'
    },
    businesses: [
      { id: 1, name: academyName }
    ],
    staff: [],
    workLogs: [],
    workLogHistories: [],
    commissionInstructors: [],
    commissionStudents: [],
    insuranceTeachers: [],
    insuranceAbsences: [],
    specialLectures: [],
    specialLectureStudents: [],
    pendingStaffRequests: [],
    users: {
      usr_admin: {
        userId: 'usr_admin',
        role: 'academyAdmin',
        academyId,
        name: adminName,
        loginId,
        password,
        status: 'active',
        mustChangePassword: false,
        createdAt: new Date().toISOString()
      }
    }
  });

  await database.ref(`academies/${academyId}`).set(academyPayload);
  await codeRef.set({
    academyId,
    status: 'active',
    createdAt: new Date().toISOString()
  });

  return {
    success: true,
    academyId,
    academyCode,
    loginId
  };
}

async function createStaffSignupRequest(signupInfo) {
  const academyCode = normalizeLoginIdValue(signupInfo.academyCode || '').toLowerCase();
  const name = String(signupInfo.name || '').trim();
  const requestedLoginId = normalizeLoginIdValue(signupInfo.loginId || '');
  const password = String(signupInfo.password || '');

  if (!academyCode || !name || !password) {
    return { success: false, message: '학원코드, 이름, 비밀번호를 입력해주세요.' };
  }
  if (password.length < 4) {
    return { success: false, message: '비밀번호는 4자리 이상이어야 합니다.' };
  }

  const academyCodeSnapshot = await database.ref(`academiesByCode/${academyCode}`).once('value');
  if (!academyCodeSnapshot.exists()) {
    return { success: false, message: '학원코드를 찾을 수 없습니다.' };
  }

  const academyId = academyCodeSnapshot.val().academyId;
  const academyRef = database.ref(`academies/${academyId}`);
  const academySnapshot = await academyRef.once('value');
  if (!academySnapshot.exists()) {
    return { success: false, message: '학원 데이터를 찾을 수 없습니다.' };
  }

  const compat = ensureAcademyDataCompatibility(academySnapshot.val(), academyId, academyCode);
  const academyData = compat.data;
  const loginId = buildUniqueRequestedLoginId(name, requestedLoginId);
  const hasApprovedUser = Object.values(academyData.users || {}).some((user) => String(user.loginId || '').toLowerCase() === loginId.toLowerCase());
  if (hasApprovedUser) {
    return { success: false, message: '이미 사용 중인 로그인 ID입니다.' };
  }

  academyData.pendingStaffRequests = Array.isArray(academyData.pendingStaffRequests) ? academyData.pendingStaffRequests : [];
  const nextRequestId = Math.max(0, ...academyData.pendingStaffRequests.map((request) => request.id || 0)) + 1;
  academyData.pendingStaffRequests.push({
    id: nextRequestId,
    name,
    requestedLoginId: requestedLoginId || name,
    loginId,
    password,
    academyId,
    academyCode,
    status: 'pending',
    createdAt: new Date().toISOString()
  });

  await academyRef.set(buildAcademyPayload(academyData));
  return {
    success: true,
    academyId,
    loginId
  };
}

function rejectPendingStaffRequest(requestId) {
  const request = getPendingStaffRequestById(requestId);
  if (!request) return false;
  request.status = 'rejected';
  request.reviewedAt = new Date().toISOString();
  saveData(appData);
  return true;
}

function approvePendingStaffRequest(requestId, staffInfo) {
  const request = getPendingStaffRequestById(requestId);
  if (!request) return { success: false, message: '가입 신청을 찾을 수 없습니다.' };

  const newStaff = addStaff({
    name: staffInfo.name || request.name,
    loginId: request.loginId,
    password: request.password,
    businessId: staffInfo.businessId,
    type: staffInfo.type,
    hourlyRate: staffInfo.hourlyRate,
    tier1Hours: staffInfo.tier1Hours,
    tier1Rate: staffInfo.tier1Rate,
    tier2Rate: staffInfo.tier2Rate,
    roundingRule: staffInfo.roundingRule,
    hireDate: staffInfo.hireDate || null,
    terminationDate: null,
    position: staffInfo.position || null
  });

  const user = getUserByStaffId(newStaff.id);
  if (user) {
    user.password = request.password;
    user.status = 'active';
    user.mustChangePassword = false;
    user.loginId = request.loginId;
  }

  request.status = 'approved';
  request.staffId = newStaff.id;
  request.reviewedAt = new Date().toISOString();
  saveData(appData);

  return {
    success: true,
    staff: newStaff
  };
}

function updateUserPassword(userId, newPassword) {
  if (!appData?.users || !appData.users[userId]) return null;
  appData.users[userId].password = newPassword;
  appData.users[userId].mustChangePassword = false;

  if (appData.users[userId].staffId) {
    const staff = getStaffById(appData.users[userId].staffId);
    if (staff) {
      staff.password = newPassword;
    }
  }

  saveData(appData);
  return appData.users[userId];
}

function addMessageLog(logInfo) {
  if (!appData.messageLogs) {
    appData.messageLogs = [];
  }

  const newId = Math.max(0, ...appData.messageLogs.map(log => log.id || 0)) + 1;
  const log = {
    id: newId,
    createdAt: new Date().toISOString(),
    ...logInfo
  };

  appData.messageLogs.push(log);
  saveData(appData);
  return log;
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
  const hasInsuranceTeacher = appData.insuranceTeachers.some(t => t.businessId === id);
  const hasSpecialLecture = appData.specialLectures.some(l => l.businessId === id);

  if (hasStaff || hasInstructor || hasInsuranceTeacher || hasSpecialLecture) {
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

function getWorkLogById(logId) {
  return appData.workLogs.find(log => log.id === logId);
}

function getWorkLogHistories(logId) {
  return appData.workLogHistories
    .filter(history => history.logId === logId)
    .sort((a, b) => new Date(b.editedAt) - new Date(a.editedAt));
}

// 직원 추가
function addStaff(staffInfo) {
  const newId = Math.max(...appData.staff.map(s => s.id), 0) + 1;
  const newStaff = {
    id: newId,
    password: staffInfo.password || '0000',
    ...staffInfo
  };
  appData.staff.push(newStaff);

  if (dataMode === 'academy') {
    appData.users = normalizeUserMap(appData.users);
    const userId = `usr_staff_${newId}`;
    const loginId = generateUniqueLoginId(staffInfo.loginId || staffInfo.name, appData.users, `staff${newId}`);
    appData.users[userId] = {
      userId,
      role: 'staff',
      academyId: currentAcademyId,
      staffId: newId,
      loginId,
      password: newStaff.password,
      status: 'active',
      mustChangePassword: true,
      createdAt: new Date().toISOString()
    };
    newStaff.loginId = loginId;
  }

  saveData(appData);
  return newStaff;
}

// 직원 수정
function updateStaff(staffId, updates) {
  const staff = getStaffById(staffId);
  if (staff) {
    Object.assign(staff, updates);
    const user = getUserByStaffId(staffId);
    if (user) {
      if (updates.loginId) user.loginId = updates.loginId;
      if (updates.password) user.password = updates.password;
    }
    saveData(appData);
  }
  return staff;
}

// 직원 삭제
function deleteStaff(staffId) {
  appData.staff = appData.staff.filter(s => s.id !== staffId);
  if (dataMode === 'academy' && appData.users) {
    const user = getUserByStaffId(staffId);
    if (user) {
      delete appData.users[user.userId];
    }
  }
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
    const before = { ...log };
    const { historyEntry, ...logUpdates } = updates;
    Object.assign(log, logUpdates);
    if (updates.historyEntry) {
      const newHistoryId = Math.max(...appData.workLogHistories.map(h => h.id), 0) + 1;
      appData.workLogHistories.push({
        id: newHistoryId,
        logId,
        before,
        after: { ...log },
        ...historyEntry
      });
    }
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
  return Array.isArray(record?.students) ? record.students : [];
}

// 특정 강사의 월별 학생 데이터 설정 (덮어쓰기)
function setCommissionStudents(instructorId, monthKey, students) {
  const existingIndex = appData.commissionStudents.findIndex(
    s => s.instructorId === instructorId && s.monthKey === monthKey
  );
  const normalizedStudents = Array.isArray(students) ? students : [];

  if (normalizedStudents.length === 0) {
    if (existingIndex >= 0) {
      appData.commissionStudents.splice(existingIndex, 1);
    }
    saveData(appData);
    return;
  }

  if (existingIndex >= 0) {
    appData.commissionStudents[existingIndex].students = normalizedStudents;
  } else {
    appData.commissionStudents.push({
      instructorId,
      monthKey,
      students: normalizedStudents
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

// ============ 4대보험 직원 관리 ============

// 사업장별 4대보험 직원 목록 조회
function getInsuranceTeachersByBusiness(businessId) {
  if (businessId === 'all') {
    return appData.insuranceTeachers;
  }
  return appData.insuranceTeachers.filter(t => t.businessId === businessId);
}

// 4대보험 직원 조회
function getInsuranceTeacherById(id) {
  return appData.insuranceTeachers.find(t => t.id === id);
}

function getInsuranceAbsenceDays(teacherId, monthKey) {
  const record = appData.insuranceAbsences.find(item => item.teacherId === teacherId && item.monthKey === monthKey);
  return record ? record.absentDays : 0;
}

function setInsuranceAbsenceDays(teacherId, monthKey, absentDays) {
  const index = appData.insuranceAbsences.findIndex(item => item.teacherId === teacherId && item.monthKey === monthKey);
  const normalizedDays = Math.max(0, parseInt(absentDays, 10) || 0);

  if (index >= 0) {
    appData.insuranceAbsences[index].absentDays = normalizedDays;
  } else {
    appData.insuranceAbsences.push({
      teacherId,
      monthKey,
      absentDays: normalizedDays
    });
  }

  saveData(appData);
  return normalizedDays;
}

// 4대보험 직원 추가
function addInsuranceTeacher(info) {
  const newId = appData.insuranceTeachers.length > 0
    ? Math.max(...appData.insuranceTeachers.map(t => t.id)) + 1
    : 1;
  const newTeacher = {
    id: newId,
    name: info.name,
    type: 'insuranceTeacher',
    businessId: info.businessId,
    monthlySalary: info.monthlySalary,
    residentId: info.residentId || null,
    hireDate: info.hireDate || null,
    terminationDate: info.terminationDate || null,
    position: info.position || null
  };
  appData.insuranceTeachers.push(newTeacher);
  saveData(appData);
  return newTeacher;
}

// 4대보험 직원 수정
function updateInsuranceTeacher(id, updates) {
  const teacher = getInsuranceTeacherById(id);
  if (teacher) {
    Object.assign(teacher, updates);
    saveData(appData);
  }
  return teacher;
}

// 4대보험 직원 삭제
function deleteInsuranceTeacher(id) {
  appData.insuranceTeachers = appData.insuranceTeachers.filter(t => t.id !== id);
  saveData(appData);
}

// ============ 특강 관리 ============

// 사업장별 특강 목록 조회
function getSpecialLecturesByBusiness(businessId) {
  if (businessId === 'all') {
    return appData.specialLectures;
  }
  return appData.specialLectures.filter(l => l.businessId === businessId);
}

// 특강 조회
function getSpecialLectureById(id) {
  return appData.specialLectures.find(l => l.id === id);
}

// 특강 추가
function addSpecialLecture(info) {
  const newId = appData.specialLectures.length > 0
    ? Math.max(...appData.specialLectures.map(l => l.id)) + 1
    : 1;
  const newLecture = {
    id: newId,
    name: info.name,
    subject: info.subject,
    instructorName: info.instructorName,
    commissionRate: info.commissionRate,
    businessId: info.businessId,
    excludeInstructorTax: !!info.excludeInstructorTax,
    startDate: info.startDate || null,
    endDate: info.endDate || null,
    tuitionPerStudent: info.tuitionPerStudent || 0
  };
  appData.specialLectures.push(newLecture);
  saveData(appData);
  return newLecture;
}

// 특강 수정
function updateSpecialLecture(id, updates) {
  const lecture = getSpecialLectureById(id);
  if (lecture) {
    Object.assign(lecture, updates);
    saveData(appData);
  }
  return lecture;
}

// 특강 삭제
function deleteSpecialLecture(id) {
  appData.specialLectures = appData.specialLectures.filter(l => l.id !== id);
  // 관련 학생 데이터도 삭제
  appData.specialLectureStudents = appData.specialLectureStudents.filter(s => s.lectureId !== id);
  saveData(appData);
}

// ============ 특강 학생 관리 ============

// 특정 특강의 월별 학생 데이터 조회
function getSpecialLectureStudents(lectureId, monthKey) {
  const record = appData.specialLectureStudents.find(
    s => s.lectureId === lectureId && s.monthKey === monthKey
  );
  return record ? record.students : [];
}

// 특정 특강의 월별 학생 데이터 설정 (덮어쓰기)
function setSpecialLectureStudents(lectureId, monthKey, students) {
  const existingIndex = appData.specialLectureStudents.findIndex(
    s => s.lectureId === lectureId && s.monthKey === monthKey
  );

  if (existingIndex >= 0) {
    appData.specialLectureStudents[existingIndex].students = students;
  } else {
    appData.specialLectureStudents.push({
      lectureId,
      monthKey,
      students
    });
  }
  saveData(appData);
}

// 특강 학생 추가 (개별)
function addSpecialLectureStudent(lectureId, monthKey, student) {
  const students = getSpecialLectureStudents(lectureId, monthKey);
  const newId = students.length > 0 ? Math.max(...students.map(s => s.id || 0)) + 1 : 1;
  students.push({ id: newId, ...student });
  setSpecialLectureStudents(lectureId, monthKey, students);
  return newId;
}

// 특강 학생 수정
function updateSpecialLectureStudent(lectureId, monthKey, studentId, updates) {
  const students = getSpecialLectureStudents(lectureId, monthKey);
  const student = students.find(s => s.id === studentId);
  if (student) {
    Object.assign(student, updates);
    setSpecialLectureStudents(lectureId, monthKey, students);
  }
}

// 특강 학생 삭제
function deleteSpecialLectureStudent(lectureId, monthKey, studentId) {
  let students = getSpecialLectureStudents(lectureId, monthKey);
  students = students.filter(s => s.id !== studentId);
  setSpecialLectureStudents(lectureId, monthKey, students);
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
          if (dataMode === 'academy') {
            compatibleData.profile = appData.profile;
            compatibleData.uiSettings = appData.uiSettings;
            compatibleData.users = appData.users;
          }
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
function exportPayrollToExcel(monthKey, businessId = 'all') {
  const { year, month } = parseMonthKey(monthKey);

  const headers = ['이름', '유형', '총근무시간/수강료합계', '정산내역', '세전급여', '공제내역', '공제액', '실지급액'];
  const data = [];

  // 시급제 직원
  const staffList = businessId === 'all' ? appData.staff : appData.staff.filter(s => s.businessId === businessId);
  staffList.forEach(staff => {
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
  const commissionList = businessId === 'all'
    ? appData.commissionInstructors
    : appData.commissionInstructors.filter(i => i.businessId === businessId);
  commissionList.forEach(instructor => {
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
    const defaultData = getDefaultData();
    if (dataMode === 'academy') {
      defaultData.profile = appData.profile;
      defaultData.uiSettings = appData.uiSettings;
      defaultData.users = appData.users;
    }
    appData = defaultData;
    saveData(appData);
    return true;
  }
  return false;
}

// 전역 데이터 변수
let appData = loadData();
