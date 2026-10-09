/* ============================================
   강한영어수학학원 급여관리시스템 - 메인 앱
   ============================================ */

// 상태 변수
let currentUser = null;
let currentTab = 'dashboard';
let selectedMonth = getMonthKey();
let selectedRole = 'admin';
let selectedBusiness = 'all';  // 'all' 또는 businessId
let clockIntervalId = null;

// ============ 로그인 관련 ============
function selectRole(role, button) {
  selectedRole = role;
  document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
  if (button) {
    button.classList.add('active');
  }

  document.getElementById('adminLogin').classList.toggle('hidden', role !== 'admin');
  document.getElementById('staffLogin').classList.toggle('hidden', role !== 'staff');
}

// ============ 비밀번호 찾기 ============
function showPasswordRecovery() {
  document.getElementById('adminLogin').classList.add('hidden');
  document.getElementById('staffLogin').classList.add('hidden');
  document.querySelector('.role-selector').classList.add('hidden');
  document.getElementById('passwordRecovery').classList.remove('hidden');
  document.getElementById('recoverResult').innerHTML = '';
}

function hidePasswordRecovery() {
  // 비밀번호 찾기 패널 숨기고 역할 선택 화면 복원
  document.getElementById('passwordRecovery').classList.add('hidden');
  document.querySelector('.role-selector').classList.remove('hidden');
  document.getElementById('adminLogin').classList.toggle('hidden', selectedRole !== 'admin');
  document.getElementById('staffLogin').classList.toggle('hidden', selectedRole !== 'staff');

  // 입력값 및 결과 초기화
  document.getElementById('recoverAcademyCode').value = '';
  document.getElementById('recoverLoginId').value = '';
  document.getElementById('recoverPhone').value = '';
  document.getElementById('recoverResult').innerHTML = '';
}

async function recoverPassword() {
  const academyCode = document.getElementById('recoverAcademyCode').value;
  const loginId = document.getElementById('recoverLoginId').value;
  const phoneNumber = document.getElementById('recoverPhone').value;
  const resultEl = document.getElementById('recoverResult');

  const result = await recoverAcademyPassword(academyCode, loginId, phoneNumber);

  if (!result.success) {
    resultEl.innerHTML = `<p style="color: var(--danger, #e53e3e); font-size: 0.875rem; text-align: center;">${result.message}</p>`;
    return;
  }

  // 자동 로그인하지 않고 정보만 표시
  resultEl.innerHTML = `
    <div style="padding: 0.875rem 1rem; background: var(--bg); border-radius: 10px; font-size: 0.9rem; text-align: center;">
      <div>로그인 ID: <strong>${result.loginId}</strong></div>
      <div>비밀번호: <strong style="font-size: 1.1rem; color: var(--primary);">${result.password}</strong></div>
      <p style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.5rem;">
        위 정보로 로그인한 뒤 비밀번호를 변경해 주세요.
      </p>
    </div>
  `;
}

function populateStaffSelect() {
  const select = document.getElementById('staffSelect');
  if (!select) return;
  select.innerHTML = '<option value="">-- 본인 이름 선택 --</option>';
  // 퇴사하지 않은 직원만 로그인 목록에 표시
  appData.staff
    .filter(s => !s.terminationDate)
    .forEach(s => {
      select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}

function updateBranding() {
  const academyName = typeof getCurrentAcademyName === 'function' ? getCurrentAcademyName() : '급여관리시스템';
  const loginTitle = document.querySelector('.login-title');
  const headerTitle = document.querySelector('.header h1');
  const loginLogo = document.querySelector('.login-logo-icon');
  const headerLogo = document.querySelector('.header-logo');

  if (loginTitle) loginTitle.textContent = academyName;
  if (headerTitle) {
    headerTitle.innerHTML = `<span class="header-logo">${academyName.slice(0, 2)}</span> 급여관리시스템`;
  }
  if (loginLogo) loginLogo.textContent = academyName.slice(0, 2);
  if (headerLogo) headerLogo.textContent = academyName.slice(0, 2);
  document.title = `${academyName} 급여관리시스템`;
}

async function loginAdmin() {
  const academyCode = document.getElementById('adminAcademyCode').value;
  const loginId = document.getElementById('adminLoginId').value;
  const password = document.getElementById('adminPassword').value;

  const result = await authenticateAcademyUser(academyCode, loginId, password, 'admin');
  if (!result.success) {
    alert(result.message);
    return;
  }

  currentUser = result.user;
  document.getElementById('adminPassword').value = '';
  updateBranding();
  showMainApp();
}

async function loginStaff() {
  const academyCode = document.getElementById('staffAcademyCode').value;
  const loginId = document.getElementById('staffLoginId').value;
  const password = document.getElementById('staffPassword').value;

  const result = await authenticateAcademyUser(academyCode, loginId, password, 'staff');
  if (!result.success) {
    alert(result.message);
    return;
  }

  currentUser = result.user;
  document.getElementById('staffPassword').value = '';
  updateBranding();
  showMainApp();
}

function openAcademySignupModal() {
  document.getElementById('modalTitle').textContent = '학원 관리자 가입';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label class="form-label">학원명 *</label>
      <input type="text" id="signupAcademyName" class="form-input" placeholder="학원 이름">
    </div>
    <div class="form-group">
      <label class="form-label">학원코드 *</label>
      <input type="text" id="signupAcademyCode" class="form-input" placeholder="예: ganghan">
      <small style="color: var(--text-light); font-size: 0.75rem;">영문 소문자, 숫자, 하이픈으로 입력하세요.</small>
    </div>
    <div class="form-group">
      <label class="form-label">관리자 이름 *</label>
      <input type="text" id="signupAdminName" class="form-input" placeholder="관리자 이름">
    </div>
    <div class="form-group">
      <label class="form-label">관리자 로그인 ID *</label>
      <input type="text" id="signupAdminLoginId" class="form-input" value="admin" placeholder="관리자 로그인 ID">
    </div>
    <div class="form-group">
      <label class="form-label">비밀번호 *</label>
      <input type="password" id="signupAdminPassword" class="form-input" placeholder="비밀번호">
    </div>
    <div class="form-group">
      <label class="form-label">휴대폰 번호</label>
      <input type="text" id="signupAdminPhone" class="form-input" placeholder="숫자만 입력, 비밀번호 찾기에 사용됩니다">
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="submitAcademySignup()">가입</button>
  `;
  openModal();
}

async function submitAcademySignup() {
  const result = await createAcademySignup({
    academyName: document.getElementById('signupAcademyName').value,
    academyCode: document.getElementById('signupAcademyCode').value,
    adminName: document.getElementById('signupAdminName').value,
    loginId: document.getElementById('signupAdminLoginId').value,
    password: document.getElementById('signupAdminPassword').value,
    phoneNumber: document.getElementById('signupAdminPhone').value
  });

  if (!result.success) {
    alert(result.message);
    return;
  }

  closeModal();
  showToast(`가입 완료. 학원코드: ${result.academyCode}, 관리자 ID: ${result.loginId}`);
}

function openStaffSignupModal() {
  document.getElementById('modalTitle').textContent = '직원 가입 신청';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-section-title">로그인 정보</div>
    <div class="form-group">
      <label class="form-label">학원코드 *</label>
      <input type="text" id="requestAcademyCode" class="form-input" placeholder="예: ganghan">
    </div>
    <div class="form-group">
      <label class="form-label">이름 *</label>
      <input type="text" id="requestStaffName" class="form-input" placeholder="이름">
    </div>
    <div class="form-group">
      <label class="form-label">희망 로그인 ID</label>
      <input type="text" id="requestStaffLoginId" class="form-input" placeholder="비워두면 이름으로 생성">
    </div>
    <div class="form-group">
      <label class="form-label">비밀번호 *</label>
      <input type="password" id="requestStaffPassword" class="form-input" placeholder="비밀번호">
    </div>
    <div class="form-section-title">본인 정보</div>
    <div class="form-group">
      <label class="form-label">휴대폰 번호 *</label>
      <input type="text" id="requestStaffPhoneNumber" class="form-input" placeholder="숫자만 입력" maxlength="11">
      <small style="color: var(--text-light); font-size: 0.75rem;">비밀번호 찾기에 사용됩니다</small>
    </div>
    <div class="form-group">
      <label class="form-label">주민등록번호 *</label>
      <input
        type="text"
        id="requestStaffResidentId"
        class="form-input"
        placeholder="예: 900101-1234567"
        maxlength="14"
        oninput="this.value = formatResidentId(this.value)"
      >
      <small style="color: var(--text-light); font-size: 0.75rem;">급여 신고에 사용됩니다</small>
    </div>
    <div class="form-section-title">급여 받을 계좌</div>
    ${getBankAccountFieldsHTML('requestStaff')}
    <small style="color: var(--text-light); font-size: 0.75rem;">지금 입력하지 않아도 가입 후 '내 정보'에서 등록·수정할 수 있습니다</small>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="submitStaffSignupRequest()">신청</button>
  `;
  openModal();
}

async function submitStaffSignupRequest() {
  const result = await createStaffSignupRequest({
    academyCode: document.getElementById('requestAcademyCode').value,
    name: document.getElementById('requestStaffName').value,
    loginId: document.getElementById('requestStaffLoginId').value,
    password: document.getElementById('requestStaffPassword').value,
    phoneNumber: document.getElementById('requestStaffPhoneNumber').value,
    residentId: document.getElementById('requestStaffResidentId').value,
    ...readBankAccountFields('requestStaff')
  });

  if (!result.success) {
    alert(result.message);
    return;
  }

  closeModal();
  showToast(`가입 신청 완료. 승인 후 로그인 ID: ${result.loginId}`);
}

function logout() {
  currentUser = null;
  currentTab = 'dashboard';
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('mainApp').classList.add('hidden');
}

function showMainApp() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('mainApp').classList.remove('hidden');
  updateBranding();
  renderBusinessSelector();
  renderNavTabs();
  renderContent();
}

// ============ 사업장 선택 ============
function renderBusinessSelector() {
  const container = document.getElementById('businessSelector');

  // 관리자만 사업장 선택 표시
  if (currentUser.role !== 'admin') {
    container.innerHTML = '';
    return;
  }

  const options = appData.businesses.map(b =>
    `<option value="${b.id}" ${selectedBusiness === b.id ? 'selected' : ''}>${b.name}</option>`
  ).join('');

  container.innerHTML = `
    <label>사업장:</label>
    <select onchange="changeBusiness(this.value)">
      <option value="all" ${selectedBusiness === 'all' ? 'selected' : ''}>전체</option>
      ${options}
    </select>
  `;
}

function changeBusiness(value) {
  selectedBusiness = value === 'all' ? 'all' : parseInt(value);
  renderContent();
}

// ============ 네비게이션 ============
function renderNavTabs() {
  const navTabs = document.getElementById('navTabs');

  if (currentUser.role === 'admin') {
    navTabs.innerHTML = `
      <button class="nav-tab ${currentTab === 'dashboard' ? 'active' : ''}" onclick="switchTab('dashboard')">대시보드</button>
      <button class="nav-tab ${currentTab === 'staff' ? 'active' : ''}" onclick="switchTab('staff')">직원관리</button>
      <button class="nav-tab ${currentTab === 'insurance' ? 'active' : ''}" onclick="switchTab('insurance')">4대보험</button>
      <button class="nav-tab ${currentTab === 'commission' ? 'active' : ''}" onclick="switchTab('commission')">비율제강사</button>
      <button class="nav-tab ${currentTab === 'monthlyInstructor' ? 'active' : ''}" onclick="switchTab('monthlyInstructor')">월급제강사</button>
      <button class="nav-tab ${currentTab === 'specialLecture' ? 'active' : ''}" onclick="switchTab('specialLecture')">특강관리</button>
      <button class="nav-tab ${currentTab === 'worklogs' ? 'active' : ''}" onclick="switchTab('worklogs')">근무기록</button>
      <button class="nav-tab ${currentTab === 'payroll' ? 'active' : ''}" onclick="switchTab('payroll')">급여정산</button>
      <button class="nav-tab ${currentTab === 'messages' ? 'active' : ''}" onclick="switchTab('messages')">문자생성</button>
      <button class="nav-tab ${currentTab === 'settings' ? 'active' : ''}" onclick="switchTab('settings')">설정</button>
      <button class="nav-tab" onclick="logout()">로그아웃</button>
    `;
  } else {
    navTabs.innerHTML = `
      <button class="nav-tab ${currentTab === 'mywork' ? 'active' : ''}" onclick="switchTab('mywork')">내 근무기록</button>
      <button class="nav-tab ${currentTab === 'clockin' ? 'active' : ''}" onclick="switchTab('clockin')">출퇴근 기록</button>
      <button class="nav-tab ${currentTab === 'changePassword' ? 'active' : ''}" onclick="switchTab('changePassword')">내 정보</button>
      <button class="nav-tab" onclick="logout()">로그아웃</button>
    `;
    if (currentTab === 'dashboard') currentTab = 'mywork';
  }
}

function switchTab(tab) {
  currentTab = tab;
  renderNavTabs();
  renderContent();
}

function renderContent() {
  const main = document.getElementById('mainContent');

  switch (currentTab) {
    case 'dashboard':
      renderDashboard(main);
      break;
    case 'staff':
      renderStaffManagement(main);
      break;
    case 'insurance':
      renderInsuranceTeachers(main);
      break;
    case 'commission':
      renderCommissionInstructors(main);
      break;
    case 'monthlyInstructor':
      renderMonthlyInstructors(main);
      break;
    case 'specialLecture':
      renderSpecialLectures(main);
      break;
    case 'worklogs':
      renderWorkLogs(main);
      break;
    case 'payroll':
      renderPayroll(main);
      break;
    case 'messages':
      renderMessages(main);
      break;
    case 'settings':
      renderSettings(main);
      break;
    case 'mywork':
      renderMyWork(main);
      break;
    case 'clockin':
      renderClockIn(main);
      break;
    case 'changePassword':
      renderChangePassword(main);
      break;
  }
}

function changeMonth(value) {
  selectedMonth = value;
  renderContent();
}

// ============ 대시보드 ============
function renderDashboard(container) {
  const { year, month } = parseMonthKey(selectedMonth);
  const businessTitle = selectedBusiness === 'all' ? '전체' : getBusinessName(selectedBusiness);

  // 급여정산 탭과 완전히 동일한 통합 데이터 사용 (합계가 서로 어긋나지 않도록)
  const rows = sortPayrollRows(buildPayrollRows(selectedMonth, selectedBusiness), 'type');
  const total = sumPayrollRows(rows);

  // 등록 인원 (재직자 기준)
  const activeHeadcount =
    getStaffByBusiness(selectedBusiness).filter(s => !s.terminationDate).length +
    getCommissionInstructorsByBusiness(selectedBusiness).filter(i => !i.terminationDate).length +
    getMonthlyInstructorsByBusiness(selectedBusiness).filter(i => !i.terminationDate).length +
    getInsuranceTeachersByBusiness(selectedBusiness).filter(t => !t.terminationDate).length;

  // 유형별 소계
  const typeStats = PAYROLL_TYPES.map(t => {
    const typeRows = rows.filter(r => r.type === t.key);
    return Object.assign({}, t, sumPayrollRows(typeRows));
  });

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem;">
      <h2 style="color: var(--primary);">${year}년 ${month}월 대시보드 - ${businessTitle}</h2>
      <div class="month-selector">
        <input type="month" value="${selectedMonth}" onchange="changeMonth(this.value)">
      </div>
    </div>

    ${renderPendingMonthlyInstructorNoticeHTML()}

    <div class="summary-grid">
      <div class="summary-card primary">
        <div class="summary-label">총 지급 예정액</div>
        <div class="summary-value">${formatKRW(total.net)}</div>
        <div class="summary-sub">세후 실지급액</div>
      </div>
      <div class="summary-card accent">
        <div class="summary-label">총 급여 (세전)</div>
        <div class="summary-value">${formatKRW(total.gross)}</div>
        <div class="summary-sub">공제 전 금액</div>
      </div>
      <div class="summary-card">
        <div class="summary-label" style="color: var(--text-light);">총 공제액</div>
        <div class="summary-value" style="color: var(--danger);">${formatKRW(total.deduction)}</div>
        <div class="summary-sub" style="color: var(--text-light);">4대보험·고용보험·사업소득세·카드수수료</div>
      </div>
      <div class="summary-card">
        <div class="summary-label" style="color: var(--text-light);">등록 인원</div>
        <div class="summary-value" style="color: var(--primary);">${activeHeadcount}명</div>
        <div class="summary-sub" style="color: var(--text-light);">이 달 정산 ${total.count}건</div>
      </div>
    </div>

    <div class="type-summary-grid">
      ${typeStats.map(t => `
        <div class="type-summary-item">
          <div class="tsi-head">
            <span class="badge ${t.badge}">${t.label}</span>
            <span class="tsi-count">${t.count}건</span>
          </div>
          <div class="tsi-net">${formatKRW(t.net)}</div>
          <div class="tsi-sub">세전 ${formatKRW(t.gross)} · 공제 ${formatKRW(t.deduction)}</div>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${month}월 급여 현황 (${rows.length}건)</h3>
        <button class="btn btn-outline btn-sm" onclick="switchTab('payroll')">급여정산에서 편집</button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>주민번호</th>
              <th>소속</th>
              <th>유형</th>
              <th>기준 내역</th>
              <th>세전 급여</th>
              <th>공제액</th>
              <th>실지급액</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length > 0 ? `
              ${rows.map(row => `
                <tr>
                  <td><strong>${row.name}</strong></td>
                  <td style="font-family: monospace; font-size: 0.8125rem;">${row.residentId}</td>
                  <td><span class="badge badge-business">${row.businessName}</span></td>
                  <td><span class="badge ${row.badgeClass}">${row.typeLabel}</span></td>
                  <td style="font-size: 0.8125rem;">${row.basisText}</td>
                  <td>${formatKRW(row.gross)}</td>
                  <td style="color: var(--danger);">-${formatKRW(row.deduction)}</td>
                  <td><strong style="color: var(--success);">${formatKRW(row.net)}</strong></td>
                </tr>
              `).join('')}
              <tr style="border-top: 2px solid var(--border); background: var(--bg); font-weight: 700;">
                <td colspan="5">합계 (${total.count}건)</td>
                <td>${formatKRW(total.gross)}</td>
                <td style="color: var(--danger);">-${formatKRW(total.deduction)}</td>
                <td style="color: var(--success);">${formatKRW(total.net)}</td>
              </tr>
            ` : `
              <tr><td colspan="8" class="empty-state">이 달의 급여 데이터가 없습니다.</td></tr>
            `}
          </tbody>
        </table>
      </div>
    </div>

    ${renderMonthlyComparisonHTML()}
  `;
}

// ============ 월별 비교 ============

let compareMonthCount = 6;  // 대시보드 하단 비교표에 표시할 개월 수

function setCompareMonthCount(count) {
  compareMonthCount = parseInt(count, 10) || 6;
  renderContent();
}

// 기준월(endMonthKey)까지 최근 count개월의 월키 배열 (오래된 달 → 최신 달 순)
function getMonthKeysUntil(endMonthKey, count) {
  const { year, month } = parseMonthKey(endMonthKey);
  const keys = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(getMonthKey(new Date(year, month - 1 - i, 1)));
  }
  return keys;
}

/**
 * 여러 달의 급여를 한 번에 집계
 * - typeTotals: 유형별 × 월별 합계
 * - monthTotals: 월별 전체 합계
 * - people: 사람별 × 월별 실지급액
 */
function buildMonthlyComparison(monthKeys, businessId) {
  const typeTotals = {};
  const monthTotals = {};
  const peopleMap = new Map();

  PAYROLL_TYPES.forEach(t => { typeTotals[t.key] = {}; });

  monthKeys.forEach(monthKey => {
    const rows = buildPayrollRows(monthKey, businessId);
    monthTotals[monthKey] = sumPayrollRows(rows);

    PAYROLL_TYPES.forEach(t => {
      typeTotals[t.key][monthKey] = sumPayrollRows(rows.filter(r => r.type === t.key));
    });

    rows.forEach(row => {
      // 같은 사람이라도 유형·사업장이 다르면 별도 행으로 봅니다
      const key = `${row.type}|${row.businessId}|${row.name}`;
      let person = peopleMap.get(key);
      if (!person) {
        person = {
          key,
          type: row.type,
          name: row.name,
          typeLabel: row.typeLabel,
          badgeClass: row.badgeClass,
          businessName: row.businessName,
          byMonth: {},
          total: 0
        };
        peopleMap.set(key, person);
      }
      person.byMonth[monthKey] = (person.byMonth[monthKey] || 0) + row.net;
      person.typeLabel = row.typeLabel;  // 최신 달 기준 라벨 (비율 변동 반영)
      person.total += row.net;
    });
  });

  const order = {};
  PAYROLL_TYPES.forEach((t, i) => { order[t.key] = i; });
  const people = Array.from(peopleMap.values())
    .sort((a, b) => (order[a.type] - order[b.type]) || a.name.localeCompare(b.name, 'ko'));

  return { monthKeys, typeTotals, monthTotals, people };
}

// 월 헤더 (2줄: 월 / 연도)
function formatCompareMonthHeader(monthKey) {
  const { year, month } = parseMonthKey(monthKey);
  return `${month}월<br><span style="font-size: 0.7rem; color: var(--text-light); text-transform: none;">${year}</span>`;
}

// 금액 셀 (0원이면 '–')
function compareAmountCell(amount) {
  return amount > 0 ? formatKRW(amount) : '<span style="color: var(--border);">–</span>';
}

// ============ 월별 변동 분석 ============

// 증감 표기: "▲ 120,000원" / "▼ 50,000원" / "변동 없음"
function formatSignedKRW(diff) {
  if (diff === 0) return '변동 없음';
  return `${diff > 0 ? '▲' : '▼'} ${formatKRW(Math.abs(diff))}`;
}

// 증감률 표기 (기준 금액이 없으면 빈 문자열)
function formatChangeRate(current, base) {
  if (!(base > 0)) return '';
  const rate = (current - base) / base * 100;
  return `${rate > 0 ? '+' : ''}${rate.toFixed(1)}%`;
}

// 만원 단위 축약 (차트 라벨용)
function formatManwon(amount) {
  return `${Math.round(amount / 10000).toLocaleString('ko-KR')}만`;
}

// 기준월까지 같은 방향으로 몇 달 연속 변했는지 ("3개월 연속 ▲")
function getPayStreakLabel(amounts) {
  let streak = 0;
  let direction = 0;
  for (let i = amounts.length - 1; i > 0; i--) {
    const diff = amounts[i] - amounts[i - 1];
    const sign = Math.sign(diff);
    if (sign === 0 || amounts[i - 1] === 0) break;
    if (direction === 0) direction = sign;
    if (sign !== direction) break;
    streak++;
  }
  return streak >= 2 ? `${streak}개월 연속 ${direction > 0 ? '▲' : '▼'}` : '';
}

// 사람별 최근 N개월 미니 막대 (추이)
function paySparklineHTML(amounts, monthKeys) {
  const max = Math.max(...amounts, 1);
  const barWidth = 6, gap = 2, height = 24;
  const width = amounts.length * (barWidth + gap) - gap;
  const tip = monthKeys.map((mk, i) => `${parseMonthKey(mk).month}월 ${formatKRW(amounts[i])}`).join(' / ');
  return `
    <svg class="pay-sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${tip}">
      <title>${tip}</title>
      ${amounts.map((amount, i) => {
        const h = amount > 0 ? Math.max(2, Math.round(amount / max * height)) : 1;
        return `<rect x="${i * (barWidth + gap)}" y="${height - h}" width="${barWidth}" height="${h}" rx="1" class="${amount > 0 ? '' : 'empty'}"></rect>`;
      }).join('')}
    </svg>`;
}

/**
 * 기준월과 전월을 비교한 변동 분석 카드
 * - 요약 타일 / 한눈에 보는 문장 / 월별 합계 막대 / 직원별 증감 표
 */
function renderPayChangeAnalysisHTML(monthKeys, monthTotals, typeTotals, people) {
  const curKey = monthKeys[monthKeys.length - 1];
  const prevKey = monthKeys[monthKeys.length - 2];
  const curMonth = parseMonthKey(curKey).month;
  const prevMonth = parseMonthKey(prevKey).month;

  const curTotal = monthTotals[curKey].net;
  const prevTotal = monthTotals[prevKey].net;
  const totalDiff = curTotal - prevTotal;

  // 기준월을 제외한 이전 달들의 평균 (급여가 있었던 달만)
  const pastNets = monthKeys.slice(0, -1).map(mk => monthTotals[mk].net).filter(v => v > 0);
  const pastAverage = pastNets.length > 0 ? Math.round(pastNets.reduce((s, v) => s + v, 0) / pastNets.length) : 0;

  // 직원별 증감
  const changes = people.map(p => {
    const amounts = monthKeys.map(mk => p.byMonth[mk] || 0);
    const cur = amounts[amounts.length - 1];
    const prev = amounts[amounts.length - 2];
    const paid = amounts.filter(v => v > 0);
    return {
      person: p,
      amounts,
      cur,
      prev,
      diff: cur - prev,
      average: paid.length > 0 ? Math.round(paid.reduce((s, v) => s + v, 0) / paid.length) : 0,
      isNew: cur > 0 && prev === 0,
      isGone: cur === 0 && prev > 0,
      streak: getPayStreakLabel(amounts)
    };
  }).filter(c => c.cur > 0 || c.prev > 0)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff) || a.person.name.localeCompare(b.person.name, 'ko'));

  const newcomers = changes.filter(c => c.isNew);
  const gone = changes.filter(c => c.isGone);
  const continuing = changes.filter(c => !c.isNew && !c.isGone);
  const topUp = continuing.filter(c => c.diff > 0)[0];
  const topDown = continuing.filter(c => c.diff < 0)[0];
  const unchangedCount = continuing.filter(c => c.diff === 0).length;
  const maxAbsDiff = Math.max(...changes.map(c => Math.abs(c.diff)), 1);

  // 유형별 증감 (변동이 있는 유형만, 큰 순)
  const typeChanges = PAYROLL_TYPES.map(t => ({
    label: t.label,
    badge: t.badge,
    diff: typeTotals[t.key][curKey].net - typeTotals[t.key][prevKey].net
  })).filter(t => t.diff !== 0).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const names = list => list.map(c => escapeHtml(c.person.name)).join(', ');
  const rateText = (cur, base) => {
    const rate = formatChangeRate(cur, base);
    return rate ? ` (${rate})` : '';
  };

  // 한눈에 보는 요약 문장
  const insights = [];
  if (prevTotal === 0 && curTotal === 0) {
    insights.push(`${prevMonth}월과 ${curMonth}월 모두 급여 데이터가 없습니다.`);
  } else {
    insights.push(totalDiff === 0
      ? `${curMonth}월 실지급 합계는 <strong>${formatKRW(curTotal)}</strong>으로 ${prevMonth}월과 같습니다.`
      : `${curMonth}월 실지급 합계는 <strong>${formatKRW(curTotal)}</strong>으로 ${prevMonth}월보다 <strong>${formatKRW(Math.abs(totalDiff))}${rateText(curTotal, prevTotal)} ${totalDiff > 0 ? '늘었습니다' : '줄었습니다'}</strong>.`);
    if (typeChanges.length > 0) {
      insights.push(`유형별로는 ${typeChanges.map(t => `<span class="badge ${t.badge}">${t.label}</span> ${formatSignedKRW(t.diff)}`).join(' · ')}`);
    }
    if (topUp) insights.push(`가장 많이 늘어난 사람: <strong>${escapeHtml(topUp.person.name)}</strong> ${formatSignedKRW(topUp.diff)}${rateText(topUp.cur, topUp.prev)}`);
    if (topDown) insights.push(`가장 많이 줄어든 사람: <strong>${escapeHtml(topDown.person.name)}</strong> ${formatSignedKRW(topDown.diff)}${rateText(topDown.cur, topDown.prev)}`);
    if (newcomers.length > 0) insights.push(`${curMonth}월에 새로 지급: ${names(newcomers)} (합계 ${formatKRW(newcomers.reduce((s, c) => s + c.cur, 0))})`);
    if (gone.length > 0) insights.push(`${prevMonth}월엔 지급했지만 ${curMonth}월엔 없음: ${names(gone)} (합계 ${formatKRW(gone.reduce((s, c) => s + c.prev, 0))})`);
    if (unchangedCount > 0) insights.push(`${unchangedCount}명은 전월과 금액이 같습니다.`);
  }

  // 월별 합계 막대: 숫자 라벨은 기준월·최고·최저만 (나머지는 마우스를 올리면 표시)
  const nets = monthKeys.map(mk => monthTotals[mk].net);
  const maxNet = Math.max(...nets, 1);
  const positiveNets = nets.filter(v => v > 0);
  const minNet = positiveNets.length > 0 ? Math.min(...positiveNets) : 0;
  const labeled = new Set([nets.length - 1, nets.indexOf(maxNet), nets.indexOf(minNet)]);

  return `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${curMonth}월 변동 분석 (${prevMonth}월 대비)</h3>
      </div>

      <div class="type-summary-grid">
        <div class="type-summary-item">
          <div class="tsi-count">${prevMonth}월 대비</div>
          <div class="analysis-figure">${formatSignedKRW(totalDiff)}</div>
          <div class="tsi-sub">${formatKRW(prevTotal)} → ${formatKRW(curTotal)}${rateText(curTotal, prevTotal)}</div>
        </div>
        <div class="type-summary-item">
          <div class="tsi-count">이전 ${pastNets.length}개월 평균 대비</div>
          <div class="analysis-figure">${pastAverage > 0 ? formatSignedKRW(curTotal - pastAverage) : '-'}</div>
          <div class="tsi-sub">${pastAverage > 0 ? `평균 ${formatKRW(pastAverage)}${rateText(curTotal, pastAverage)}` : '비교할 이전 달이 없습니다'}</div>
        </div>
        <div class="type-summary-item">
          <div class="tsi-count">지급 인원 변동</div>
          <div class="analysis-figure">신규 ${newcomers.length}명 · 빠짐 ${gone.length}명</div>
          <div class="tsi-sub">늘어남 ${continuing.filter(c => c.diff > 0).length}명 · 줄어듦 ${continuing.filter(c => c.diff < 0).length}명 · 동일 ${unchangedCount}명</div>
        </div>
      </div>

      <ul class="analysis-insights">
        ${insights.map(text => `<li>${text}</li>`).join('')}
      </ul>

      <div class="analysis-subtitle">월별 실지급 합계</div>
      <div class="trend-chart">
        ${monthKeys.map((mk, i) => {
          const { year, month } = parseMonthKey(mk);
          return `
            <div class="trend-col ${i === nets.length - 1 ? 'current' : ''}" data-tip="${year}년 ${month}월 · ${formatKRW(nets[i])}" tabindex="0">
              <div class="trend-bar-area">
                <div class="trend-value">${labeled.has(i) && nets[i] > 0 ? formatManwon(nets[i]) : ''}</div>
                <div class="trend-bar" style="height: ${nets[i] > 0 ? Math.max(1, nets[i] / maxNet * 100) : 0}%;"></div>
              </div>
              <div class="trend-label">${month}월</div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="analysis-subtitle">
        직원별 증감 (변동 큰 순)
        <span class="analysis-legend"><span class="legend-swatch up"></span>늘어남 <span class="legend-swatch down"></span>줄어듦</span>
      </div>
      <div class="table-container">
        <table class="compare-table">
          <thead>
            <tr>
              <th class="sticky-col">이름</th>
              <th>유형</th>
              <th class="num">${prevMonth}월</th>
              <th class="num">${curMonth}월</th>
              <th>증감</th>
              <th class="num">증감률</th>
              <th class="num">기간 평균</th>
              <th>최근 ${monthKeys.length}개월 추이</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            ${changes.length > 0 ? changes.map(c => {
              const barWidth = Math.round(Math.abs(c.diff) / maxAbsDiff * 50);
              const notes = [];
              if (c.isNew) notes.push('신규 지급');
              if (c.isGone) notes.push('이번 달 지급 없음');
              if (c.streak) notes.push(c.streak);
              return `
                <tr>
                  <td class="sticky-col"><strong>${escapeHtml(c.person.name)}</strong></td>
                  <td><span class="badge ${c.person.badgeClass}">${c.person.typeLabel}</span></td>
                  <td class="num">${compareAmountCell(c.prev)}</td>
                  <td class="num">${compareAmountCell(c.cur)}</td>
                  <td>
                    <div class="change-cell">
                      <div class="change-track">
                        ${c.diff !== 0 ? `<div class="change-bar ${c.diff > 0 ? 'up' : 'down'}" style="width: ${Math.max(2, barWidth)}%;"></div>` : ''}
                      </div>
                      <span>${formatSignedKRW(c.diff)}</span>
                    </div>
                  </td>
                  <td class="num">${formatChangeRate(c.cur, c.prev) || '–'}</td>
                  <td class="num">${compareAmountCell(c.average)}</td>
                  <td>${paySparklineHTML(c.amounts, monthKeys)}</td>
                  <td class="cell-small">${notes.join(' · ')}</td>
                </tr>
              `;
            }).join('') : `<tr><td colspan="9" class="empty-state">${prevMonth}월과 ${curMonth}월의 급여 데이터가 없습니다.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderMonthlyComparisonHTML() {
  const monthKeys = getMonthKeysUntil(selectedMonth, compareMonthCount);
  const { typeTotals, monthTotals, people } = buildMonthlyComparison(monthKeys, selectedBusiness);

  const grandTotal = monthKeys.reduce((s, mk) => s + monthTotals[mk].net, 0);
  const activeMonths = monthKeys.filter(mk => monthTotals[mk].net > 0).length;
  const average = activeMonths > 0 ? Math.round(grandTotal / activeMonths) : 0;
  const colCount = monthKeys.length;

  return `
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin: 2rem 0 1rem;">
      <h3 style="color: var(--primary); font-size: 1.125rem;">월별 비교 (${parseMonthKey(monthKeys[0]).year}년 ${parseMonthKey(monthKeys[0]).month}월 ~ ${parseMonthKey(selectedMonth).year}년 ${parseMonthKey(selectedMonth).month}월)</h3>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        ${[3, 6, 12].map(n => `
          <button class="filter-chip ${compareMonthCount === n ? 'active' : ''}" onclick="setCompareMonthCount(${n})">최근 ${n}개월</button>
        `).join('')}
      </div>
    </div>

    <div style="margin-bottom: 1.5rem; padding: 0.875rem 1rem; background: var(--bg); border-radius: 10px; font-size: 0.8125rem; color: var(--text-light);">
      기간 합계 <strong style="color: var(--success);">${formatKRW(grandTotal)}</strong> ·
      월 평균 <strong style="color: var(--text);">${formatKRW(average)}</strong>
      ${activeMonths > 0 && activeMonths < colCount ? ` <span>(급여 발생 ${activeMonths}개월 기준)</span>` : ''}
      &nbsp;|&nbsp; 위 월 선택기를 바꾸면 비교 기준월이 함께 이동합니다.
    </div>

    ${renderPayChangeAnalysisHTML(monthKeys, monthTotals, typeTotals, people)}

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">월별 총액 추이</h3>
      </div>
      <div class="table-container">
        <table class="compare-table">
          <thead>
            <tr>
              <th class="sticky-col">구분</th>
              ${monthKeys.map(mk => `<th class="num">${formatCompareMonthHeader(mk)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${PAYROLL_TYPES.map(t => `
              <tr>
                <td class="sticky-col"><span class="badge ${t.badge}">${t.label}</span></td>
                ${monthKeys.map(mk => `<td class="num">${compareAmountCell(typeTotals[t.key][mk].net)}</td>`).join('')}
              </tr>
            `).join('')}
            <tr class="total-row">
              <td class="sticky-col">실지급 합계</td>
              ${monthKeys.map(mk => `<td class="num" style="color: var(--success);">${compareAmountCell(monthTotals[mk].net)}</td>`).join('')}
            </tr>
            <tr>
              <td class="sticky-col" style="color: var(--text-light);">전월 대비</td>
              ${monthKeys.map((mk, i) => {
                if (i === 0) return '<td class="num" style="color: var(--border);">–</td>';
                const diff = monthTotals[mk].net - monthTotals[monthKeys[i - 1]].net;
                if (diff === 0) return '<td class="num" style="color: var(--text-light);">0원</td>';
                const color = diff > 0 ? 'var(--danger)' : 'var(--success)';
                return `<td class="num" style="color: ${color};">${diff > 0 ? '+' : '−'}${formatKRW(Math.abs(diff))}</td>`;
              }).join('')}
            </tr>
            <tr>
              <td class="sticky-col" style="color: var(--text-light);">세전 급여</td>
              ${monthKeys.map(mk => `<td class="num" style="color: var(--text-light);">${compareAmountCell(monthTotals[mk].gross)}</td>`).join('')}
            </tr>
            <tr>
              <td class="sticky-col" style="color: var(--text-light);">공제액</td>
              ${monthKeys.map(mk => `<td class="num" style="color: var(--text-light);">${compareAmountCell(monthTotals[mk].deduction)}</td>`).join('')}
            </tr>
            <tr>
              <td class="sticky-col" style="color: var(--text-light);">정산 건수</td>
              ${monthKeys.map(mk => `<td class="num" style="color: var(--text-light);">${monthTotals[mk].count}건</td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">사람별 월별 실지급액 (${people.length}명)</h3>
      </div>
      <div class="table-container">
        <table class="compare-table">
          <thead>
            <tr>
              <th class="sticky-col">이름</th>
              <th>유형</th>
              <th>소속</th>
              ${monthKeys.map(mk => `<th class="num">${formatCompareMonthHeader(mk)}</th>`).join('')}
              <th class="num">기간 합계</th>
            </tr>
          </thead>
          <tbody>
            ${people.length > 0 ? `
              ${people.map(p => `
                <tr>
                  <td class="sticky-col"><strong>${p.name}</strong></td>
                  <td><span class="badge ${p.badgeClass}">${p.typeLabel}</span></td>
                  <td><span class="badge badge-business">${p.businessName}</span></td>
                  ${monthKeys.map(mk => `<td class="num">${compareAmountCell(p.byMonth[mk] || 0)}</td>`).join('')}
                  <td class="num"><strong style="color: var(--success);">${formatKRW(p.total)}</strong></td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td class="sticky-col">합계</td>
                <td colspan="2"></td>
                ${monthKeys.map(mk => `<td class="num" style="color: var(--success);">${compareAmountCell(monthTotals[mk].net)}</td>`).join('')}
                <td class="num" style="color: var(--success);">${formatKRW(grandTotal)}</td>
              </tr>
            ` : `
              <tr><td colspan="${colCount + 4}" class="empty-state">이 기간의 급여 데이터가 없습니다.</td></tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============ 재직/퇴사 보기 공통 ============
// 목록별 보기 상태: 'active'(재직) | 'terminated'(퇴사) | 'all'(전체)
const employmentView = { staff: 'active', monthlyInstructor: 'active', insurance: 'active' };
let terminatedSortOrder = 'desc';  // 'desc' 최근 퇴사순 | 'asc' 오래된 퇴사순

function setEmploymentView(key, view) {
  employmentView[key] = view;
  renderContent();
}

function toggleTerminatedSortOrder() {
  terminatedSortOrder = terminatedSortOrder === 'desc' ? 'asc' : 'desc';
  renderContent();
}

// 보기 상태에 맞는 목록 반환. 퇴사자는 항상 퇴사일 순으로 정렬하고, '전체'에서는 재직자 뒤에 붙입니다.
function getEmploymentViewList(key, list) {
  const direction = terminatedSortOrder === 'asc' ? 1 : -1;
  const active = list.filter(p => !p.terminationDate);
  const terminated = list
    .filter(p => !!p.terminationDate)
    .sort((a, b) => direction * String(a.terminationDate).localeCompare(String(b.terminationDate)));
  const view = terminated.length > 0 ? employmentView[key] : 'active';
  const rows = view === 'terminated' ? terminated : (view === 'all' ? [...active, ...terminated] : active);
  return { view, rows, activeCount: active.length, terminatedCount: terminated.length };
}

// 재직 / 퇴사 / 전체 전환 칩 (퇴사자가 없으면 표시하지 않음)
function renderEmploymentViewChips(key, info) {
  if (info.terminatedCount === 0) return '';
  const chip = (view, label, count) => `
    <button class="filter-chip ${info.view === view ? 'active' : ''}" onclick="setEmploymentView('${key}', '${view}')">
      ${label}<span class="chip-count">${count}</span>
    </button>`;
  return `
    <div class="employment-view">
      ${chip('active', '재직', info.activeCount)}
      ${chip('terminated', '퇴사', info.terminatedCount)}
      ${chip('all', '전체', info.activeCount + info.terminatedCount)}
      ${info.view !== 'active' ? `
        <button class="filter-chip" onclick="toggleTerminatedSortOrder()" title="퇴사일 정렬 순서 바꾸기">
          ${terminatedSortOrder === 'desc' ? '최근 퇴사순 ↓' : '오래된 퇴사순 ↑'}
        </button>
      ` : ''}
    </div>`;
}

// 퇴사 월이 바뀌는 지점에 넣는 구분 행 ("2026년 8월 퇴사 · 2명")
function terminationGroupRowHTML(rows, index, colspan) {
  const person = rows[index];
  if (!person.terminationDate) return '';
  const monthKey = String(person.terminationDate).slice(0, 7);
  const prev = rows[index - 1];
  if (prev && prev.terminationDate && String(prev.terminationDate).slice(0, 7) === monthKey) return '';
  const { year, month } = parseMonthKey(monthKey);
  const count = rows.filter(p => p.terminationDate && String(p.terminationDate).slice(0, 7) === monthKey).length;
  return `<tr class="termination-group-row"><td colspan="${colspan}">${year}년 ${month}월 퇴사 · ${count}명</td></tr>`;
}

// 입사일/퇴사일 셀
function employmentPeriodHTML(person) {
  return `
    <div>입사 ${person.hireDate || '-'}</div>
    ${person.terminationDate ? `<div style="color: var(--danger); font-weight: 600;">퇴사 ${person.terminationDate}</div>` : ''}`;
}

// ============ 급여 계좌 입력/표시 공통 ============
function getBankAccountFieldsHTML(prefix, person = null) {
  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">은행</label>
        <input type="text" id="${prefix}BankName" class="form-input" list="${prefix}BankNameOptions" value="${escapeHtml(person?.bankName || '')}" placeholder="예: 국민은행">
        <datalist id="${prefix}BankNameOptions">
          ${BANK_NAMES.map(bank => `<option value="${bank}"></option>`).join('')}
        </datalist>
      </div>
      <div class="form-group">
        <label class="form-label">계좌번호</label>
        <input type="text" id="${prefix}AccountNumber" class="form-input" inputmode="numeric" value="${escapeHtml(person?.accountNumber || '')}" placeholder="숫자와 - 만 입력" oninput="this.value = this.value.replace(/[^\\d-]/g, '')">
      </div>
      <div class="form-group">
        <label class="form-label">예금주</label>
        <input type="text" id="${prefix}AccountHolder" class="form-input" value="${escapeHtml(person?.accountHolder || '')}" placeholder="비워두면 본인 이름">
      </div>
    </div>`;
}

// 계좌 입력값 읽기. 예금주를 비워두면 fallbackHolder(본인 이름)로 채웁니다.
function readBankAccountFields(prefix, fallbackHolder = '') {
  const account = normalizeBankAccount({
    bankName: document.getElementById(`${prefix}BankName`).value,
    accountNumber: document.getElementById(`${prefix}AccountNumber`).value,
    accountHolder: document.getElementById(`${prefix}AccountHolder`).value
  });
  if (account.accountNumber && !account.accountHolder) account.accountHolder = fallbackHolder;
  return account;
}

// 목록의 계좌 셀 (복사 버튼 포함)
function bankAccountCellHTML(person) {
  const account = formatBankAccount(person);
  if (!account) return '<span style="color: var(--text-light);">미등록</span>';
  const showHolder = person.accountHolder && person.accountHolder !== person.name;
  return `
    <div class="account-cell">
      <span>${escapeHtml(person.bankName)} <span class="cell-mono">${escapeHtml(person.accountNumber)}</span></span>
      <button class="btn btn-outline btn-sm" data-copy="${escapeHtml(account)}" onclick="copyToClipboard(this.dataset.copy)">복사</button>
    </div>
    ${showHolder ? `<div class="cell-sub">예금주 ${escapeHtml(person.accountHolder)}</div>` : ''}`;
}

// ============ 직원관리 ============
function renderStaffManagement(container) {
  // 선택된 사업장에 따라 직원 필터링
  const viewInfo = getEmploymentViewList('staff', getStaffByBusiness(selectedBusiness));
  const filteredStaff = viewInfo.rows;
  const missingAccountCount = filteredStaff.filter(s => !s.terminationDate && !formatBankAccount(s)).length;

  container.innerHTML = `
    <div class="card">
      <div class="card-header" style="flex-wrap: wrap; gap: 0.75rem;">
        <h3 class="card-title">직원 관리 (${filteredStaff.length}명)</h3>
        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
          ${renderEmploymentViewChips('staff', viewInfo)}
          <button class="btn btn-primary" onclick="openAddStaffModal()">+ 직원 추가</button>
        </div>
      </div>
      ${missingAccountCount > 0 ? `
        <div style="margin-bottom: 0.75rem; color: var(--text-light); font-size: 0.8125rem;">
          급여 계좌 미등록 ${missingAccountCount}명 — 직원이 로그인 후 <strong style="color: var(--text);">내 정보</strong>에서 직접 입력할 수 있습니다.
        </div>
      ` : ''}
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>소속 · 유형</th>
              <th>로그인ID</th>
              <th>주민번호</th>
              <th>시급</th>
              <th>급여 계좌</th>
              <th>근무 기간</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStaff.length > 0 ? filteredStaff.map((staff, index) => {
              const isTerminated = !!staff.terminationDate;

              let wageInfo = '';
              if (staff.tier1Hours > 0) {
                wageInfo = `첫 ${staff.tier1Hours}시간 ${formatKRW(staff.tier1Rate)}<br>이후 ${formatKRW(staff.tier2Rate)}`;
              } else {
                wageInfo = `${formatKRW(staff.tier2Rate || staff.hourlyRate)}/시간`;
              }
              const typeName = staff.type === 'assistant' ? '조교' : '강사';
              const deductionType = staff.type === 'assistant' ? '고용보험 0.9%' : '3.3%';

              return `
                ${terminationGroupRowHTML(filteredStaff, index, 8)}
                <tr class="${isTerminated ? 'row-terminated' : ''}">
                  <td>
                    <strong>${staff.name}</strong>
                    ${isTerminated ? '<span class="badge badge-terminated">퇴사</span>' : ''}
                    ${staff.position ? `<div class="cell-sub">${staff.position}</div>` : ''}
                  </td>
                  <td>
                    <span class="badge badge-business">${getBusinessName(staff.businessId)}</span>
                    <span class="badge ${staff.type === 'assistant' ? 'badge-assistant' : 'badge-instructor'}">${typeName}</span>
                  </td>
                  <td class="cell-small">${staff.loginId || '-'}</td>
                  <td class="cell-mono">${staff.residentId || '-'}</td>
                  <td class="cell-small">
                    ${wageInfo}
                    <div class="cell-sub">공제 ${deductionType}</div>
                  </td>
                  <td class="cell-small">${bankAccountCellHTML(staff)}</td>
                  <td class="cell-small" style="white-space: nowrap;">${employmentPeriodHTML(staff)}</td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-outline btn-sm" onclick="openEditStaffModal(${staff.id})">수정</button>
                      <button class="btn btn-warning btn-sm" onclick="resetStaffPassword(${staff.id})">비번초기화</button>
                      <button class="btn btn-danger btn-sm" onclick="confirmDeleteStaff(${staff.id})">삭제</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('') : '<tr><td colspan="8" class="empty-state">등록된 직원이 없습니다.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function getStaffFormHTML(staff = null, options = {}) {
  // 기본 선택 사업장 결정: 수정 시 기존 값, 추가 시 선택된 사업장 또는 첫번째 사업장
  const defaultBusinessId = staff?.businessId ||
    (selectedBusiness !== 'all' ? selectedBusiness : appData.businesses[0]?.id);

  // 직급 옵션 정의
  const positionOptions = ['원장', '실장', '주임', '일반'];
  const isCustomPosition = staff?.position && !positionOptions.includes(staff.position);

  return `
    <div class="form-section-title">기본 정보</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">이름 *</label>
        <input type="text" id="staffName" class="form-input" value="${staff?.name || ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">로그인 ID</label>
        <input type="text" id="staffLoginId" class="form-input" value="${staff?.loginId || ''}" ${options.lockLoginId ? 'readonly' : ''} placeholder="비워두면 이름으로 생성">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">소속 사업장 *</label>
        <select id="staffBusinessId" class="form-select">
          ${appData.businesses.map(b =>
            `<option value="${b.id}" ${defaultBusinessId === b.id ? 'selected' : ''}>${b.name}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">직급</label>
        <select id="staffPosition" class="form-select" onchange="toggleCustomPosition(this)">
          <option value="">선택 안함</option>
          ${positionOptions.map(p => `
            <option value="${p}" ${staff?.position === p ? 'selected' : ''}>${p}</option>
          `).join('')}
          <option value="custom" ${isCustomPosition ? 'selected' : ''}>기타 (직접입력)</option>
        </select>
      </div>
      <div class="form-group" id="customPositionGroup" style="display: ${isCustomPosition ? 'block' : 'none'};">
        <label class="form-label">직급 직접입력</label>
        <input type="text" id="staffPositionCustom" class="form-input" value="${isCustomPosition ? staff.position : ''}" placeholder="직급 입력">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">휴대폰 번호</label>
        <input type="text" id="staffPhoneNumber" class="form-input" value="${staff?.phoneNumber || ''}" placeholder="숫자만 입력">
      </div>
      <div class="form-group">
        <label class="form-label">주민등록번호</label>
        <input
          type="text"
          id="staffResidentId"
          class="form-input"
          value="${formatResidentId(staff?.residentId || '')}"
          placeholder="예: 900101-1234567"
          maxlength="14"
        >
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">입사일</label>
        <input type="date" id="staffHireDate" class="form-input" value="${staff?.hireDate || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">퇴사일</label>
        <input type="date" id="staffTerminationDate" class="form-input" value="${staff?.terminationDate || ''}">
        <small style="color: var(--text-light); font-size: 0.75rem;">퇴사일을 입력하면 '퇴사' 목록으로 이동합니다</small>
      </div>
    </div>
    <div class="form-section-title">급여 계좌</div>
    ${getBankAccountFieldsHTML('staff', staff)}
    <div class="form-section-title">급여 조건</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">공제 유형 *</label>
        <select id="staffType" class="form-select">
          <option value="assistant" ${staff?.type === 'assistant' ? 'selected' : ''}>고용보험 0.9% (조교)</option>
          <option value="partInstructor" ${staff?.type === 'partInstructor' ? 'selected' : ''}>3.3% (강사)</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">시급 설정</label>
      <div class="tier-wage-group">
        <div class="tier-row">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">1구간 시간 (0=미적용)</label>
            <input type="number" id="tier1Hours" class="form-input" value="${staff?.tier1Hours || 0}" min="0" step="1">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">1구간 시급 (최저시급: ${formatKRW(MINIMUM_WAGE)})</label>
            <input type="number" id="tier1Rate" class="form-input" value="${staff?.tier1Rate || MINIMUM_WAGE}" min="0" step="100">
          </div>
        </div>
        <div class="tier-row">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">기본/2구간 시급 *</label>
            <input type="number" id="tier2Rate" class="form-input" value="${staff?.tier2Rate || staff?.hourlyRate || 12000}" min="0" step="100">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">시간 계산 방식</label>
            <select id="roundingRule" class="form-select">
              <option value="exact" ${(!staff?.roundingRule || staff?.roundingRule === 'exact') ? 'selected' : ''}>정확한 시간</option>
              <option value="half" ${staff?.roundingRule === 'half' ? 'selected' : ''}>30분 단위 반올림</option>
              <option value="hour" ${staff?.roundingRule === 'hour' ? 'selected' : ''}>1시간 단위 반올림</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 직급 '기타' 선택 시 직접입력 필드 토글
function toggleCustomPosition(select) {
  const customGroup = document.getElementById('customPositionGroup');
  if (select.value === 'custom') {
    customGroup.style.display = 'block';
  } else {
    customGroup.style.display = 'none';
    document.getElementById('staffPositionCustom').value = '';
  }
}

// 직급 값 추출 헬퍼 함수
function getPositionValue() {
  const positionSelect = document.getElementById('staffPosition').value;
  if (positionSelect === 'custom') {
    return document.getElementById('staffPositionCustom').value.trim() || null;
  } else if (positionSelect === '') {
    return null;
  }
  return positionSelect;
}

function openAddStaffModal() {
  document.getElementById('modalTitle').textContent = '직원 추가';
  document.getElementById('modalBody').innerHTML = getStaffFormHTML();
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveNewStaff()">저장</button>
  `;
  openModal();
}

function openEditStaffModal(staffId) {
  const staff = getStaffById(staffId);
  document.getElementById('modalTitle').textContent = '직원 수정';
  document.getElementById('modalBody').innerHTML = getStaffFormHTML(staff);
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveEditStaff(${staffId})">저장</button>
  `;
  openModal();
}

function saveNewStaff() {
  const name = document.getElementById('staffName').value.trim();
  if (!name) {
    alert('이름을 입력해주세요.');
    return;
  }

  // 입사일/퇴사일 유효성 검증
  const hireDate = document.getElementById('staffHireDate').value || null;
  const terminationDate = document.getElementById('staffTerminationDate').value || null;
  const residentId = formatResidentId(document.getElementById('staffResidentId').value.trim());

  if (hireDate && terminationDate && terminationDate < hireDate) {
    alert('퇴사일은 입사일 이후여야 합니다.');
    return;
  }

  if (residentId && !/^\d{6}-\d{7}$/.test(residentId)) {
    alert('주민등록번호 형식을 확인해주세요. 예: 900101-1234567');
    return;
  }

  const bankAccount = readBankAccountFields('staff', name);
  const bankAccountError = validateBankAccount(bankAccount);
  if (bankAccountError) {
    alert(bankAccountError);
    return;
  }

  const newStaff = addStaff({
    name,
    loginId: document.getElementById('staffLoginId').value.trim() || name,
    phoneNumber: document.getElementById('staffPhoneNumber').value.trim(),
    residentId,
    businessId: parseInt(document.getElementById('staffBusinessId').value),
    type: document.getElementById('staffType').value,
    hourlyRate: parseInt(document.getElementById('tier2Rate').value) || 12000,
    tier1Hours: parseInt(document.getElementById('tier1Hours').value) || 0,
    tier1Rate: parseInt(document.getElementById('tier1Rate').value) || 0,
    tier2Rate: parseInt(document.getElementById('tier2Rate').value) || 12000,
    roundingRule: document.getElementById('roundingRule').value,
    // 새 필드 추가
    hireDate,
    terminationDate,
    position: getPositionValue(),
    ...bankAccount
  });

  closeModal();
  renderContent();
  showToast(`직원이 추가되었습니다. 로그인 ID: ${newStaff.loginId || '생성 예정'}`);
}

function saveEditStaff(staffId) {
  const name = document.getElementById('staffName').value.trim();
  if (!name) {
    alert('이름을 입력해주세요.');
    return;
  }

  // 입사일/퇴사일 유효성 검증
  const hireDate = document.getElementById('staffHireDate').value || null;
  const terminationDate = document.getElementById('staffTerminationDate').value || null;
  const residentId = formatResidentId(document.getElementById('staffResidentId').value.trim());

  if (hireDate && terminationDate && terminationDate < hireDate) {
    alert('퇴사일은 입사일 이후여야 합니다.');
    return;
  }

  if (residentId && !/^\d{6}-\d{7}$/.test(residentId)) {
    alert('주민등록번호 형식을 확인해주세요. 예: 900101-1234567');
    return;
  }

  const bankAccount = readBankAccountFields('staff', name);
  const bankAccountError = validateBankAccount(bankAccount);
  if (bankAccountError) {
    alert(bankAccountError);
    return;
  }

  updateStaff(staffId, {
    name,
    loginId: document.getElementById('staffLoginId').value.trim() || name,
    phoneNumber: document.getElementById('staffPhoneNumber').value.trim(),
    residentId,
    businessId: parseInt(document.getElementById('staffBusinessId').value),
    type: document.getElementById('staffType').value,
    hourlyRate: parseInt(document.getElementById('tier2Rate').value) || 12000,
    tier1Hours: parseInt(document.getElementById('tier1Hours').value) || 0,
    tier1Rate: parseInt(document.getElementById('tier1Rate').value) || 0,
    tier2Rate: parseInt(document.getElementById('tier2Rate').value) || 12000,
    roundingRule: document.getElementById('roundingRule').value,
    // 새 필드 추가
    hireDate,
    terminationDate,
    position: getPositionValue(),
    ...bankAccount
  });

  closeModal();
  renderContent();
  showToast('직원 정보가 수정되었습니다.');
}

function confirmDeleteStaff(staffId) {
  if (confirm('정말 삭제하시겠습니까?')) {
    deleteStaff(staffId);
    renderContent();
    showToast('직원이 삭제되었습니다.');
  }
}

// ============ 비율제 강사 관리 ============
let selectedCommissionInstructor = null;

function renderCommissionInstructors(container) {
  const { year, month } = parseMonthKey(selectedMonth);
  // 선택된 사업장에 따라 강사 필터링
  const filteredInstructors = getCommissionInstructorsByBusiness(selectedBusiness);

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--primary);">비율제 강사 관리</h2>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <div class="month-selector">
          <input type="month" value="${selectedMonth}" onchange="changeMonth(this.value)">
        </div>
        <button class="btn btn-primary" onclick="openAddCommissionInstructorModal()">+ 강사 추가</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">등록된 비율제 강사</h3>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>주민번호</th>
              <th>소속</th>
              <th>비율</th>
              <th>${month}월 학생수</th>
              <th>${month}월 수강료</th>
              <th>${month}월 예상지급액</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${filteredInstructors.length > 0 ? filteredInstructors.map(instructor => {
              const students = getCommissionStudents(instructor.id, selectedMonth);
              const calc = students.length > 0 ? calculateCommission(instructor, students, appData.settings) : null;
              const businessName = getBusinessName(instructor.businessId);
              return `
                <tr>
                  <td><strong>${instructor.name}</strong></td>
                  <td style="font-family: monospace; font-size: 0.8125rem;">${instructor.residentId || '-'}</td>
                  <td><span class="badge badge-business">${businessName}</span></td>
                  <td><span class="badge badge-part">${formatPercent(instructor.commissionRate)}</span></td>
                  <td>${students.length}명</td>
                  <td>${calc ? formatKRW(calc.totalTuition) : '-'}</td>
                  <td><strong style="color: var(--success);">${calc ? formatKRW(calc.netPay) : '-'}</strong></td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-accent btn-sm" onclick="openStudentManagement(${instructor.id})">학생관리</button>
                      <button class="btn btn-outline btn-sm" onclick="openEditCommissionInstructorModal(${instructor.id})">수정</button>
                      <button class="btn btn-danger btn-sm" onclick="confirmDeleteCommissionInstructor(${instructor.id})">삭제</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('') : '<tr><td colspan="8" class="empty-state">등록된 비율제 강사가 없습니다.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div id="studentManagementSection"></div>
  `;
}

function openAddCommissionInstructorModal() {
  // 기본 선택 사업장 결정
  const defaultBusinessId = selectedBusiness !== 'all' ? selectedBusiness : appData.businesses[0]?.id;

  document.getElementById('modalTitle').textContent = '비율제 강사 추가';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">이름 *</label>
        <input type="text" id="commInstructorName" class="form-input" placeholder="강사 이름">
      </div>
      <div class="form-group">
        <label class="form-label">소속 사업장 *</label>
        <select id="commInstructorBusinessId" class="form-select">
          ${appData.businesses.map(b =>
            `<option value="${b.id}" ${defaultBusinessId === b.id ? 'selected' : ''}>${b.name}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">강사 비율 (%) *</label>
      <input type="number" id="commInstructorRate" class="form-input" value="50" min="1" max="100" step="1">
      <small style="color: var(--text-light);">예: 50 = 5:5, 60 = 6:4 (강사:학원)</small>
    </div>
    <div class="form-group">
      <label class="form-label">휴대폰 번호</label>
      <input type="text" id="commInstructorPhoneNumber" class="form-input" placeholder="숫자만 입력">
    </div>
    <div class="form-group">
      <label class="form-label">주민등록번호</label>
      <input
        type="text"
        id="commInstructorResidentId"
        class="form-input"
        placeholder="예: 900101-1234567"
        maxlength="14"
      >
      <small style="color: var(--text-light);">세무 처리용으로 바로 확인할 수 있게 저장됩니다.</small>
    </div>
    <div style="background: var(--bg); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
      <strong>공제 안내</strong>
      <p style="font-size: 0.875rem; color: var(--text-light); margin-top: 0.5rem;">
        비율제 강사는 다음 공제가 적용됩니다:<br>
        • 카드수수료 1% (전체 수강료에서 먼저 공제)<br>
        • 사업소득세 3.3% (강사 몫에서 공제)
      </p>
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveNewCommissionInstructor()">저장</button>
  `;
  openModal();
}

function openEditCommissionInstructorModal(id) {
  const instructor = getCommissionInstructorById(id);
  document.getElementById('modalTitle').textContent = '비율제 강사 수정';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">이름 *</label>
        <input type="text" id="commInstructorName" class="form-input" value="${instructor.name}">
      </div>
      <div class="form-group">
        <label class="form-label">소속 사업장 *</label>
        <select id="commInstructorBusinessId" class="form-select">
          ${appData.businesses.map(b =>
            `<option value="${b.id}" ${instructor.businessId === b.id ? 'selected' : ''}>${b.name}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">강사 비율 (%) *</label>
      <input type="number" id="commInstructorRate" class="form-input" value="${instructor.commissionRate * 100}" min="1" max="100" step="1">
      <small style="color: var(--text-light);">예: 50 = 5:5, 60 = 6:4 (강사:학원)</small>
    </div>
    <div class="form-group">
      <label class="form-label">휴대폰 번호</label>
      <input type="text" id="commInstructorPhoneNumber" class="form-input" value="${instructor.phoneNumber || ''}" placeholder="숫자만 입력">
    </div>
    <div class="form-group">
      <label class="form-label">주민등록번호</label>
      <input
        type="text"
        id="commInstructorResidentId"
        class="form-input"
        value="${formatResidentId(instructor.residentId || '')}"
        placeholder="예: 900101-1234567"
        maxlength="14"
      >
      <small style="color: var(--text-light);">세무 처리용으로 바로 확인할 수 있게 저장됩니다.</small>
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveEditCommissionInstructor(${id})">저장</button>
  `;
  openModal();
}

function saveNewCommissionInstructor() {
  const name = document.getElementById('commInstructorName').value.trim();
  const ratePercent = parseInt(document.getElementById('commInstructorRate').value);
  const businessId = parseInt(document.getElementById('commInstructorBusinessId').value);
  const residentId = formatResidentId(document.getElementById('commInstructorResidentId').value.trim());

  if (!name) {
    alert('이름을 입력해주세요.');
    return;
  }
  if (isNaN(ratePercent) || ratePercent < 1 || ratePercent > 100) {
    alert('비율은 1~100 사이로 입력해주세요.');
    return;
  }
  if (residentId && !/^\d{6}-\d{7}$/.test(residentId)) {
    alert('주민등록번호 형식을 확인해주세요. 예: 900101-1234567');
    return;
  }

  addCommissionInstructor({
    name,
    commissionRate: ratePercent / 100,
    businessId,
    phoneNumber: document.getElementById('commInstructorPhoneNumber').value.trim(),
    residentId
  });

  closeModal();
  renderContent();
  showToast('비율제 강사가 추가되었습니다.');
}

function saveEditCommissionInstructor(id) {
  const name = document.getElementById('commInstructorName').value.trim();
  const ratePercent = parseInt(document.getElementById('commInstructorRate').value);
  const businessId = parseInt(document.getElementById('commInstructorBusinessId').value);
  const residentId = formatResidentId(document.getElementById('commInstructorResidentId').value.trim());

  if (!name) {
    alert('이름을 입력해주세요.');
    return;
  }
  if (isNaN(ratePercent) || ratePercent < 1 || ratePercent > 100) {
    alert('비율은 1~100 사이로 입력해주세요.');
    return;
  }
  if (residentId && !/^\d{6}-\d{7}$/.test(residentId)) {
    alert('주민등록번호 형식을 확인해주세요. 예: 900101-1234567');
    return;
  }

  updateCommissionInstructor(id, {
    name,
    commissionRate: ratePercent / 100,
    businessId,
    phoneNumber: document.getElementById('commInstructorPhoneNumber').value.trim(),
    residentId
  });

  closeModal();
  renderContent();
  showToast('강사 정보가 수정되었습니다.');
}

function confirmDeleteCommissionInstructor(id) {
  if (confirm('정말 삭제하시겠습니까? 관련 학생 데이터도 모두 삭제됩니다.')) {
    deleteCommissionInstructor(id);
    renderContent();
    showToast('강사가 삭제되었습니다.');
  }
}

// ============ 학생 관리 (비율제 강사) ============
function openStudentManagement(instructorId) {
  selectedCommissionInstructor = instructorId;
  const instructor = getCommissionInstructorById(instructorId);
  const students = getCommissionStudents(instructorId, selectedMonth);
  const { year, month } = parseMonthKey(selectedMonth);
  const calc = students.length > 0 ? calculateCommission(instructor, students, appData.settings) : null;

  const html = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${instructor.name} - ${month}월 학생 관리</h3>
        <div style="display: flex; gap: 0.5rem;">
          <label class="btn btn-success btn-sm" style="cursor: pointer;">
            Excel 업로드
            <input type="file" accept=".csv,.txt" style="display: none;" onchange="handleStudentExcelUpload(this, ${instructorId})">
          </label>
          <button class="btn btn-primary btn-sm" onclick="openAddStudentModal(${instructorId})">+ 학생 추가</button>
        </div>
      </div>

      <div style="background: var(--bg); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
        <div style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 150px;">
            <label style="font-size: 0.875rem; font-weight: 600; display: block; margin-bottom: 0.25rem;">학생 수 빠른 등록</label>
            <input type="number" id="quickCommissionStudentCount_${instructorId}" class="form-input" placeholder="예: 10" min="1" max="100" style="width: 100%;">
          </div>
          <div style="flex: 1; min-width: 150px;">
            <label style="font-size: 0.875rem; font-weight: 600; display: block; margin-bottom: 0.25rem;">1인당 수강료</label>
            <input type="number" id="quickCommissionStudentTuition_${instructorId}" class="form-input" placeholder="예: 300000" min="0" step="10000" style="width: 100%;">
          </div>
          <button class="btn btn-accent" onclick="addQuickCommissionStudents(${instructorId})">추가</button>
        </div>
        <p style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.5rem;">
          학생 이름 없이 학생 수와 수강료만 넣으면 익명 학생이 자동 생성됩니다.
        </p>
      </div>

      ${calc ? `
        <div class="summary-grid" style="margin-bottom: 1rem;">
          <div class="summary-card">
            <div class="summary-label" style="color: var(--text-light);">총 수강료</div>
            <div class="summary-value" style="font-size: 1.25rem;">${formatKRW(calc.totalTuition)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label" style="color: var(--text-light);">카드수수료 (1%)</div>
            <div class="summary-value" style="font-size: 1.25rem; color: var(--danger);">-${formatKRW(calc.cardFee)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label" style="color: var(--text-light);">강사 몫 (${formatPercent(instructor.commissionRate)})</div>
            <div class="summary-value" style="font-size: 1.25rem;">${formatKRW(calc.instructorGross)}</div>
          </div>
          <div class="summary-card primary">
            <div class="summary-label">실지급액 (3.3% 공제 후)</div>
            <div class="summary-value" style="font-size: 1.25rem;">${formatKRW(calc.netPay)}</div>
          </div>
        </div>
      ` : ''}

      ${students.length > 0 ? `
      <div style="margin-bottom: 0.5rem; display: flex; gap: 0.5rem; align-items: center;">
        <button class="btn btn-danger btn-sm" onclick="deleteSelectedCommissionStudents(${instructorId})">선택 삭제</button>
        <span id="selectedCount_${instructorId}" style="font-size: 0.8125rem; color: var(--text-light);">0명 선택</span>
      </div>
      ` : ''}

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width: 40px;"><input type="checkbox" id="selectAll_${instructorId}" onchange="toggleAllCommissionStudents(${instructorId})"></th>
              <th>학생명</th>
              <th>수강료</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${students.length > 0 ? students.map(student => `
              <tr>
                <td><input type="checkbox" class="student-checkbox-${instructorId}" data-student-id="${student.id}" onchange="updateSelectedCount(${instructorId})"></td>
                <td>${student.name}</td>
                <td>${formatKRW(student.tuition)}</td>
                <td>
                  <div class="actions">
                    <button class="btn btn-outline btn-sm" onclick="openEditStudentModal(${instructorId}, ${student.id})">수정</button>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteStudent(${instructorId}, ${student.id})">삭제</button>
                  </div>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="4" class="empty-state">등록된 학생이 없습니다. Excel 업로드 또는 직접 추가해주세요.</td></tr>'}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 1rem; padding: 1rem; background: var(--bg); border-radius: 8px;">
        <strong>Excel 업로드 형식</strong>
        <p style="font-size: 0.8125rem; color: var(--text-light); margin-top: 0.5rem;">
          CSV 파일 형식: 학생명,수강료 (첫 줄은 헤더로 인식됩니다)<br>
          예시:<br>
          학생명,수강료<br>
          홍길동,300000<br>
          김철수,250000
        </p>
      </div>
    </div>
  `;

  document.getElementById('studentManagementSection').innerHTML = html;
}

function handleStudentExcelUpload(input, instructorId) {
  if (input.files.length > 0) {
    readCSVFile(input.files[0])
      .then(students => {
        if (students.length === 0) {
          alert('유효한 학생 데이터가 없습니다. 형식을 확인해주세요.');
          return;
        }
        // 기존 학생 데이터에 ID 부여
        const studentsWithId = students.map((s, i) => ({ id: i + 1, ...s }));
        setCommissionStudents(instructorId, selectedMonth, studentsWithId);
        openStudentManagement(instructorId);
        showToast(`${students.length}명의 학생이 등록되었습니다.`);
      })
      .catch(err => {
        alert('파일 읽기 오류: ' + err.message);
      });
  }
  input.value = '';
}

function openAddStudentModal(instructorId) {
  document.getElementById('modalTitle').textContent = '학생 추가';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label class="form-label">학생명</label>
      <input type="text" id="studentName" class="form-input" placeholder="비우면 학생1처럼 자동 생성">
    </div>
    <div class="form-group">
      <label class="form-label">수강료 *</label>
      <input type="number" id="studentTuition" class="form-input" placeholder="예: 300000" min="0" step="10000">
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveNewStudent(${instructorId})">저장</button>
  `;
  openModal();
}

function openEditStudentModal(instructorId, studentId) {
  const students = getCommissionStudents(instructorId, selectedMonth);
  const student = students.find(s => s.id === studentId);

  document.getElementById('modalTitle').textContent = '학생 수정';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label class="form-label">학생명 *</label>
      <input type="text" id="studentName" class="form-input" value="${student.name}">
    </div>
    <div class="form-group">
      <label class="form-label">수강료 *</label>
      <input type="number" id="studentTuition" class="form-input" value="${student.tuition}" min="0" step="10000">
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveEditStudent(${instructorId}, ${studentId})">저장</button>
  `;
  openModal();
}

function saveNewStudent(instructorId) {
  const name = document.getElementById('studentName').value.trim();
  const tuition = parseInt(document.getElementById('studentTuition').value);

  if (isNaN(tuition) || tuition <= 0) {
    alert('수강료를 올바르게 입력해주세요.');
    return;
  }

  const students = getCommissionStudents(instructorId, selectedMonth);
  const defaultName = `학생${students.length + 1}`;
  addCommissionStudent(instructorId, selectedMonth, { name: name || defaultName, tuition });
  closeModal();
  openStudentManagement(instructorId);
  showToast('학생이 추가되었습니다.');
}

function addQuickCommissionStudents(instructorId) {
  const countInput = document.getElementById(`quickCommissionStudentCount_${instructorId}`);
  const tuitionInput = document.getElementById(`quickCommissionStudentTuition_${instructorId}`);
  const count = parseInt(countInput.value, 10) || 0;
  const tuition = parseInt(tuitionInput.value, 10) || 0;

  if (count <= 0) {
    alert('학생 수를 입력해주세요.');
    return;
  }

  if (tuition <= 0) {
    alert('1인당 수강료를 입력해주세요.');
    return;
  }

  const existingStudents = getCommissionStudents(instructorId, selectedMonth);
  const nextId = existingStudents.length > 0
    ? Math.max(...existingStudents.map(s => s.id || 0)) + 1
    : 1;

  const newStudents = Array.from({ length: count }, (_, index) => ({
    id: nextId + index,
    name: `학생${existingStudents.length + index + 1}`,
    tuition
  }));

  setCommissionStudents(instructorId, selectedMonth, [...existingStudents, ...newStudents]);
  openStudentManagement(instructorId);
  showToast(`${count}명의 학생이 추가되었습니다.`);
}

function saveEditStudent(instructorId, studentId) {
  const name = document.getElementById('studentName').value.trim();
  const tuition = parseInt(document.getElementById('studentTuition').value);

  if (!name || isNaN(tuition) || tuition <= 0) {
    alert('학생명과 수강료를 올바르게 입력해주세요.');
    return;
  }

  updateCommissionStudent(instructorId, selectedMonth, studentId, { name, tuition });
  closeModal();
  openStudentManagement(instructorId);
  showToast('학생 정보가 수정되었습니다.');
}

function confirmDeleteStudent(instructorId, studentId) {
  if (confirm('정말 삭제하시겠습니까?')) {
    deleteCommissionStudent(instructorId, selectedMonth, studentId);
    openStudentManagement(instructorId);
    showToast('학생이 삭제되었습니다.');
  }
}

// 비율제 강사 - 체크박스 전체 선택/해제
function toggleAllCommissionStudents(instructorId) {
  const selectAll = document.getElementById(`selectAll_${instructorId}`);
  const checkboxes = document.querySelectorAll(`.student-checkbox-${instructorId}`);
  checkboxes.forEach(cb => cb.checked = selectAll.checked);
  updateSelectedCount(instructorId);
}

// 비율제 강사 - 선택된 학생 수 업데이트
function updateSelectedCount(instructorId) {
  const checkboxes = document.querySelectorAll(`.student-checkbox-${instructorId}:checked`);
  const countSpan = document.getElementById(`selectedCount_${instructorId}`);
  if (countSpan) {
    countSpan.textContent = `${checkboxes.length}명 선택`;
  }
  // 전체 선택 체크박스 상태 업데이트
  const allCheckboxes = document.querySelectorAll(`.student-checkbox-${instructorId}`);
  const selectAll = document.getElementById(`selectAll_${instructorId}`);
  if (selectAll) {
    selectAll.checked = allCheckboxes.length > 0 && checkboxes.length === allCheckboxes.length;
  }
}

// 비율제 강사 - 선택된 학생 삭제
function deleteSelectedCommissionStudents(instructorId) {
  const checkboxes = document.querySelectorAll(`.student-checkbox-${instructorId}:checked`);
  if (checkboxes.length === 0) {
    alert('삭제할 학생을 선택해주세요.');
    return;
  }

  if (!confirm(`선택한 ${checkboxes.length}명의 학생을 삭제하시겠습니까?`)) {
    return;
  }

  const studentIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.studentId));
  const students = getCommissionStudents(instructorId, selectedMonth);
  const remaining = students.filter(s => !studentIds.includes(s.id));
  setCommissionStudents(instructorId, selectedMonth, remaining);
  openStudentManagement(instructorId);
  showToast(`${checkboxes.length}명의 학생이 삭제되었습니다.`);
}

// ============ 월급제 3.3% 강사 관리 ============

function getMonthlyInstructorPositionValue() {
  const select = document.getElementById('monthlyInstructorPosition');
  if (select.value === 'custom') {
    return document.getElementById('monthlyInstructorPositionCustom').value.trim() || null;
  }
  return select.value || null;
}

function toggleMonthlyInstructorCustomPosition(select) {
  const customGroup = document.getElementById('monthlyInstructorCustomPositionGroup');
  if (customGroup) {
    customGroup.style.display = select.value === 'custom' ? 'block' : 'none';
  }
}

function getMonthlyInstructorFormHTML(instructor = null) {
  const defaultBusinessId = instructor?.businessId ||
    (selectedBusiness !== 'all' ? selectedBusiness : appData.businesses[0]?.id);
  const positionOptions = ['원장', '실장', '주임', '일반'];
  const isCustomPosition = instructor?.position && !positionOptions.includes(instructor.position);

  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">이름 *</label>
        <input type="text" id="monthlyInstructorName" class="form-input" value="${instructor?.name || ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">소속 사업장 *</label>
        <select id="monthlyInstructorBusinessId" class="form-select">
          ${appData.businesses.map(b =>
            `<option value="${b.id}" ${defaultBusinessId === b.id ? 'selected' : ''}>${b.name}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">직급</label>
        <select id="monthlyInstructorPosition" class="form-select" onchange="toggleMonthlyInstructorCustomPosition(this)">
          <option value="">선택 안함</option>
          ${positionOptions.map(p => `
            <option value="${p}" ${instructor?.position === p ? 'selected' : ''}>${p}</option>
          `).join('')}
          <option value="custom" ${isCustomPosition ? 'selected' : ''}>기타 (직접입력)</option>
        </select>
      </div>
      <div class="form-group" id="monthlyInstructorCustomPositionGroup" style="display: ${isCustomPosition ? 'block' : 'none'};">
        <label class="form-label">직급 직접입력</label>
        <input type="text" id="monthlyInstructorPositionCustom" class="form-input" value="${isCustomPosition ? instructor.position : ''}" placeholder="직급 입력">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">휴대폰 번호</label>
        <input type="text" id="monthlyInstructorPhoneNumber" class="form-input" value="${instructor?.phoneNumber || ''}" placeholder="숫자만 입력">
      </div>
      <div class="form-group">
        <label class="form-label">주민등록번호</label>
        <input type="text" id="monthlyInstructorResidentId" class="form-input" value="${formatResidentId(instructor?.residentId || '')}" placeholder="예: 900101-1234567" maxlength="14">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">입사일</label>
        <input type="date" id="monthlyInstructorHireDate" class="form-input" value="${instructor?.hireDate || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">퇴사일</label>
        <input type="date" id="monthlyInstructorTerminationDate" class="form-input" value="${instructor?.terminationDate || ''}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">기본 월급 (세전, 고정)</label>
      <input type="number" id="monthlyInstructorDefaultGrossPay" class="form-input" value="${instructor?.defaultGrossPay || ''}" min="0" step="10000" placeholder="예: 2500000 (비워두면 매달 직접 입력)">
      <small style="color: var(--text-light);">입력해두면 매달 별도 입력 없이 이 금액이 자동 적용됩니다. 금액이 다른 달에만 "월급입력"으로 수정하세요.</small>
    </div>
    <div style="background: var(--bg); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
      <strong>정산 방식 안내</strong>
      <p style="font-size: 0.875rem; color: var(--text-light); margin-top: 0.5rem;">
        기본 월급을 설정하면 매달 자동 적용되고, 사업소득세 ${formatRatePercent(appData.settings.instructorDeduction || 0.033)}가 자동 공제됩니다.<br>
        특정 달만 금액이 다르거나 추가 공제가 있으면 해당 월에 "월급입력"으로 직접 입력하세요. (직접 입력이 기본 월급보다 우선)
      </p>
    </div>
  `;
}

function renderMonthlyInstructors(container) {
  const { year, month } = parseMonthKey(selectedMonth);
  const viewInfo = getEmploymentViewList('monthlyInstructor', getMonthlyInstructorsByBusiness(selectedBusiness));
  const filteredInstructors = viewInfo.rows;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
      <h2 style="color: var(--primary);">${year}년 ${month}월 월급제 3.3% 강사 관리</h2>
      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <div class="month-selector">
          <input type="month" value="${selectedMonth}" onchange="changeMonth(this.value)">
        </div>
        ${renderEmploymentViewChips('monthlyInstructor', viewInfo)}
        <button class="btn btn-accent" onclick="openBulkMonthlyInstructorPayrollModal()">월급 한번에 입력</button>
        <button class="btn btn-primary" onclick="openAddMonthlyInstructorModal()">+ 강사 추가</button>
      </div>
    </div>

    ${renderPendingMonthlyInstructorNoticeHTML()}

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">등록된 월급제 3.3% 강사 (${filteredInstructors.length}명)</h3>
      </div>
      <div style="padding: 0 1.5rem 0.75rem; color: var(--text-light); font-size: 0.875rem;">
        <span class="badge" style="background: #e8f5e9; color: #2e7d32; font-size: 0.7rem;">자동</span> 표시는 강사 정보의 <strong style="color: var(--text);">기본 월급</strong>이 자동 적용된 달입니다. 금액이 다른 달만 "월급입력"으로 수정하세요.
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>주민번호</th>
              <th>소속</th>
              <th>직급</th>
              <th>기본월급</th>
              <th>${month}월 세전</th>
              <th>${month}월 공제</th>
              <th>${month}월 실지급</th>
              <th>입사일</th>
              <th>퇴사일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${filteredInstructors.length > 0 ? (() => {
              let sumGross = 0, sumDeduction = 0, sumNet = 0;
              const rows = filteredInstructors.map((instructor, index) => {
                const isTerminated = !!instructor.terminationDate;
                const payroll = getMonthlyInstructorPayroll(instructor.id, selectedMonth);
                const calc = payroll ? calculateMonthlyInstructorPayroll(payroll.grossPay, appData.settings, payroll.extraDeduction) : null;
                const businessName = getBusinessName(instructor.businessId);
                const terminationDateDisplay = instructor.terminationDate || '-';
                const isAutoApplied = payroll?.source === 'default';
                if (calc) {
                  sumGross += calc.grossPay;
                  sumDeduction += calc.totalDeduction;
                  sumNet += calc.netPay;
                }
                return `
                  ${terminationGroupRowHTML(filteredInstructors, index, 11)}
                  <tr class="${isTerminated ? 'row-terminated' : ''}">
                    <td>
                      <strong>${instructor.name}</strong>
                      ${isTerminated ? '<span class="badge badge-terminated">퇴사</span>' : ''}
                    </td>
                    <td style="font-family: monospace; font-size: 0.8125rem;">${instructor.residentId || '-'}</td>
                    <td><span class="badge badge-business">${businessName}</span></td>
                    <td>${instructor.position || '-'}</td>
                    <td>${instructor.defaultGrossPay > 0 ? formatKRW(instructor.defaultGrossPay) : '<span style="color: var(--text-light);">미설정</span>'}</td>
                    <td>
                      ${calc ? formatKRW(calc.grossPay) : '<span style="color: var(--danger);">미입력</span>'}
                      ${isAutoApplied ? '<span class="badge" style="background: #e8f5e9; color: #2e7d32; margin-left: 0.375rem; font-size: 0.7rem;">자동</span>' : ''}
                    </td>
                    <td style="color: var(--danger);">${calc ? '-' + formatKRW(calc.totalDeduction) : '-'}</td>
                    <td><strong style="color: var(--success);">${calc ? formatKRW(calc.netPay) : '-'}</strong></td>
                    <td style="font-size: 0.8125rem;">${instructor.hireDate || '-'}</td>
                    <td style="font-size: 0.8125rem; color: ${isTerminated ? 'var(--danger)' : 'inherit'};">${terminationDateDisplay}</td>
                    <td>
                      <div class="actions">
                        <button class="btn btn-primary btn-sm" onclick="openMonthlyInstructorPayrollModal(${instructor.id})">월급입력</button>
                        ${calc ? `<button class="btn btn-accent btn-sm" onclick="generateMonthlyInstructorPDF(${instructor.id}, '${selectedMonth}')">PDF</button>` : ''}
                        <button class="btn btn-outline btn-sm" onclick="openEditMonthlyInstructorModal(${instructor.id})">수정</button>
                        <button class="btn btn-danger btn-sm" onclick="confirmDeleteMonthlyInstructor(${instructor.id})">삭제</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('');
              const totalRow = `
                <tr style="border-top: 2px solid var(--border); background: var(--bg); font-weight: 700;">
                  <td colspan="5">합계 (${filteredInstructors.length}명)</td>
                  <td>${formatKRW(sumGross)}</td>
                  <td style="color: var(--danger);">-${formatKRW(sumDeduction)}</td>
                  <td style="color: var(--success);">${formatKRW(sumNet)}</td>
                  <td colspan="3"></td>
                </tr>
              `;
              return rows + totalRow;
            })() : '<tr><td colspan="11" class="empty-state">등록된 월급제 강사가 없습니다.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 이 달 월급이 입력되지 않아 지급 합계에서 빠져 있는 월급제 강사
// (재직 기간 안인데 월별 입력도, 기본 월급도 없는 경우. 0원으로 '지급 제외' 저장한 달은 해당 없음)
function getPendingMonthlyInstructors(monthKey, businessId = 'all') {
  return getMonthlyInstructorsByBusiness(businessId).filter(instructor => {
    if (instructor.hireDate && monthKey < instructor.hireDate.slice(0, 7)) return false;
    if (instructor.terminationDate && monthKey > instructor.terminationDate.slice(0, 7)) return false;
    return !getMonthlyInstructorPayroll(instructor.id, monthKey);
  });
}

// 대시보드·급여정산·월급제강사 탭 공통 경고 (미입력 강사가 없으면 빈 문자열)
function renderPendingMonthlyInstructorNoticeHTML() {
  const pending = getPendingMonthlyInstructors(selectedMonth, selectedBusiness);
  if (pending.length === 0) return '';
  const { month } = parseMonthKey(selectedMonth);
  return `
    <div class="notice-warning">
      <div>
        <strong>월급제 강사 ${pending.length}명의 ${month}월 월급이 입력되지 않아 지급 합계에서 빠져 있습니다.</strong>
        <div class="notice-names">${pending.map(i => escapeHtml(i.name)).join(', ')}</div>
      </div>
      <button class="btn btn-accent btn-sm" onclick="openBulkMonthlyInstructorPayrollModal()">한번에 입력</button>
    </div>`;
}

// 월급제 강사 전원의 이 달 세전 지급액을 한 화면에서 확인·입력
function openBulkMonthlyInstructorPayrollModal() {
  const { year, month } = parseMonthKey(selectedMonth);
  const prevMonthKey = getPreviousMonthKey(selectedMonth);
  const pendingIds = new Set(getPendingMonthlyInstructors(selectedMonth, selectedBusiness).map(i => i.id));
  // 이 달 지급 대상(입력됨·자동 적용) + 미입력 강사. 미입력을 위로
  const instructors = getMonthlyInstructorsByBusiness(selectedBusiness)
    .filter(i => pendingIds.has(i.id) || getMonthlyInstructorPayroll(i.id, selectedMonth))
    .sort((a, b) => (pendingIds.has(b.id) - pendingIds.has(a.id)) || a.name.localeCompare(b.name, 'ko'));

  document.getElementById('modalTitle').textContent = `${year}년 ${month}월 월급제 강사 월급 한번에 입력`;

  if (instructors.length === 0) {
    document.getElementById('modalBody').innerHTML = '<div class="empty-state">이 달에 재직 중인 월급제 강사가 없습니다.</div>';
    document.getElementById('modalFooter').innerHTML = '<button class="btn btn-outline" onclick="closeModal()">닫기</button>';
    openModal();
    return;
  }

  document.getElementById('modalBody').innerHTML = `
    <div style="margin-bottom: 1rem; font-size: 0.8125rem; color: var(--text-light);">
      세전 지급액만 입력하면 됩니다. 빈 칸으로 둔 강사는 그대로 유지되며, 추가 공제·비고는 강사별 "월급입력"에서 수정하세요.
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>이름</th>
            <th>전월 세전</th>
            <th>${month}월 세전 지급액</th>
          </tr>
        </thead>
        <tbody>
          ${instructors.map(instructor => {
            const payroll = getMonthlyInstructorPayroll(instructor.id, selectedMonth);
            const prev = getMonthlyInstructorPayroll(instructor.id, prevMonthKey);
            const isPending = pendingIds.has(instructor.id);
            return `
              <tr>
                <td>
                  <strong>${escapeHtml(instructor.name)}</strong>
                  ${isPending ? '<span class="badge badge-terminated">미입력</span>' : ''}
                  ${payroll?.source === 'default' ? '<span class="badge" style="background: #e8f5e9; color: #2e7d32; margin-left: 0.375rem; font-size: 0.7rem;">자동</span>' : ''}
                  <div class="cell-sub">${getBusinessName(instructor.businessId)}</div>
                </td>
                <td class="cell-small">${prev?.grossPay > 0 ? formatKRW(prev.grossPay) : '-'}</td>
                <td>
                  <input type="number" class="form-input bulk-monthly-gross" style="min-width: 140px;"
                    data-instructor-id="${instructor.id}" data-prev-gross="${prev?.grossPay || 0}"
                    value="${payroll?.grossPay > 0 ? payroll.grossPay : ''}" min="0" step="10000"
                    placeholder="예: 2500000" oninput="updateBulkMonthlyInstructorTotal()">
                </td>
              </tr>
            `;
          }).join('')}
          <tr style="border-top: 2px solid var(--border); background: var(--bg); font-weight: 700;">
            <td colspan="2">세전 합계</td>
            <td id="bulkMonthlyGrossTotal"></td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-accent" onclick="fillBulkMonthlyInstructorFromPrevious()">빈 칸을 전월 금액으로</button>
    <button class="btn btn-primary" onclick="saveBulkMonthlyInstructorPayroll()">저장</button>
  `;
  updateBulkMonthlyInstructorTotal();
  openModal();
}

function updateBulkMonthlyInstructorTotal() {
  let total = 0;
  document.querySelectorAll('.bulk-monthly-gross').forEach(input => {
    total += Math.max(0, parseInt(input.value, 10) || 0);
  });
  document.getElementById('bulkMonthlyGrossTotal').textContent = formatKRW(total);
}

function fillBulkMonthlyInstructorFromPrevious() {
  document.querySelectorAll('.bulk-monthly-gross').forEach(input => {
    const prevGross = parseInt(input.dataset.prevGross, 10) || 0;
    if (input.value.trim() === '' && prevGross > 0) input.value = prevGross;
  });
  updateBulkMonthlyInstructorTotal();
}

function saveBulkMonthlyInstructorPayroll() {
  let savedCount = 0;
  document.querySelectorAll('.bulk-monthly-gross').forEach(input => {
    const id = parseInt(input.dataset.instructorId, 10);
    const grossPay = parseInt(input.value, 10) || 0;
    if (grossPay <= 0) return;  // 빈 칸은 건드리지 않음 (지급 제외는 강사별 "월급입력"에서)

    const current = getMonthlyInstructorPayroll(id, selectedMonth);
    if (current && current.grossPay === grossPay) return;  // 변동 없음 (자동 적용 상태도 그대로 유지)

    setMonthlyInstructorPayroll(id, selectedMonth, {
      grossPay,
      extraDeduction: current?.extraDeduction || 0,
      memo: current?.memo || ''
    });
    savedCount++;
  });

  closeModal();
  renderContent();
  showToast(savedCount > 0 ? `${savedCount}명의 월급이 저장되었습니다.` : '변경된 내용이 없습니다.');
}

function openAddMonthlyInstructorModal() {
  document.getElementById('modalTitle').textContent = '월급제 3.3% 강사 추가';
  document.getElementById('modalBody').innerHTML = getMonthlyInstructorFormHTML();
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveNewMonthlyInstructor()">저장</button>
  `;
  openModal();
}

function openEditMonthlyInstructorModal(id) {
  const instructor = getMonthlyInstructorById(id);
  document.getElementById('modalTitle').textContent = '월급제 3.3% 강사 수정';
  document.getElementById('modalBody').innerHTML = getMonthlyInstructorFormHTML(instructor);
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveEditMonthlyInstructor(${id})">저장</button>
  `;
  openModal();
}

function saveNewMonthlyInstructor() {
  const name = document.getElementById('monthlyInstructorName').value.trim();
  const hireDate = document.getElementById('monthlyInstructorHireDate').value || null;
  const terminationDate = document.getElementById('monthlyInstructorTerminationDate').value || null;
  const residentId = formatResidentId(document.getElementById('monthlyInstructorResidentId').value.trim());

  if (!name) {
    alert('이름을 입력해주세요.');
    return;
  }
  if (hireDate && terminationDate && terminationDate < hireDate) {
    alert('퇴사일은 입사일 이후여야 합니다.');
    return;
  }
  if (residentId && !/^\d{6}-\d{7}$/.test(residentId)) {
    alert('주민등록번호 형식을 확인해주세요. 예: 900101-1234567');
    return;
  }

  addMonthlyInstructor({
    name,
    businessId: parseInt(document.getElementById('monthlyInstructorBusinessId').value, 10),
    phoneNumber: document.getElementById('monthlyInstructorPhoneNumber').value.trim(),
    residentId,
    hireDate,
    terminationDate,
    position: getMonthlyInstructorPositionValue(),
    defaultGrossPay: Math.max(0, parseInt(document.getElementById('monthlyInstructorDefaultGrossPay').value, 10) || 0)
  });

  closeModal();
  renderContent();
  showToast('월급제 강사가 추가되었습니다.');
}

function saveEditMonthlyInstructor(id) {
  const name = document.getElementById('monthlyInstructorName').value.trim();
  const hireDate = document.getElementById('monthlyInstructorHireDate').value || null;
  const terminationDate = document.getElementById('monthlyInstructorTerminationDate').value || null;
  const residentId = formatResidentId(document.getElementById('monthlyInstructorResidentId').value.trim());

  if (!name) {
    alert('이름을 입력해주세요.');
    return;
  }
  if (hireDate && terminationDate && terminationDate < hireDate) {
    alert('퇴사일은 입사일 이후여야 합니다.');
    return;
  }
  if (residentId && !/^\d{6}-\d{7}$/.test(residentId)) {
    alert('주민등록번호 형식을 확인해주세요. 예: 900101-1234567');
    return;
  }

  updateMonthlyInstructor(id, {
    name,
    businessId: parseInt(document.getElementById('monthlyInstructorBusinessId').value, 10),
    phoneNumber: document.getElementById('monthlyInstructorPhoneNumber').value.trim(),
    residentId,
    hireDate,
    terminationDate,
    position: getMonthlyInstructorPositionValue(),
    defaultGrossPay: Math.max(0, parseInt(document.getElementById('monthlyInstructorDefaultGrossPay').value, 10) || 0)
  });

  closeModal();
  renderContent();
  showToast('월급제 강사 정보가 수정되었습니다.');
}

function confirmDeleteMonthlyInstructor(id) {
  if (!confirm('정말 삭제하시겠습니까? 월별 급여 입력 내역도 함께 삭제됩니다.')) {
    return;
  }
  deleteMonthlyInstructor(id);
  renderContent();
  showToast('월급제 강사가 삭제되었습니다.');
}

function openMonthlyInstructorPayrollModal(id) {
  const instructor = getMonthlyInstructorById(id);
  const payroll = getMonthlyInstructorPayroll(id, selectedMonth);
  const prev = getMonthlyInstructorPayroll(id, getPreviousMonthKey(selectedMonth));
  const isAutoApplied = payroll?.source === 'default';

  document.getElementById('modalTitle').textContent = `${instructor.name} 월별 급여 입력`;
  document.getElementById('modalBody').innerHTML = `
    ${isAutoApplied ? `
      <div style="margin-bottom: 1rem; padding: 0.875rem 1rem; background: #e8f5e9; border-radius: 10px; font-size: 0.875rem; color: #2e7d32;">
        현재 이 달은 기본 월급 <strong>${formatKRW(instructor.defaultGrossPay)}</strong>이 자동 적용 중입니다.<br>
        저장하면 이 달만 아래 입력값으로 확정됩니다.
      </div>
    ` : ''}
    <div class="form-group">
      <label class="form-label">${selectedMonth} 세전 지급액 *</label>
      <input type="number" id="monthlyInstructorGrossPay" class="form-input" value="${payroll?.grossPay || ''}" min="0" step="10000" placeholder="예: 2500000">
      ${prev?.grossPay ? `<small style="color: var(--text-light);">전월 세전 지급액: ${formatKRW(prev.grossPay)}</small>` : ''}
      ${instructor.defaultGrossPay > 0 ? `<small style="color: var(--text-light); display: block;">기본 월급: ${formatKRW(instructor.defaultGrossPay)} (0으로 저장하면 이 달은 지급 대상에서 제외)</small>` : ''}
    </div>
    <div class="form-group">
      <label class="form-label">추가 공제</label>
      <input type="number" id="monthlyInstructorExtraDeduction" class="form-input" value="${payroll?.extraDeduction || 0}" min="0" step="1000" placeholder="없으면 0">
      <small style="color: var(--text-light);">사업소득세 ${formatRatePercent(appData.settings.instructorDeduction || 0.033)} 외에 차감할 금액이 있을 때만 입력합니다.</small>
    </div>
    <div class="form-group">
      <label class="form-label">비고</label>
      <textarea id="monthlyInstructorMemo" class="form-input" rows="3" placeholder="예: 성과급 포함, 교재비 공제">${payroll?.memo || ''}</textarea>
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    ${prev?.grossPay ? `<button class="btn btn-accent" onclick="copyPreviousMonthlyInstructorPayroll(${id})">전월 복사</button>` : ''}
    <button class="btn btn-primary" onclick="saveMonthlyInstructorPayroll(${id})">저장</button>
  `;
  openModal();
}

function getPreviousMonthKey(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 2, 1);
  return getMonthKey(date);
}

function copyPreviousMonthlyInstructorPayroll(id) {
  const prev = getMonthlyInstructorPayroll(id, getPreviousMonthKey(selectedMonth));
  if (!prev) return;
  document.getElementById('monthlyInstructorGrossPay').value = prev.grossPay || '';
  document.getElementById('monthlyInstructorExtraDeduction').value = prev.extraDeduction || 0;
  document.getElementById('monthlyInstructorMemo').value = prev.memo || '';
}

function saveMonthlyInstructorPayroll(id) {
  const instructor = getMonthlyInstructorById(id);
  const grossPay = parseInt(document.getElementById('monthlyInstructorGrossPay').value, 10) || 0;
  const extraDeduction = parseInt(document.getElementById('monthlyInstructorExtraDeduction').value, 10) || 0;
  let memo = document.getElementById('monthlyInstructorMemo').value.trim();

  if (grossPay <= 0) {
    // 기본 월급이 설정된 강사는 0원 저장으로 해당 월 자동 적용을 취소(지급 제외)할 수 있음
    if (instructor?.defaultGrossPay > 0) {
      if (!confirm(`${selectedMonth}을(를) 지급 대상에서 제외하시겠습니까?\n(기본 월급 자동 적용이 이 달에만 해제됩니다)`)) {
        return;
      }
      // 메모가 없으면 제외 사유를 남겨 레코드가 유지되도록 함 (모두 비어 있으면 삭제되어 기본월급이 다시 적용됨)
      if (!memo && extraDeduction === 0) memo = '지급 제외';
      setMonthlyInstructorPayroll(id, selectedMonth, { grossPay: 0, extraDeduction, memo });
      closeModal();
      renderContent();
      showToast(`${selectedMonth} 지급이 제외 처리되었습니다.`);
      return;
    }
    alert('세전 지급액을 입력해주세요.');
    return;
  }
  if (extraDeduction < 0) {
    alert('추가 공제는 0원 이상이어야 합니다.');
    return;
  }

  setMonthlyInstructorPayroll(id, selectedMonth, { grossPay, extraDeduction, memo });
  closeModal();
  renderContent();
  showToast('월별 급여가 저장되었습니다.');
}

// ============ 근무기록 ============
function getWorkLogSnapshot(logInfo) {
  return {
    staffId: logInfo.staffId,
    date: logInfo.date,
    startTime: logInfo.startTime || '',
    endTime: logInfo.endTime || '',
    breakMinutes: logInfo.breakMinutes || 0,
    hours: logInfo.hours,
    memo: logInfo.memo || ''
  };
}

function hasWorkLogChanges(before, after) {
  return JSON.stringify(getWorkLogSnapshot(before)) !== JSON.stringify(getWorkLogSnapshot(after));
}

function getWorkLogEditorInfo() {
  if (currentUser?.role === 'staff') {
    return {
      editedByType: 'staff',
      editedById: currentUser.staffId,
      editedByName: currentUser.staff?.name || '직원'
    };
  }

  return {
    editedByType: 'admin',
    editedById: null,
    editedByName: '관리자'
  };
}

function formatWorkLogHistoryValue(key, value) {
  if (key === 'staffId') {
    return getStaffById(value)?.name || '알수없음';
  }
  if (key === 'hours') {
    return `${Number(value || 0).toFixed(2)}시간`;
  }
  if (key === 'breakMinutes') {
    return `${value || 0}분`;
  }
  return value || '-';
}

function normalizeWorkLogHistoryFieldValue(value) {
  return value === undefined || value === null ? '' : String(value);
}

function getWorkLogHistoryChanges(history) {
  const fieldLabels = {
    staffId: '직원',
    date: '날짜',
    startTime: '출근',
    endTime: '퇴근',
    breakMinutes: '휴게',
    hours: '근무시간',
    memo: '메모'
  };

  return Object.keys(fieldLabels)
    .filter(key => normalizeWorkLogHistoryFieldValue(history.before?.[key]) !== normalizeWorkLogHistoryFieldValue(history.after?.[key]))
    .map(key => `
      <tr>
        <td style="padding: 0.5rem; font-weight: 600;">${fieldLabels[key]}</td>
        <td style="padding: 0.5rem; color: var(--text-light);">${formatWorkLogHistoryValue(key, history.before?.[key])}</td>
        <td style="padding: 0.5rem; color: var(--primary);">${formatWorkLogHistoryValue(key, history.after?.[key])}</td>
      </tr>
    `).join('');
}

function renderWorkLogs(container) {
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">근무기록 관리</h3>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <div class="month-selector">
            <input type="month" value="${selectedMonth}" onchange="changeMonth(this.value)">
          </div>
          <button class="btn btn-success btn-sm" onclick="exportWorkLogsToExcel('${selectedMonth}')">Excel 다운로드</button>
          <button class="btn btn-primary" onclick="openAddWorkLogModal()">+ 근무 추가</button>
        </div>
      </div>
      <div style="padding: 0 1.5rem 1rem; color: var(--text-light); font-size: 0.875rem;">
        직원이 직접 입력하지 않아도 관리자가 이 화면에서 근무기록을 직접 추가·수정할 수 있습니다.
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>날짜</th>
              <th>이름</th>
              <th>출근</th>
              <th>퇴근</th>
              <th>휴게(분)</th>
              <th>근무시간</th>
              <th>메모</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${appData.workLogs
              .filter(log => log.date.startsWith(selectedMonth))
              .sort((a, b) => b.date.localeCompare(a.date))
              .map(log => {
                const staff = getStaffById(log.staffId);
                return `
                  <tr>
                    <td>${log.date}</td>
                    <td><strong>${staff?.name || '알수없음'}</strong></td>
                    <td>${log.startTime || '-'}</td>
                    <td>${log.endTime || '-'}</td>
                    <td>${log.breakMinutes || 0}</td>
                    <td>${formatHours(log.hours)}</td>
                    <td style="font-size: 0.8125rem; color: var(--text-light);">${log.memo || ''}</td>
                    <td>
                      <div class="actions">
                        <button class="btn btn-accent btn-sm" onclick="openWorkLogHistoryModal(${log.id})">이력</button>
                        <button class="btn btn-outline btn-sm" onclick="openEditWorkLogModal(${log.id})">수정</button>
                        <button class="btn btn-danger btn-sm" onclick="confirmDeleteWorkLog(${log.id})">삭제</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('') || '<tr><td colspan="8" class="empty-state">이 달의 근무기록이 없습니다.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function getWorkLogFormHTML(log = null) {
  const today = formatDate();
  // 퇴사하지 않은 직원만 선택 가능 (단, 수정 시 기존 선택 직원은 포함)
  const activeStaff = appData.staff.filter(s => !s.terminationDate || (log && s.id === log.staffId));

  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">날짜 *</label>
        <input type="date" id="logDate" class="form-input" value="${log?.date || today}">
      </div>
      <div class="form-group">
        <label class="form-label">직원 *</label>
        <select id="logStaff" class="form-select">
          ${activeStaff.map(s => `
            <option value="${s.id}" ${log?.staffId === s.id ? 'selected' : ''}>${s.name}</option>
          `).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">출근 시간</label>
        <input type="time" id="logStart" class="form-input" value="${log?.startTime || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">퇴근 시간</label>
        <input type="time" id="logEnd" class="form-input" value="${log?.endTime || ''}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">휴게시간 (분)</label>
        <input type="number" id="logBreak" class="form-input" value="${log?.breakMinutes || 0}" min="0">
        <small style="color: var(--text-light);">쉬는시간은 급여에 포함되지 않습니다.</small>
      </div>
      <div class="form-group">
        <label class="form-label">또는 직접 시간 입력</label>
        <input type="number" id="logHours" class="form-input" value="${log?.hours || ''}" min="0" step="0.5" placeholder="시간으로 직접 입력">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">메모</label>
      <input type="text" id="logMemo" class="form-input" value="${log?.memo || ''}">
    </div>
    ${currentUser?.role === 'admin' && log ? `
      <div class="form-group">
        <label class="form-label">수정 사유 (선택)</label>
        <input type="text" id="logEditReason" class="form-input" placeholder="예: 조교 요청 반영, 출퇴근 오기 정정">
        <small style="color: var(--text-light);">관리자 수정은 변경 이력에 자동 저장됩니다.</small>
      </div>
    ` : ''}
  `;
}

function openAddWorkLogModal() {
  document.getElementById('modalTitle').textContent = '근무기록 추가';
  document.getElementById('modalBody').innerHTML = getWorkLogFormHTML();
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveNewWorkLog()">저장</button>
  `;
  openModal();
}

function openEditWorkLogModal(logId) {
  const log = getWorkLogById(logId);
  if (!log) {
    showToast('근무기록을 찾을 수 없습니다.');
    return;
  }
  document.getElementById('modalTitle').textContent = '근무기록 수정';
  document.getElementById('modalBody').innerHTML = getWorkLogFormHTML(log);
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveEditWorkLog(${logId})">저장</button>
  `;
  openModal();
}

function saveNewWorkLog() {
  const staffId = parseInt(document.getElementById('logStaff').value);
  const staff = getStaffById(staffId);
  const date = document.getElementById('logDate').value;
  const startTime = document.getElementById('logStart').value;
  const endTime = document.getElementById('logEnd').value;
  const breakMinutes = parseInt(document.getElementById('logBreak').value) || 0;
  let hours = parseFloat(document.getElementById('logHours').value);

  if (!date || !staffId) {
    alert('날짜와 직원을 선택해주세요.');
    return;
  }

  if (isNaN(hours) && startTime && endTime) {
    hours = calculateHours(startTime, endTime, breakMinutes, staff?.roundingRule || 'exact');
  }

  if (isNaN(hours) || hours <= 0) {
    alert('근무시간을 입력해주세요.');
    return;
  }

  addWorkLog({
    staffId,
    date,
    startTime,
    endTime,
    breakMinutes,
    hours,
    memo: document.getElementById('logMemo').value.trim()
  });

  closeModal();
  renderContent();
  showToast('근무기록이 추가되었습니다.');
}

function saveEditWorkLog(logId) {
  const existingLog = getWorkLogById(logId);
  if (!existingLog) {
    showToast('근무기록을 찾을 수 없습니다.');
    return;
  }

  const staffId = parseInt(document.getElementById('logStaff').value);
  const staff = getStaffById(staffId);
  const date = document.getElementById('logDate').value;
  const startTime = document.getElementById('logStart').value;
  const endTime = document.getElementById('logEnd').value;
  const breakMinutes = parseInt(document.getElementById('logBreak').value) || 0;
  let hours = parseFloat(document.getElementById('logHours').value);

  if (!date || !staffId) {
    alert('날짜와 직원을 선택해주세요.');
    return;
  }

  if (isNaN(hours) && startTime && endTime) {
    hours = calculateHours(startTime, endTime, breakMinutes, staff?.roundingRule || 'exact');
  }

  if (isNaN(hours) || hours <= 0) {
    alert('근무시간을 입력해주세요.');
    return;
  }

  const nextLog = {
    staffId,
    date,
    startTime,
    endTime,
    breakMinutes,
    hours,
    memo: document.getElementById('logMemo').value.trim()
  };

  if (!hasWorkLogChanges(existingLog, nextLog)) {
    closeModal();
    showToast('변경된 내용이 없습니다.');
    return;
  }

  const editorInfo = getWorkLogEditorInfo();
  const historyReason = currentUser?.role === 'admin'
    ? document.getElementById('logEditReason')?.value.trim() || ''
    : '';

  updateWorkLog(logId, {
    ...nextLog,
    modifiedAt: new Date().toISOString(),
    modifiedByType: editorInfo.editedByType,
    modifiedByName: editorInfo.editedByName,
    historyEntry: {
      ...editorInfo,
      editedAt: new Date().toISOString(),
      reason: historyReason
    }
  });

  closeModal();
  renderContent();
  showToast('근무기록이 수정되었습니다.');
}

function openWorkLogHistoryModal(logId) {
  const log = getWorkLogById(logId);
  if (!log) {
    showToast('근무기록을 찾을 수 없습니다.');
    return;
  }

  const histories = getWorkLogHistories(logId);
  const staff = getStaffById(log.staffId);

  document.getElementById('modalTitle').textContent = '근무기록 수정 이력';
  document.getElementById('modalBody').innerHTML = `
    <div style="margin-bottom: 1rem; padding: 1rem; background: var(--bg); border-radius: 8px;">
      <div><strong>직원:</strong> ${staff?.name || '알수없음'}</div>
      <div><strong>날짜:</strong> ${log.date}</div>
    </div>
    ${histories.length > 0 ? histories.map(history => `
      <div style="border: 1px solid var(--border); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
        <div style="display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
          <strong>${history.editedByName}</strong>
          <span style="color: var(--text-light);">${new Date(history.editedAt).toLocaleString('ko-KR')}</span>
        </div>
        <div style="font-size: 0.875rem; color: var(--text-light); margin-bottom: 0.75rem;">
          수정 사유: ${history.reason || '미입력'}
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>항목</th>
                <th>변경 전</th>
                <th>변경 후</th>
              </tr>
            </thead>
            <tbody>
              ${getWorkLogHistoryChanges(history)}
            </tbody>
          </table>
        </div>
      </div>
    `).join('') : '<div class="empty-state">수정 이력이 없습니다.</div>'}
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-primary" onclick="closeModal()">닫기</button>
  `;
  openModal();
}

function openPayrollWorkLogModal(staffId) {
  const staff = getStaffById(staffId);
  if (!staff) {
    showToast('직원 정보를 찾을 수 없습니다.');
    return;
  }

  const logs = getStaffWorkLogs(staffId, selectedMonth)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);

  document.getElementById('modalTitle').textContent = `${staff.name} 근무시간 수정`;
  document.getElementById('modalBody').innerHTML = `
    <div style="margin-bottom: 1rem; padding: 0.875rem 1rem; background: var(--bg); border-radius: 10px; font-size: 0.875rem; color: var(--text-light);">
      직원이 먼저 입력하지 않아도 관리자께서 이 화면에서 근무기록을 직접 추가·수정할 수 있습니다.
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
      <div>
        <strong>${selectedMonth} 근무기록</strong>
        <div style="font-size: 0.875rem; color: var(--text-light); margin-top: 0.25rem;">총 ${formatHours(totalHours)}</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="openAddPayrollWorkLogModal(${staffId})">+ 근무 추가</button>
    </div>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>날짜</th>
            <th>출근</th>
            <th>퇴근</th>
            <th>휴게</th>
            <th>근무시간</th>
            <th>메모</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          ${logs.map(log => `
            <tr>
              <td>${log.date}</td>
              <td>${log.startTime || '-'}</td>
              <td>${log.endTime || '-'}</td>
              <td>${log.breakMinutes || 0}분</td>
              <td>${formatHours(log.hours)}</td>
              <td style="font-size: 0.8125rem; color: var(--text-light);">${log.memo || ''}</td>
              <td>
                <div class="actions">
                  <button class="btn btn-accent btn-sm" onclick="openWorkLogHistoryModal(${log.id})">이력</button>
                  <button class="btn btn-outline btn-sm" onclick="openEditPayrollWorkLogModal(${log.id}, ${staffId})">수정</button>
                  <button class="btn btn-danger btn-sm" onclick="confirmDeletePayrollWorkLog(${log.id}, ${staffId})">삭제</button>
                </div>
              </td>
            </tr>
          `).join('') || '<tr><td colspan="7" class="empty-state">이 달의 근무기록이 없습니다.</td></tr>'}
        </tbody>
      </table>
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">닫기</button>
  `;
  openModal();
}

function openAddPayrollWorkLogModal(staffId) {
  const staff = getStaffById(staffId);
  if (!staff) {
    showToast('직원 정보를 찾을 수 없습니다.');
    return;
  }

  document.getElementById('modalTitle').textContent = `${staff.name} 근무기록 추가`;
  document.getElementById('modalBody').innerHTML = getWorkLogFormHTML({ staffId, date: `${selectedMonth}-01` });
  const staffSelect = document.getElementById('logStaff');
  if (staffSelect) {
    staffSelect.value = String(staffId);
    staffSelect.disabled = true;
  }
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="openPayrollWorkLogModal(${staffId})">목록으로</button>
    <button class="btn btn-primary" onclick="saveNewPayrollWorkLog(${staffId})">저장</button>
  `;
  openModal();
}

function saveNewPayrollWorkLog(staffId) {
  const staff = getStaffById(staffId);
  const date = document.getElementById('logDate').value;
  const startTime = document.getElementById('logStart').value;
  const endTime = document.getElementById('logEnd').value;
  const breakMinutes = parseInt(document.getElementById('logBreak').value) || 0;
  let hours = parseFloat(document.getElementById('logHours').value);

  if (!date) {
    alert('날짜를 입력해주세요.');
    return;
  }

  if (date.slice(0, 7) !== selectedMonth) {
    alert('선택한 정산 월의 날짜만 추가할 수 있습니다.');
    return;
  }

  if (isNaN(hours) && startTime && endTime) {
    hours = calculateHours(startTime, endTime, breakMinutes, staff?.roundingRule || 'exact');
  }

  if (isNaN(hours) || hours <= 0) {
    alert('근무시간을 입력해주세요.');
    return;
  }

  addWorkLog({
    staffId,
    date,
    startTime,
    endTime,
    breakMinutes,
    hours,
    memo: document.getElementById('logMemo').value.trim()
  });

  renderContent();
  openPayrollWorkLogModal(staffId);
  showToast('근무기록이 추가되었습니다.');
}

function openEditPayrollWorkLogModal(logId, staffId) {
  const log = getWorkLogById(logId);
  if (!log) {
    showToast('근무기록을 찾을 수 없습니다.');
    return;
  }

  document.getElementById('modalTitle').textContent = '근무기록 수정';
  document.getElementById('modalBody').innerHTML = getWorkLogFormHTML(log);
  const staffSelect = document.getElementById('logStaff');
  if (staffSelect) {
    staffSelect.value = String(log.staffId);
  }
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="openPayrollWorkLogModal(${staffId})">목록으로</button>
    <button class="btn btn-primary" onclick="saveEditPayrollWorkLog(${logId}, ${staffId})">저장</button>
  `;
  openModal();
}

function saveEditPayrollWorkLog(logId, staffId) {
  const existingLog = getWorkLogById(logId);
  if (!existingLog) {
    showToast('근무기록을 찾을 수 없습니다.');
    return;
  }

  const staff = getStaffById(staffId);
  const date = document.getElementById('logDate').value;
  const startTime = document.getElementById('logStart').value;
  const endTime = document.getElementById('logEnd').value;
  const breakMinutes = parseInt(document.getElementById('logBreak').value) || 0;
  let hours = parseFloat(document.getElementById('logHours').value);

  if (!date) {
    alert('날짜를 입력해주세요.');
    return;
  }

  if (date.slice(0, 7) !== selectedMonth) {
    alert('선택한 정산 월의 날짜만 수정할 수 있습니다.');
    return;
  }

  if (isNaN(hours) && startTime && endTime) {
    hours = calculateHours(startTime, endTime, breakMinutes, staff?.roundingRule || 'exact');
  }

  if (isNaN(hours) || hours <= 0) {
    alert('근무시간을 입력해주세요.');
    return;
  }

  const nextLog = {
    staffId,
    date,
    startTime,
    endTime,
    breakMinutes,
    hours,
    memo: document.getElementById('logMemo').value.trim()
  };

  if (!hasWorkLogChanges(existingLog, nextLog)) {
    openPayrollWorkLogModal(staffId);
    showToast('변경된 내용이 없습니다.');
    return;
  }

  const historyReason = document.getElementById('logEditReason')?.value.trim() || '';
  updateWorkLog(logId, {
    ...nextLog,
    modifiedAt: new Date().toISOString(),
    modifiedByType: 'admin',
    modifiedByName: '관리자',
    historyEntry: {
      editedByType: 'admin',
      editedById: null,
      editedByName: '관리자',
      editedAt: new Date().toISOString(),
      reason: historyReason
    }
  });

  renderContent();
  openPayrollWorkLogModal(staffId);
  showToast('근무기록이 수정되었습니다.');
}

function confirmDeletePayrollWorkLog(logId, staffId) {
  if (!confirm('이 근무기록을 삭제하시겠습니까?')) {
    return;
  }

  deleteWorkLog(logId);
  renderContent();
  openPayrollWorkLogModal(staffId);
  showToast('근무기록이 삭제되었습니다.');
}

function confirmDeleteWorkLog(logId) {
  if (confirm('정말 삭제하시겠습니까?')) {
    deleteWorkLog(logId);
    renderContent();
    showToast('근무기록이 삭제되었습니다.');
  }
}

// ============ 급여정산 (전 유형 통합) ============

// 급여 유형 메타 (표시 순서 = 배열 순서)
const PAYROLL_TYPES = [
  { key: 'insurance', label: '4대보험', badge: 'badge-insurance' },
  { key: 'monthlyInstructor', label: '월급제', badge: 'badge-instructor' },
  { key: 'hourly', label: '시급제', badge: 'badge-assistant' },
  { key: 'commission', label: '비율제', badge: 'badge-part' },
  { key: 'special', label: '특강', badge: 'badge-special' }
];

let payrollTypeFilter = 'all';   // 'all' 또는 PAYROLL_TYPES의 key
let payrollSort = 'type';        // 'type' | 'net' | 'name'
let showTerminatedPayroll = false;

// 해당 월이 시작되기 전에 이미 퇴사한 경우에만 true (월중 퇴사자는 정산 대상에 포함)
function isTerminatedBeforeMonth(terminationDate, monthKey) {
  if (!terminationDate) return false;
  return String(terminationDate).slice(0, 7) < monthKey;
}

/**
 * 월별 급여 통합 행 생성
 * 4대보험 · 월급제 3.3% · 시급제 · 비율제 · 특강을 하나의 배열로 합칩니다.
 * 화면(renderPayroll)과 Excel 내보내기(exportPayrollToExcel)가 같은 데이터를 사용합니다.
 */
function buildPayrollRows(monthKey, businessId = 'all', options = {}) {
  const includeTerminated = !!options.includeTerminated;
  const rows = [];

  // 1) 4대보험 직원
  getInsuranceTeachersByBusiness(businessId).forEach(teacher => {
    if (!includeTerminated && isTerminatedBeforeMonth(teacher.terminationDate, monthKey)) return;
    if (!(teacher.monthlySalary > 0)) return;
    // 입사 이전 달에는 급여가 발생하지 않음 (월별 비교에서 과거 달이 부풀지 않도록)
    if (teacher.hireDate && monthKey < teacher.hireDate.slice(0, 7)) return;

    const absentDays = getInsuranceAbsenceDays(teacher.id, monthKey);
    const calc = calculateInsurancePayroll(teacher, absentDays);

    rows.push({
      type: 'insurance',
      id: teacher.id,
      typeLabel: '4대보험',
      badgeClass: 'badge-insurance',
      name: teacher.name,
      residentId: teacher.residentId || '-',
      businessId: teacher.businessId,
      businessName: getBusinessName(teacher.businessId),
      terminated: !!teacher.terminationDate,
      basisText: absentDays > 0 ? `결근 ${absentDays}일` : '정상근무',
      basisHTML: `
        <div style="display: flex; align-items: center; gap: 0.375rem; white-space: nowrap;">
          <span style="color: var(--text-light); font-size: 0.8125rem;">결근</span>
          <input type="number" min="0" step="1" value="${absentDays}" class="form-input"
            style="width: 72px; min-width: 72px; padding: 0.35rem 0.5rem;"
            onchange="updateInsuranceAbsenceDays(${teacher.id}, this.value)">
          <span style="color: var(--text-light); font-size: 0.8125rem;">일</span>
        </div>`,
      detailText: `월급여 ${formatKRW(calc.monthlySalary)}${absentDays > 0 ? ` − 결근공제 ${formatKRW(calc.absenceDeduction)}` : ''}`,
      gross: calc.monthlySalary,
      deduction: calc.totalDeduction + calc.absenceDeduction,
      deductionNote: absentDays > 0 ? '4대보험·소득세 + 결근공제' : '4대보험·소득세',
      net: calc.finalNetPay,
      memo: '',
      actionsHTML: `
        <button class="btn btn-outline btn-sm" onclick="showInsuranceDetailModal(${teacher.id})">상세</button>
        <button class="btn btn-primary btn-sm" onclick="generateInsurancePDF(${teacher.id}, '${monthKey}')">PDF</button>`
    });
  });

  // 2) 월급제 3.3% 강사
  getMonthlyInstructorsByBusiness(businessId).forEach(instructor => {
    if (!includeTerminated && isTerminatedBeforeMonth(instructor.terminationDate, monthKey)) return;

    const payroll = getMonthlyInstructorPayroll(instructor.id, monthKey);
    if (!payroll || payroll.grossPay <= 0) return;

    const calc = calculateMonthlyInstructorPayroll(payroll.grossPay, appData.settings, payroll.extraDeduction);
    const sourceLabel = payroll.source === 'default' ? '기본월급 자동 적용' : '월별 지급액 입력';

    rows.push({
      type: 'monthlyInstructor',
      id: instructor.id,
      typeLabel: '월급제 3.3%',
      badgeClass: 'badge-instructor',
      name: instructor.name,
      residentId: instructor.residentId || '-',
      businessId: instructor.businessId,
      businessName: getBusinessName(instructor.businessId),
      terminated: !!instructor.terminationDate,
      basisText: sourceLabel,
      basisHTML: `<span style="font-size: 0.8125rem; color: var(--text-light);">${sourceLabel}</span>`,
      detailText: `세전 ${formatKRW(calc.grossPay)}${calc.extraDeduction > 0 ? ` · 추가공제 ${formatKRW(calc.extraDeduction)}` : ''}`,
      gross: calc.grossPay,
      deduction: calc.totalDeduction,
      deductionNote: calc.extraDeduction > 0 ? '사업소득세 3.3% + 추가공제' : '사업소득세 3.3%',
      net: calc.netPay,
      memo: payroll.memo || '',
      actionsHTML: `
        <button class="btn btn-accent btn-sm" onclick="openMonthlyInstructorPayrollModal(${instructor.id})">금액수정</button>
        <button class="btn btn-primary btn-sm" onclick="generateMonthlyInstructorPDF(${instructor.id}, '${monthKey}')">PDF</button>`
    });
  });

  // 3) 시급제 직원 (근무기록이 있는 경우만)
  getStaffByBusiness(businessId).forEach(staff => {
    const logs = getStaffWorkLogs(staff.id, monthKey);
    const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
    if (totalHours <= 0) return;

    const wage = calculateWage(staff, totalHours);
    const ded = calculateDeduction(staff, wage.grossPay, appData.settings);
    const subType = staff.type === 'assistant' ? '조교' : '파트강사';

    rows.push({
      type: 'hourly',
      id: staff.id,
      typeLabel: `시급제 · ${subType}`,
      badgeClass: staff.type === 'assistant' ? 'badge-assistant' : 'badge-instructor',
      name: staff.name,
      residentId: staff.residentId || '-',
      businessId: staff.businessId,
      businessName: getBusinessName(staff.businessId),
      terminated: !!staff.terminationDate,
      basisText: formatHours(totalHours),
      basisHTML: `<strong>${formatHours(totalHours)}</strong>`,
      detailText: wage.breakdown,
      gross: wage.grossPay,
      deduction: ded.deduction,
      deductionNote: ded.typeName,
      net: ded.netPay,
      memo: '',
      actionsHTML: `
        <button class="btn btn-accent btn-sm" onclick="openPayrollWorkLogModal(${staff.id})">시간수정</button>
        <button class="btn btn-outline btn-sm" onclick="showPayslip(${staff.id})">보기</button>
        <button class="btn btn-primary btn-sm" onclick="generateStaffPayrollPDF(${staff.id}, '${monthKey}')">PDF</button>`
    });
  });

  // 4) 비율제 강사 (등록 학생이 있는 경우만)
  getCommissionInstructorsByBusiness(businessId).forEach(instructor => {
    const students = getCommissionStudents(instructor.id, monthKey);
    if (students.length === 0) return;

    const calc = calculateCommission(instructor, students, appData.settings);

    rows.push({
      type: 'commission',
      id: instructor.id,
      typeLabel: `비율제 ${formatPercent(instructor.commissionRate)}`,
      badgeClass: 'badge-part',
      name: instructor.name,
      residentId: instructor.residentId || '-',
      businessId: instructor.businessId,
      businessName: getBusinessName(instructor.businessId),
      terminated: !!instructor.terminationDate,
      basisText: `학생 ${calc.studentCount}명 · 수강료 ${formatKRW(calc.totalTuition)}`,
      basisHTML: `<strong>${calc.studentCount}명</strong><br><span style="font-size: 0.8125rem; color: var(--text-light);">${formatKRW(calc.totalTuition)}</span>`,
      detailText: calc.breakdown,
      gross: calc.instructorGross,
      deduction: calc.totalDeduction,
      deductionNote: '카드 1% + 사업소득세 3.3%',
      net: calc.netPay,
      memo: '',
      actionsHTML: `
        <button class="btn btn-outline btn-sm" onclick="showCommissionPayslip(${instructor.id})">보기</button>
        <button class="btn btn-primary btn-sm" onclick="generateCommissionPDF(${instructor.id}, '${monthKey}')">PDF</button>`
    });
  });

  // 5) 특강 — 강사별로 묶어서 한 행 (한 강사가 여러 특강을 맡아도 한 줄)
  const specialGroups = [];
  getSpecialLecturesByBusiness(businessId).forEach(lecture => {
    const students = getSpecialLectureStudents(lecture.id, monthKey);
    if (students.length === 0) return;

    const calc = calculateSpecialLecture(lecture, students, appData.settings);
    const instructorName = (lecture.instructorName || '').trim() || '(강사 미지정)';
    const groupKey = `${instructorName}__${lecture.businessId}`;

    let group = specialGroups.find(g => g.key === groupKey);
    if (!group) {
      group = { key: groupKey, instructorName, businessId: lecture.businessId, items: [] };
      specialGroups.push(group);
    }
    group.items.push({ lecture, calc });
  });

  specialGroups.forEach(group => {
    const items = group.items;
    const gross = items.reduce((s, it) => s + it.calc.instructorGross, 0);
    const deduction = items.reduce((s, it) => s + it.calc.totalDeduction, 0);
    const net = items.reduce((s, it) => s + it.calc.netPay, 0);
    const studentCount = items.reduce((s, it) => s + it.calc.studentCount, 0);
    const totalTuition = items.reduce((s, it) => s + it.calc.totalTuition, 0);
    const isSingle = items.length === 1;

    // 3.3% 제외 여부가 특강마다 다를 수 있으므로 구분해서 표기
    const taxExcludedCount = items.filter(it => it.calc.taxExcluded).length;
    let deductionNote;
    if (taxExcludedCount === items.length) {
      deductionNote = '카드 1% (3.3% 제외)';
    } else if (taxExcludedCount === 0) {
      deductionNote = '카드 1% + 사업소득세 3.3%';
    } else {
      deductionNote = '카드 1% + 사업소득세 3.3% (일부 특강 제외)';
    }

    const lectureNames = items.map(it => it.lecture.name).join(', ');
    const subjects = [...new Set(items.map(it => it.lecture.subject).filter(Boolean))].join(' · ');

    rows.push({
      type: 'special',
      id: items[0].lecture.id,
      lectureIds: items.map(it => it.lecture.id),
      typeLabel: isSingle ? `특강 ${formatPercent(items[0].lecture.commissionRate)}` : `특강 ${items.length}건`,
      badgeClass: 'badge-special',
      name: group.instructorName,
      residentId: '-',
      businessId: group.businessId,
      businessName: getBusinessName(group.businessId),
      terminated: false,
      basisText: `${lectureNames} · 학생 ${studentCount}명 · 수강료 ${formatKRW(totalTuition)}`,
      basisHTML: `<strong>${isSingle ? items[0].lecture.name : `특강 ${items.length}건`}</strong><br><span style="font-size: 0.8125rem; color: var(--text-light);">${studentCount}명 · ${formatKRW(totalTuition)}</span>`,
      detailText: isSingle
        ? items[0].calc.breakdown
        : items.map(it => `${it.lecture.name} ${formatPercent(it.lecture.commissionRate)} → ${formatKRW(it.calc.instructorGross)}`).join(' · '),
      gross,
      deduction,
      deductionNote,
      net,
      memo: subjects,
      actionsHTML: items.map(it =>
        `<button class="btn btn-primary btn-sm" onclick="generateSpecialLecturePDF(${it.lecture.id}, '${monthKey}')">${isSingle ? 'PDF' : `${it.lecture.name} PDF`}</button>`
      ).join('')
    });
  });

  return rows;
}

// 행 목록 정렬 (유형순 / 실지급액순 / 이름순)
function sortPayrollRows(rows, sortKey) {
  const order = {};
  PAYROLL_TYPES.forEach((t, i) => { order[t.key] = i; });

  const sorted = rows.slice();
  if (sortKey === 'net') {
    sorted.sort((a, b) => b.net - a.net);
  } else if (sortKey === 'name') {
    sorted.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  } else {
    sorted.sort((a, b) => (order[a.type] - order[b.type]) || a.name.localeCompare(b.name, 'ko'));
  }
  return sorted;
}

// 합계 계산
function sumPayrollRows(rows) {
  return rows.reduce((acc, r) => {
    acc.gross += r.gross;
    acc.deduction += r.deduction;
    acc.net += r.net;
    return acc;
  }, { gross: 0, deduction: 0, net: 0, count: rows.length });
}

function setPayrollTypeFilter(type) {
  payrollTypeFilter = type;
  renderContent();
}

function setPayrollSort(sortKey) {
  payrollSort = sortKey;
  renderContent();
}

function toggleTerminatedPayroll(show) {
  showTerminatedPayroll = show;
  renderContent();
}

function renderPayroll(container) {
  const { year, month } = parseMonthKey(selectedMonth);
  const businessTitle = selectedBusiness === 'all' ? '전체' : getBusinessName(selectedBusiness);

  const allRows = buildPayrollRows(selectedMonth, selectedBusiness, { includeTerminated: showTerminatedPayroll });
  const hasTerminated = allRows.some(r => r.terminated);

  // 유형 필터 + 정렬 적용
  const visibleRows = sortPayrollRows(
    payrollTypeFilter === 'all' ? allRows : allRows.filter(r => r.type === payrollTypeFilter),
    payrollSort
  );

  const total = sumPayrollRows(visibleRows);
  const grandTotal = sumPayrollRows(allRows);
  const isFiltered = payrollTypeFilter !== 'all';

  // 유형별 소계
  const typeStats = PAYROLL_TYPES.map(t => {
    const typeRows = allRows.filter(r => r.type === t.key);
    return Object.assign({}, t, sumPayrollRows(typeRows));
  });

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.25rem;">
      <h2 style="color: var(--primary);">${year}년 ${month}월 급여 정산 - ${businessTitle}</h2>
      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <div class="month-selector">
          <input type="month" value="${selectedMonth}" onchange="changeMonth(this.value)">
        </div>
        <button class="btn btn-success btn-sm" onclick="exportPayrollToExcel('${selectedMonth}', selectedBusiness)">Excel 다운로드</button>
      </div>
    </div>

    ${renderPendingMonthlyInstructorNoticeHTML()}

    <div class="summary-grid">
      <div class="summary-card primary">
        <div class="summary-label">총 지급 예정액</div>
        <div class="summary-value">${formatKRW(total.net)}</div>
        <div class="summary-sub">${isFiltered ? '선택한 유형 기준' : '4대보험·월급제·시급제·비율제·특강 전체'}</div>
      </div>
      <div class="summary-card accent">
        <div class="summary-label">총 세전 급여</div>
        <div class="summary-value">${formatKRW(total.gross)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label" style="color: var(--text-light);">총 공제액</div>
        <div class="summary-value" style="color: var(--danger);">${formatKRW(total.deduction)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label" style="color: var(--text-light);">정산 건수</div>
        <div class="summary-value" style="color: var(--primary);">${total.count}건</div>
        <div class="summary-sub" style="color: var(--text-light);">${isFiltered ? `전체 ${grandTotal.count}건 중` : '이 달 정산 대상'}</div>
      </div>
    </div>

    <div class="type-summary-grid">
      ${typeStats.map(t => `
        <div class="type-summary-item">
          <div class="tsi-head">
            <span class="badge ${t.badge}">${t.label}</span>
            <span class="tsi-count">${t.count}건</span>
          </div>
          <div class="tsi-net">${formatKRW(t.net)}</div>
          <div class="tsi-sub">세전 ${formatKRW(t.gross)} · 공제 ${formatKRW(t.deduction)}</div>
        </div>
      `).join('')}
    </div>

    <div class="payroll-toolbar">
      <button class="filter-chip ${payrollTypeFilter === 'all' ? 'active' : ''}" onclick="setPayrollTypeFilter('all')">
        전체<span class="chip-count">${allRows.length}</span>
      </button>
      ${PAYROLL_TYPES.map(t => {
        const count = allRows.filter(r => r.type === t.key).length;
        return `
          <button class="filter-chip ${payrollTypeFilter === t.key ? 'active' : ''}" onclick="setPayrollTypeFilter('${t.key}')">
            ${t.label}<span class="chip-count">${count}</span>
          </button>
        `;
      }).join('')}

      <div style="margin-left: auto; display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
        ${hasTerminated || showTerminatedPayroll ? `
          <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: var(--text-light); cursor: pointer;">
            <input type="checkbox" ${showTerminatedPayroll ? 'checked' : ''} onchange="toggleTerminatedPayroll(this.checked)">
            퇴사자 포함
          </label>
        ` : ''}
        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8125rem; color: var(--text-light);">
          정렬
          <select class="form-input" style="width: auto; padding: 0.35rem 0.6rem; font-size: 0.8125rem;" onchange="setPayrollSort(this.value)">
            <option value="type" ${payrollSort === 'type' ? 'selected' : ''}>유형순</option>
            <option value="net" ${payrollSort === 'net' ? 'selected' : ''}>실지급액순</option>
            <option value="name" ${payrollSort === 'name' ? 'selected' : ''}>이름순</option>
          </select>
        </label>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">${year}년 ${month}월 급여 통합 내역 (${visibleRows.length}건)</h3>
      </div>
      <div style="padding: 0 1.5rem 1rem; color: var(--text-light); font-size: 0.8125rem;">
        4대보험 결근일수와 월급제 지급액은 이 표에서 바로 수정할 수 있습니다. 시급제는 <strong style="color: var(--text);">시간수정</strong>에서 근무기록을 추가·수정합니다.
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>주민번호</th>
              <th>소속</th>
              <th>유형</th>
              <th>기준 내역</th>
              <th>산출 내역</th>
              <th>세전</th>
              <th>공제</th>
              <th>실지급</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${visibleRows.length > 0 ? `
              ${visibleRows.map(row => `
                <tr class="${row.terminated ? 'payroll-row-terminated' : ''}">
                  <td>
                    <strong style="${row.terminated ? 'text-decoration: line-through; color: var(--text-light);' : ''}">${row.name}</strong>
                    ${row.terminated ? '<span class="badge" style="background: #ffebee; color: #c62828; margin-left: 0.375rem; font-size: 0.7rem;">퇴사</span>' : ''}
                    ${row.memo ? `<br><span style="font-size: 0.75rem; color: var(--text-light);">${row.memo}</span>` : ''}
                  </td>
                  <td style="font-family: monospace; font-size: 0.8125rem;">${row.residentId}</td>
                  <td><span class="badge badge-business">${row.businessName}</span></td>
                  <td><span class="badge ${row.badgeClass}">${row.typeLabel}</span></td>
                  <td>${row.basisHTML}</td>
                  <td style="font-size: 0.8125rem; color: var(--text-light);">${row.detailText}</td>
                  <td>${formatKRW(row.gross)}</td>
                  <td style="color: var(--danger); font-size: 0.8125rem;">
                    -${formatKRW(row.deduction)}<br>
                    <span style="color: var(--text-light);">(${row.deductionNote})</span>
                  </td>
                  <td><strong style="color: var(--success);">${formatKRW(row.net)}</strong></td>
                  <td><div class="actions">${row.actionsHTML}</div></td>
                </tr>
              `).join('')}
              <tr style="border-top: 2px solid var(--border); background: var(--bg); font-weight: 700;">
                <td colspan="6">합계 (${total.count}건)</td>
                <td>${formatKRW(total.gross)}</td>
                <td style="color: var(--danger);">-${formatKRW(total.deduction)}</td>
                <td style="color: var(--success);">${formatKRW(total.net)}</td>
                <td></td>
              </tr>
            ` : `
              <tr><td colspan="10" class="empty-state">${isFiltered ? '이 유형의 정산 데이터가 없습니다.' : '이 달의 급여 정산 데이터가 없습니다.'}</td></tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 비율제 강사 급여명세서
function showCommissionPayslip(instructorId) {
  const instructor = getCommissionInstructorById(instructorId);
  const { year, month } = parseMonthKey(selectedMonth);
  const students = getCommissionStudents(instructorId, selectedMonth);
  const calc = calculateCommission(instructor, students, appData.settings);

  const payslipHTML = `
    <div class="payslip" id="payslipContent">
      <div class="payslip-header">
        <div class="payslip-title">급 여 명 세 서</div>
        <div class="payslip-period">${year}년 ${month}월</div>
      </div>

      <div class="payslip-info">
        <div>
          <div class="payslip-section">
            <div class="payslip-section-title">사업장 정보</div>
            <div class="payslip-row">
              <span>상호</span>
              <span>강한영어수학학원</span>
            </div>
          </div>
        </div>
        <div>
          <div class="payslip-section">
            <div class="payslip-section-title">강사 정보</div>
            <div class="payslip-row">
              <span>성명</span>
              <span>${instructor.name}</span>
            </div>
            <div class="payslip-row">
              <span>정산비율</span>
              <span>${formatPercent(instructor.commissionRate)}</span>
            </div>
            <div class="payslip-row">
              <span>주민등록번호</span>
              <span>${instructor.residentId || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="payslip-section">
        <div class="payslip-section-title">수강료 내역</div>
        <div class="payslip-row">
          <span>담당 학생수</span>
          <span>${calc.studentCount}명</span>
        </div>
        <div class="payslip-row">
          <span>총 수강료</span>
          <span>${formatKRW(calc.totalTuition)}</span>
        </div>
        <div class="payslip-row">
          <span>카드수수료 (1%)</span>
          <span style="color: var(--danger);">-${formatKRW(calc.cardFee)}</span>
        </div>
        <div class="payslip-row">
          <span>수수료 공제 후</span>
          <span>${formatKRW(calc.afterCardFee)}</span>
        </div>
      </div>

      <div class="payslip-section">
        <div class="payslip-section-title">급여 내역</div>
        <div class="payslip-row">
          <span>강사 몫 (${formatPercent(instructor.commissionRate)})</span>
          <span>${formatKRW(calc.instructorGross)}</span>
        </div>
        <div class="payslip-row">
          <span>사업소득세 (3.3%)</span>
          <span style="color: var(--danger);">-${formatKRW(calc.incomeTax)}</span>
        </div>
      </div>

      <div class="payslip-total">
        <div class="payslip-total-row">
          <span>실 지급액</span>
          <span>${formatKRW(calc.netPay)}</span>
        </div>
      </div>

      <div class="payslip-signature">
        <div class="payslip-signature-box">
          <div class="payslip-signature-line"></div>
          <div>사업주</div>
        </div>
        <div class="payslip-signature-box">
          <div class="payslip-signature-line"></div>
          <div>강사</div>
        </div>
      </div>

      <div class="payslip-footer">
        강한영어수학학원 급여관리시스템
      </div>
    </div>
  `;

  document.getElementById('modalTitle').textContent = `${instructor.name} 급여명세서`;
  document.getElementById('modalBody').innerHTML = payslipHTML;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">닫기</button>
    <button class="btn btn-primary" onclick="printPayslip()">인쇄하기</button>
  `;
  openModal();
}

// ============ 급여명세서 (인쇄용) ============
function showPayslip(staffId) {
  const staff = getStaffById(staffId);
  const { year, month } = parseMonthKey(selectedMonth);
  const logs = getStaffWorkLogs(staffId, selectedMonth);
  const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
  const wage = calculateWage(staff, totalHours);
  const ded = calculateDeduction(staff, wage.grossPay, appData.settings);
  const typeName = staff.type === 'assistant' ? '조교' : '강사';

  // 근무일수 계산
  const workDays = new Set(logs.map(l => l.date)).size;
  // 쉬는시간은 급여에 포함되지 않으므로 근거로 함께 표기
  const totalBreakMinutes = logs.reduce((sum, l) => sum + (l.breakMinutes || 0), 0);

  const payslipHTML = `
    <div class="payslip" id="payslipContent">
      <div class="payslip-header">
        <div class="payslip-title">급 여 명 세 서</div>
        <div class="payslip-period">${year}년 ${month}월</div>
      </div>

      <div class="payslip-info">
        <div>
          <div class="payslip-section">
            <div class="payslip-section-title">사업장 정보</div>
            <div class="payslip-row">
              <span>상호</span>
              <span>강한영어수학학원</span>
            </div>
          </div>
        </div>
        <div>
          <div class="payslip-section">
            <div class="payslip-section-title">근로자 정보</div>
            <div class="payslip-row">
              <span>성명</span>
              <span>${staff.name}</span>
            </div>
            <div class="payslip-row">
              <span>직종</span>
              <span>${typeName}</span>
            </div>
            <div class="payslip-row">
              <span>주민등록번호</span>
              <span>${staff.residentId || '-'}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="payslip-section">
        <div class="payslip-section-title">근무 내역</div>
        <div class="payslip-row">
          <span>근무일수</span>
          <span>${workDays}일</span>
        </div>
        <div class="payslip-row">
          <span>총 근무시간</span>
          <span>${formatHours(totalHours)}</span>
        </div>
        ${totalBreakMinutes > 0 ? `
          <div class="payslip-row" style="color: var(--text-light);">
            <span>총 휴게시간 (급여 미포함)</span>
            <span>${totalBreakMinutes}분</span>
          </div>
        ` : ''}
        ${staff.tier1Hours > 0 && wage.tier1Hours > 0 ? `
          <div class="payslip-row">
            <span>1구간 (${formatKRW(staff.tier1Rate)}/시간)</span>
            <span>${wage.tier1Hours}시간 = ${formatKRW(wage.tier1Pay)}</span>
          </div>
          <div class="payslip-row">
            <span>2구간 (${formatKRW(staff.tier2Rate)}/시간)</span>
            <span>${wage.tier2Hours}시간 = ${formatKRW(wage.tier2Pay)}</span>
          </div>
        ` : `
          <div class="payslip-row">
            <span>시급</span>
            <span>${formatKRW(staff.tier2Rate || staff.hourlyRate)}</span>
          </div>
        `}
      </div>

      <div class="payslip-section">
        <div class="payslip-section-title">급여 내역</div>
        <div class="payslip-row">
          <span>세전 급여</span>
          <span>${formatKRW(wage.grossPay)}</span>
        </div>
        <div class="payslip-row">
          <span>${ded.typeName}</span>
          <span style="color: var(--danger);">-${formatKRW(ded.deduction)}</span>
        </div>
      </div>

      <div class="payslip-total">
        <div class="payslip-total-row">
          <span>실 지급액</span>
          <span>${formatKRW(ded.netPay)}</span>
        </div>
      </div>

      <div class="payslip-signature">
        <div class="payslip-signature-box">
          <div class="payslip-signature-line"></div>
          <div>사업주</div>
        </div>
        <div class="payslip-signature-box">
          <div class="payslip-signature-line"></div>
          <div>근로자</div>
        </div>
      </div>

      <div class="payslip-footer">
        강한영어수학학원 급여관리시스템
      </div>
    </div>
  `;

  document.getElementById('modalTitle').textContent = `${staff.name} 급여명세서`;
  document.getElementById('modalBody').innerHTML = payslipHTML;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">닫기</button>
    <button class="btn btn-primary" onclick="printPayslip()">인쇄하기</button>
  `;
  openModal();
}

function printPayslip() {
  const content = document.getElementById('payslipContent').innerHTML;
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>급여명세서</title>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/pretendard/1.3.9/static/pretendard.min.css" rel="stylesheet">
      <link rel="stylesheet" href="css/style.css">
      <style>
        body { background: white; padding: 20px; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      ${content}
      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// ============ 문자생성 ============
function renderMessages(container) {
  const { year, month } = parseMonthKey(selectedMonth);

  const staffWithWork = getStaffByBusiness(selectedBusiness).filter(staff => {
    const logs = getStaffWorkLogs(staff.id, selectedMonth);
    return logs.reduce((sum, log) => sum + log.hours, 0) > 0;
  });

  // 비율제 강사 중 학생이 있는 강사
  const commissionWithStudents = getCommissionInstructorsByBusiness(selectedBusiness).filter(instructor => {
    const students = getCommissionStudents(instructor.id, selectedMonth);
    return students.length > 0;
  });
  const monthlyInstructorWithPayroll = getMonthlyInstructorsByBusiness(selectedBusiness).filter(instructor => {
    const payroll = getMonthlyInstructorPayroll(instructor.id, selectedMonth);
    return !!payroll && payroll.grossPay > 0;
  });

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--primary);">${year}년 ${month}월 급여 확인 문자 생성</h2>
      <div class="month-selector">
        <input type="month" value="${selectedMonth}" onchange="changeMonth(this.value)">
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">시급제 직원 문자</h3>
        <button class="btn btn-accent" onclick="generateAllMessages()">전체 문자 생성</button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>실지급액</th>
              <th>문자생성</th>
            </tr>
          </thead>
          <tbody>
            ${staffWithWork.map(staff => {
              const logs = getStaffWorkLogs(staff.id, selectedMonth);
              const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
              const wage = calculateWage(staff, totalHours);
              const ded = calculateDeduction(staff, wage.grossPay, appData.settings);
              return `
                <tr>
                  <td><strong>${staff.name}</strong></td>
                  <td><strong>${formatKRW(ded.netPay)}</strong></td>
                  <td>
                    <button class="btn btn-primary btn-sm" onclick="showMessageModal(${staff.id})">문자 보기</button>
                  </td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="3" class="empty-state">이 달의 근무 기록이 있는 직원이 없습니다.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    ${commissionWithStudents.length > 0 ? `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">비율제 강사 문자</h3>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>비율</th>
              <th>실지급액</th>
              <th>문자생성</th>
            </tr>
          </thead>
          <tbody>
            ${commissionWithStudents.map(instructor => {
              const students = getCommissionStudents(instructor.id, selectedMonth);
              const calc = calculateCommission(instructor, students, appData.settings);
              return `
                <tr>
                  <td><strong>${instructor.name}</strong></td>
                  <td>${formatPercent(instructor.commissionRate)}</td>
                  <td><strong>${formatKRW(calc.netPay)}</strong></td>
                  <td>
                    <button class="btn btn-primary btn-sm" onclick="showCommissionMessageModal(${instructor.id})">문자 보기</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

    ${monthlyInstructorWithPayroll.length > 0 ? `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">월급제 3.3% 강사 문자</h3>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>세전</th>
              <th>실지급액</th>
              <th>문자생성</th>
            </tr>
          </thead>
          <tbody>
            ${monthlyInstructorWithPayroll.map(instructor => {
              const payroll = getMonthlyInstructorPayroll(instructor.id, selectedMonth);
              const calc = calculateMonthlyInstructorPayroll(payroll.grossPay, appData.settings, payroll.extraDeduction);
              return `
                <tr>
                  <td><strong>${instructor.name}</strong></td>
                  <td>${formatKRW(calc.grossPay)}</td>
                  <td><strong>${formatKRW(calc.netPay)}</strong></td>
                  <td>
                    <button class="btn btn-primary btn-sm" onclick="showMonthlyInstructorMessageModal(${instructor.id})">문자 보기</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

    <div id="allMessagesContainer"></div>
  `;
}

function showCommissionMessageModal(instructorId) {
  const instructor = getCommissionInstructorById(instructorId);
  const students = getCommissionStudents(instructorId, selectedMonth);
  const calc = calculateCommission(instructor, students, appData.settings);
  const message = generateCommissionMessage(instructor, selectedMonth, calc);
  const receiver = instructor?.phoneNumber || '';

  document.getElementById('modalTitle').textContent = `${instructor.name} 급여 확인 문자`;
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label class="form-label">수신번호</label>
      <input type="text" id="smsReceiver" class="form-input" value="${receiver}" placeholder="숫자만 입력">
      <small style="color: var(--text-light); font-size: 0.75rem;">비율제 강사 수정 화면에서 번호를 저장할 수 있습니다.</small>
    </div>
    <div class="form-group">
      <label class="form-label">문자 내용</label>
      <textarea id="smsMessageText" class="form-input" rows="10">${message}</textarea>
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">닫기</button>
    <button class="btn btn-success" onclick="copyMessage(\`${encodeURIComponent(message)}\`)">복사하기</button>
    <button class="btn btn-outline" id="smsTestButton" onclick="sendSmsFromModal('commission', ${instructorId}, true)">테스트 발송</button>
    <button class="btn btn-primary" id="smsSendButton" onclick="sendSmsFromModal('commission', ${instructorId}, false)">문자 보내기</button>
  `;
  openModal();
}

function showMessageModal(staffId) {
  const staff = getStaffById(staffId);
  const logs = getStaffWorkLogs(staffId, selectedMonth);
  const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
  const wage = calculateWage(staff, totalHours);
  const ded = calculateDeduction(staff, wage.grossPay, appData.settings);
  const message = generatePayrollMessage(staff, selectedMonth, totalHours, wage, ded);
  const receiver = staff?.phoneNumber || '';

  document.getElementById('modalTitle').textContent = `${staff.name} 급여 확인 문자`;
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label class="form-label">수신번호</label>
      <input type="text" id="smsReceiver" class="form-input" value="${receiver}" placeholder="숫자만 입력">
      <small style="color: var(--text-light); font-size: 0.75rem;">직원 수정 화면에서 번호를 저장할 수 있습니다.</small>
    </div>
    <div class="form-group">
      <label class="form-label">문자 내용</label>
      <textarea id="smsMessageText" class="form-input" rows="10">${message}</textarea>
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">닫기</button>
    <button class="btn btn-success" onclick="copyMessage(\`${encodeURIComponent(message)}\`)">복사하기</button>
    <button class="btn btn-outline" id="smsTestButton" onclick="sendSmsFromModal('staff', ${staffId}, true)">테스트 발송</button>
    <button class="btn btn-primary" id="smsSendButton" onclick="sendSmsFromModal('staff', ${staffId}, false)">문자 보내기</button>
  `;
  openModal();
}

function showMonthlyInstructorMessageModal(instructorId) {
  const instructor = getMonthlyInstructorById(instructorId);
  const payroll = getMonthlyInstructorPayroll(instructorId, selectedMonth);
  const calc = calculateMonthlyInstructorPayroll(payroll.grossPay, appData.settings, payroll.extraDeduction);
  const message = generateMonthlyInstructorMessage(instructor, selectedMonth, calc, payroll);
  const receiver = instructor?.phoneNumber || '';

  document.getElementById('modalTitle').textContent = `${instructor.name} 급여 확인 문자`;
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label class="form-label">수신번호</label>
      <input type="text" id="smsReceiver" class="form-input" value="${receiver}" placeholder="숫자만 입력">
      <small style="color: var(--text-light); font-size: 0.75rem;">월급제 강사 수정 화면에서 번호를 저장할 수 있습니다.</small>
    </div>
    <div class="form-group">
      <label class="form-label">문자 내용</label>
      <textarea id="smsMessageText" class="form-input" rows="10">${message}</textarea>
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">닫기</button>
    <button class="btn btn-success" onclick="copyMessage(\`${encodeURIComponent(message)}\`)">복사하기</button>
    <button class="btn btn-outline" id="smsTestButton" onclick="sendSmsFromModal('monthlyInstructor', ${instructorId}, true)">테스트 발송</button>
    <button class="btn btn-primary" id="smsSendButton" onclick="sendSmsFromModal('monthlyInstructor', ${instructorId}, false)">문자 보내기</button>
  `;
  openModal();
}

function copyMessage(encodedMessage) {
  const message = decodeURIComponent(encodedMessage);
  copyToClipboard(message);
}

function normalizePhoneNumber(phoneNumber) {
  return String(phoneNumber || '').replace(/[^\d]/g, '');
}

function getMessageTitle(name) {
  const { month } = parseMonthKey(selectedMonth);
  return `${month}월 급여 안내 - ${name}`;
}

async function sendSmsFromModal(targetType, targetId, isTest = false) {
  const receiver = normalizePhoneNumber(document.getElementById('smsReceiver')?.value);
  const message = document.getElementById('smsMessageText')?.value?.trim() || '';

  if (!receiver) {
    alert('수신번호를 입력해주세요.');
    return;
  }

  if (!message) {
    alert('문자 내용을 확인해주세요.');
    return;
  }

  const target = targetType === 'staff'
    ? getStaffById(targetId)
    : targetType === 'commission'
      ? getCommissionInstructorById(targetId)
      : getMonthlyInstructorById(targetId);

  const recipientName = target?.name || (targetType === 'staff' ? '직원' : '강사');
  const button = document.getElementById(isTest ? 'smsTestButton' : 'smsSendButton');
  const previousText = button?.textContent;

  if (button) {
    button.disabled = true;
    button.textContent = isTest ? '테스트 발송 중...' : '발송 중...';
  }

  try {
    const response = await fetch('/api/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        receiver,
        msg: message,
        title: getMessageTitle(recipientName),
        testMode: isTest,
        academyId: currentUser?.academyId || currentAcademyId,
        academyCode: currentUser?.academyCode || currentAcademyCode
      })
    });

    const result = await response.json();
    if (!response.ok || result.success === false) {
      throw new Error(result.message || '문자 발송에 실패했습니다.');
    }

    addMessageLog({
      academyId: currentUser?.academyId || currentAcademyId,
      targetType,
      targetId,
      recipientName,
      receiver,
      message,
      title: getMessageTitle(recipientName),
      status: isTest ? 'test-sent' : 'sent',
      resultCode: result.resultCode || null,
      messageId: result.msgId || null,
      requestedBy: currentUser?.loginId || 'admin',
      provider: 'aligo'
    });

    if (target && receiver !== normalizePhoneNumber(target.phoneNumber)) {
      target.phoneNumber = receiver;
      saveData(appData);
    }

    showToast(isTest ? '테스트 문자를 발송했습니다.' : '문자를 발송했습니다.');
  } catch (error) {
    alert(error.message);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText;
    }
  }
}

function generateAllMessages() {
  const staffWithWork = getStaffByBusiness(selectedBusiness).filter(staff => {
    const logs = getStaffWorkLogs(staff.id, selectedMonth);
    return logs.reduce((sum, log) => sum + log.hours, 0) > 0;
  });

  const commissionWithStudents = getCommissionInstructorsByBusiness(selectedBusiness).filter(instructor => {
    const students = getCommissionStudents(instructor.id, selectedMonth);
    return students.length > 0;
  });
  const monthlyInstructorWithPayroll = getMonthlyInstructorsByBusiness(selectedBusiness).filter(instructor => {
    const payroll = getMonthlyInstructorPayroll(instructor.id, selectedMonth);
    return !!payroll && payroll.grossPay > 0;
  });

  let html = '<div class="card"><div class="card-header"><h3 class="card-title">전체 문자 목록</h3></div>';

  // 시급제 직원 문자
  if (staffWithWork.length > 0) {
    html += '<h4 style="padding: 1rem 1rem 0; color: var(--primary);">시급제 직원</h4>';
    staffWithWork.forEach(staff => {
      const logs = getStaffWorkLogs(staff.id, selectedMonth);
      const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
      const wage = calculateWage(staff, totalHours);
      const ded = calculateDeduction(staff, wage.grossPay, appData.settings);
      const message = generatePayrollMessage(staff, selectedMonth, totalHours, wage, ded);

      html += `
        <div style="margin: 1rem; padding: 1rem; background: var(--bg); border-radius: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <strong>${staff.name}</strong>
            <button class="btn btn-success btn-sm" onclick="copyMessage(\`${encodeURIComponent(message)}\`)">복사</button>
          </div>
          <div class="message-preview" style="font-size: 0.8125rem;">${message}</div>
        </div>
      `;
    });
  }

  // 비율제 강사 문자
  if (commissionWithStudents.length > 0) {
    html += '<h4 style="padding: 1rem 1rem 0; color: var(--accent);">비율제 강사</h4>';
    commissionWithStudents.forEach(instructor => {
      const students = getCommissionStudents(instructor.id, selectedMonth);
      const calc = calculateCommission(instructor, students, appData.settings);
      const message = generateCommissionMessage(instructor, selectedMonth, calc);

      html += `
        <div style="margin: 1rem; padding: 1rem; background: var(--bg); border-radius: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <strong>${instructor.name}</strong> <span style="color: var(--text-light); font-size: 0.875rem;">(${formatPercent(instructor.commissionRate)})</span>
            <button class="btn btn-success btn-sm" onclick="copyMessage(\`${encodeURIComponent(message)}\`)">복사</button>
          </div>
          <div class="message-preview" style="font-size: 0.8125rem;">${message}</div>
        </div>
      `;
    });
  }

  if (monthlyInstructorWithPayroll.length > 0) {
    html += '<h4 style="padding: 1rem 1rem 0; color: var(--accent);">월급제 3.3% 강사</h4>';
    monthlyInstructorWithPayroll.forEach(instructor => {
      const payroll = getMonthlyInstructorPayroll(instructor.id, selectedMonth);
      const calc = calculateMonthlyInstructorPayroll(payroll.grossPay, appData.settings, payroll.extraDeduction);
      const message = generateMonthlyInstructorMessage(instructor, selectedMonth, calc, payroll);

      html += `
        <div style="margin: 1rem; padding: 1rem; background: var(--bg); border-radius: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <strong>${instructor.name}</strong>
            <button class="btn btn-success btn-sm" onclick="copyMessage(\`${encodeURIComponent(message)}\`)">복사</button>
          </div>
          <div class="message-preview" style="font-size: 0.8125rem;">${message}</div>
        </div>
      `;
    });
  }

  if (staffWithWork.length === 0 && commissionWithStudents.length === 0) {
    html += '<div class="empty-state" style="padding: 2rem;">이 달의 급여 정산 대상자가 없습니다.</div>';
  }

  html += '</div>';
  document.getElementById('allMessagesContainer').innerHTML = html;
}

// ============ 설정 ============
function renderSettings(container) {
  const pendingRequests = getPendingStaffRequests().filter(request => request.status === 'pending');
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">사업장 관리</h3>
        <button class="btn btn-primary btn-sm" onclick="openAddBusinessModal()">+ 사업장 추가</button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>사업장명</th>
              <th>소속 직원</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${appData.businesses.map(business => {
              const staffCount = appData.staff.filter(s => s.businessId === business.id).length;
              const instructorCount = appData.commissionInstructors.filter(i => i.businessId === business.id).length;
              return `
                <tr>
                  <td><strong>${business.name}</strong></td>
                  <td>${staffCount + instructorCount}명 (시급제 ${staffCount}, 비율제 ${instructorCount})</td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-outline btn-sm" onclick="openEditBusinessModal(${business.id})">수정</button>
                      <button class="btn btn-danger btn-sm" onclick="confirmDeleteBusiness(${business.id})">삭제</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">직원 가입 승인</h3>
      </div>
      ${pendingRequests.length === 0 ? `
        <div class="empty-state" style="padding: 1.5rem;">대기 중인 가입 신청이 없습니다.</div>
      ` : `
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>이름</th>
                <th>로그인ID</th>
                <th>연락처</th>
                <th>주민등록번호</th>
                <th>급여 계좌</th>
                <th>신청일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              ${pendingRequests.map(request => `
                <tr>
                  <td><strong>${request.name}</strong></td>
                  <td>${request.loginId}</td>
                  <td>${request.phoneNumber || '-'}</td>
                  <td style="font-family: monospace; font-size: 0.8125rem;">${request.residentId || '-'}</td>
                  <td style="font-size: 0.8125rem;">${escapeHtml(formatBankAccount(request)) || '-'}</td>
                  <td>${request.createdAt ? request.createdAt.slice(0, 10) : '-'}</td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-primary btn-sm" onclick="openApproveSignupModal(${request.id})">승인</button>
                      <button class="btn btn-danger btn-sm" onclick="handleRejectSignupRequest(${request.id})">거절</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">데이터 관리</h3>
      </div>
      <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
        <button class="btn btn-primary" onclick="exportDataAsJSON()">데이터 백업 (JSON)</button>
        <label class="btn btn-outline" style="cursor: pointer;">
          데이터 복원 (JSON)
          <input type="file" accept=".json" style="display: none;" onchange="handleImportJSON(this)">
        </label>
        <button class="btn btn-danger" onclick="handleResetData()">전체 초기화</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">공제율 설정</h3>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">조교 고용보험료율 (%)</label>
          <input type="number" id="assistantRate" class="form-input" value="${appData.settings.assistantDeduction * 100}" step="0.1" min="0" max="100">
        </div>
        <div class="form-group">
          <label class="form-label">강사 사업소득세율 (%)</label>
          <input type="number" id="instructorRate" class="form-input" value="${appData.settings.instructorDeduction * 100}" step="0.1" min="0" max="100">
        </div>
        <div class="form-group">
          <label class="form-label">카드 수수료율 (%, 비율제 강사용)</label>
          <input type="number" id="cardFeeRate" class="form-input" value="${appData.settings.cardFeeRate * 100}" step="0.1" min="0" max="100">
        </div>
      </div>
      <button class="btn btn-primary" onclick="saveSettings()">설정 저장</button>
    </div>

    ${(() => {
      const rates = getActiveInsuranceRates();
      const toPercent = (rate) => parseFloat((rate * 100).toFixed(4));
      return `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">4대보험 요율 설정 (근로자 부담분)</h3>
      </div>
      <div style="padding: 0 0 1rem; color: var(--text-light); font-size: 0.875rem;">
        4대보험 직원의 급여 공제에 적용되는 요율입니다. 매년 요율이 변경되므로 <strong style="color: var(--text);">세무사 안내에 따라</strong> 아래 값을 수정 후 저장하세요.
        저장 즉시 4대보험 직원의 공제액·실지급액·급여명세서(PDF)에 반영됩니다.
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">국민연금 (%)</label>
          <input type="number" id="insRateNationalPension" class="form-input" value="${toPercent(rates.nationalPension)}" step="0.001" min="0" max="100">
          <small style="color: var(--text-light);">기본값 ${formatRatePercent(INSURANCE_RATES.nationalPension)}</small>
        </div>
        <div class="form-group">
          <label class="form-label">건강보험 (%)</label>
          <input type="number" id="insRateHealthInsurance" class="form-input" value="${toPercent(rates.healthInsurance)}" step="0.001" min="0" max="100">
          <small style="color: var(--text-light);">기본값 ${formatRatePercent(INSURANCE_RATES.healthInsurance)}</small>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">장기요양 (건강보험료의 %)</label>
          <input type="number" id="insRateLongTermCare" class="form-input" value="${toPercent(rates.longTermCare)}" step="0.001" min="0" max="100">
          <small style="color: var(--text-light);">기본값 ${formatRatePercent(INSURANCE_RATES.longTermCare)} · 월급이 아닌 건강보험료 기준 비율</small>
        </div>
        <div class="form-group">
          <label class="form-label">고용보험 (%)</label>
          <input type="number" id="insRateEmploymentInsurance" class="form-input" value="${toPercent(rates.employmentInsurance)}" step="0.001" min="0" max="100">
          <small style="color: var(--text-light);">기본값 ${formatRatePercent(INSURANCE_RATES.employmentInsurance)}</small>
        </div>
      </div>
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
        <button class="btn btn-primary" onclick="saveInsuranceRates()">4대보험 요율 저장</button>
        <button class="btn btn-outline" onclick="resetInsuranceRates()">기본값(2026년 기준)으로 복원</button>
      </div>
      <div style="margin-top: 1rem; padding: 0.875rem 1rem; background: var(--bg); border-radius: 10px; font-size: 0.8125rem; color: var(--text-light);">
        예시) 월급 300만원 기준 현재 요율 적용 시:
        국민연금 ${formatKRW(Math.round(3000000 * rates.nationalPension))} ·
        건강보험 ${formatKRW(Math.round(3000000 * rates.healthInsurance))} ·
        장기요양 ${formatKRW(Math.round(Math.round(3000000 * rates.healthInsurance) * rates.longTermCare))} ·
        고용보험 ${formatKRW(Math.round(3000000 * rates.employmentInsurance))}
        <br>※ 소득세(간이세액표)와 지방소득세(소득세의 10%)는 별도 자동 계산됩니다.
      </div>
    </div>
      `;
    })()}

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">관리자 휴대폰 번호</h3>
      </div>
      <div class="form-group">
        <label class="form-label">휴대폰 번호</label>
        <input type="text" id="adminPhoneInput" class="form-input" value="${appData.users[currentUser.userId]?.phoneNumber || ''}" placeholder="숫자만 입력, 비밀번호 찾기에 사용됩니다">
      </div>
      <button class="btn btn-primary" onclick="saveAdminPhone()">휴대폰 번호 저장</button>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">시스템 정보</h3>
      </div>
      <div style="color: var(--text-light); font-size: 0.875rem;">
        <p>등록된 사업장 수: ${appData.businesses.length}개</p>
        <p>등록된 시급제 직원 수: ${appData.staff.length}명</p>
        <p>등록된 비율제 강사 수: ${appData.commissionInstructors.length}명</p>
        <p>등록된 월급제 3.3% 강사 수: ${appData.monthlyInstructors.length}명 (기본월급 설정 ${appData.monthlyInstructors.filter(i => i.defaultGrossPay > 0).length}명)</p>
        <p>등록된 4대보험 직원 수: ${appData.insuranceTeachers.length}명</p>
        <p>총 근무기록 수: ${appData.workLogs.length}건</p>
        <p>현재 최저시급: ${formatKRW(MINIMUM_WAGE)}</p>
      </div>
    </div>
  `;
}

// 관리자 본인 휴대폰 번호 저장 (비밀번호 찾기용)
function saveAdminPhone() {
  const input = document.getElementById('adminPhoneInput');
  if (!input) return;

  // 숫자만 추출
  const phoneNumber = (input.value || '').replace(/\D/g, '');
  const userId = currentUser.userId;

  if (!appData.users[userId]) {
    alert('관리자 계정 정보를 찾을 수 없습니다.');
    return;
  }

  appData.users[userId].phoneNumber = phoneNumber;
  saveData(appData);
  showToast('휴대폰 번호가 저장되었습니다.');
}

function openApproveSignupModal(requestId) {
  const request = getPendingStaffRequestById(requestId);
  if (!request) {
    alert('가입 신청을 찾을 수 없습니다.');
    return;
  }

  document.getElementById('modalTitle').textContent = '직원 가입 승인';
  document.getElementById('modalBody').innerHTML = `
    <div style="margin-bottom: 1rem; padding: 0.875rem 1rem; background: var(--bg); border-radius: 10px; font-size: 0.875rem; color: var(--text-light);">
      신청자 이름: <strong style="color: var(--text);">${request.name}</strong><br>
      희망 로그인 ID: <strong style="color: var(--text);">${request.requestedLoginId || request.name}</strong><br>
      배정 로그인 ID: <strong style="color: var(--primary);">${request.loginId}</strong><br>
      휴대폰 번호: <strong style="color: var(--text);">${request.phoneNumber || '-'}</strong><br>
      주민등록번호: <strong style="color: var(--text);">${request.residentId || '-'}</strong><br>
      급여 계좌: <strong style="color: var(--text);">${escapeHtml(formatBankAccount(request)) || '미입력'}</strong>
    </div>
    ${getStaffFormHTML({
      name: request.name,
      loginId: request.loginId,
      phoneNumber: request.phoneNumber || '',
      residentId: request.residentId || '',
      bankName: request.bankName || '',
      accountNumber: request.accountNumber || '',
      accountHolder: request.accountHolder || '',
      type: 'assistant',
      tier1Hours: 0,
      tier1Rate: MINIMUM_WAGE,
      tier2Rate: MINIMUM_WAGE,
      hourlyRate: MINIMUM_WAGE
    }, { lockLoginId: true })}
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveApprovedSignup(${requestId})">승인 완료</button>
  `;
  openModal();
}

function saveApprovedSignup(requestId) {
  const name = document.getElementById('staffName').value.trim();
  if (!name) {
    alert('이름을 입력해주세요.');
    return;
  }

  const residentId = formatResidentId(document.getElementById('staffResidentId').value.trim());
  if (residentId && !/^\d{6}-\d{7}$/.test(residentId)) {
    alert('주민등록번호는 000000-0000000 형식으로 입력해주세요.');
    return;
  }

  const bankAccount = readBankAccountFields('staff', name);
  const bankAccountError = validateBankAccount(bankAccount);
  if (bankAccountError) {
    alert(bankAccountError);
    return;
  }

  const result = approvePendingStaffRequest(requestId, {
    name,
    ...bankAccount,
    phoneNumber: document.getElementById('staffPhoneNumber').value.trim(),
    residentId,
    businessId: parseInt(document.getElementById('staffBusinessId').value, 10),
    type: document.getElementById('staffType').value,
    hourlyRate: parseInt(document.getElementById('tier2Rate').value, 10) || MINIMUM_WAGE,
    tier1Hours: parseInt(document.getElementById('tier1Hours').value, 10) || 0,
    tier1Rate: parseInt(document.getElementById('tier1Rate').value, 10) || 0,
    tier2Rate: parseInt(document.getElementById('tier2Rate').value, 10) || MINIMUM_WAGE,
    roundingRule: document.getElementById('roundingRule').value,
    hireDate: document.getElementById('staffHireDate').value || null,
    position: getPositionValue()
  });

  if (!result.success) {
    alert(result.message);
    return;
  }

  closeModal();
  renderContent();
  showToast(`가입 승인 완료. 로그인 ID: ${result.staff.loginId}`);
}

function handleRejectSignupRequest(requestId) {
  const request = getPendingStaffRequestById(requestId);
  if (!request) return;
  if (!confirm(`${request.name}님의 가입 신청을 거절하시겠습니까?`)) return;
  rejectPendingStaffRequest(requestId);
  renderContent();
  showToast('가입 신청이 거절되었습니다.');
}

// ============ 사업장 관리 모달 ============
function openAddBusinessModal() {
  document.getElementById('modalTitle').textContent = '사업장 추가';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label class="form-label">사업장명 *</label>
      <input type="text" id="businessName" class="form-input" placeholder="학원 이름">
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveNewBusiness()">저장</button>
  `;
  openModal();
}

function openEditBusinessModal(id) {
  const business = getBusinessById(id);
  document.getElementById('modalTitle').textContent = '사업장 수정';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label class="form-label">사업장명 *</label>
      <input type="text" id="businessName" class="form-input" value="${business.name}">
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveEditBusiness(${id})">저장</button>
  `;
  openModal();
}

function saveNewBusiness() {
  const name = document.getElementById('businessName').value.trim();
  if (!name) {
    alert('사업장명을 입력해주세요.');
    return;
  }

  addBusiness(name);
  closeModal();
  renderBusinessSelector();
  renderContent();
  showToast('사업장이 추가되었습니다.');
}

function saveEditBusiness(id) {
  const name = document.getElementById('businessName').value.trim();
  if (!name) {
    alert('사업장명을 입력해주세요.');
    return;
  }

  updateBusiness(id, name);
  closeModal();
  renderBusinessSelector();
  renderContent();
  showToast('사업장 정보가 수정되었습니다.');
}

function confirmDeleteBusiness(id) {
  const result = deleteBusiness(id);
  if (result.success) {
    renderBusinessSelector();
    renderContent();
    showToast('사업장이 삭제되었습니다.');
  } else {
    alert(result.message);
  }
}

function handleImportJSON(input) {
  if (input.files.length > 0) {
    importDataFromJSON(input.files[0])
      .then(() => {
        showToast('데이터가 복원되었습니다.');
        renderContent();
      })
      .catch(err => {
        alert('데이터 복원 실패: ' + err.message);
      });
  }
}

function handleResetData() {
  if (resetAllData()) {
    showToast('데이터가 초기화되었습니다.');
    renderContent();
  }
}

function saveSettings() {
  appData.settings.assistantDeduction = parseFloat(document.getElementById('assistantRate').value) / 100;
  appData.settings.instructorDeduction = parseFloat(document.getElementById('instructorRate').value) / 100;
  appData.settings.cardFeeRate = parseFloat(document.getElementById('cardFeeRate').value) / 100;
  saveData(appData);
  showToast('설정이 저장되었습니다.');
}

// 4대보험 요율 저장 (세무사 안내에 따라 조정)
function saveInsuranceRates() {
  const fields = [
    { id: 'insRateNationalPension', key: 'nationalPension', label: '국민연금' },
    { id: 'insRateHealthInsurance', key: 'healthInsurance', label: '건강보험' },
    { id: 'insRateLongTermCare', key: 'longTermCare', label: '장기요양' },
    { id: 'insRateEmploymentInsurance', key: 'employmentInsurance', label: '고용보험' }
  ];

  const newRates = {};
  for (const field of fields) {
    const percent = parseFloat(document.getElementById(field.id).value);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      alert(`${field.label} 요율을 확인해주세요. (0~100 사이의 % 값)`);
      return;
    }
    newRates[field.key] = percent / 100;
  }

  appData.settings.insuranceRates = newRates;
  saveData(appData);
  renderContent();
  showToast('4대보험 요율이 저장되었습니다. 모든 화면에 즉시 반영됩니다.');
}

function resetInsuranceRates() {
  if (!confirm('4대보험 요율을 기본값(2026년 기준)으로 복원하시겠습니까?')) return;
  appData.settings.insuranceRates = { ...INSURANCE_RATES };
  saveData(appData);
  renderContent();
  showToast('4대보험 요율이 기본값으로 복원되었습니다.');
}

// ============ 직원 화면: 내 근무기록 ============
function renderMyWork(container) {
  const staff = currentUser.staff;
  const logs = getStaffWorkLogs(staff.id, selectedMonth);
  const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
  const wage = calculateWage(staff, totalHours);
  const ded = calculateDeduction(staff, wage.grossPay, appData.settings);
  const { year, month } = parseMonthKey(selectedMonth);

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--primary);">${staff.name}님의 ${month}월 근무현황</h2>
      <div class="month-selector">
        <input type="month" value="${selectedMonth}" onchange="changeMonth(this.value)">
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card primary">
        <div class="summary-label">예상 실지급액</div>
        <div class="summary-value">${formatKRW(ded.netPay)}</div>
        <div class="summary-sub">${ded.typeName} 공제 후</div>
      </div>
      <div class="summary-card">
        <div class="summary-label" style="color: var(--text-light);">총 근무시간</div>
        <div class="summary-value" style="color: var(--primary);">${formatHours(totalHours)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label" style="color: var(--text-light);">세전 급여</div>
        <div class="summary-value" style="color: var(--accent);">${formatKRW(wage.grossPay)}</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">근무 기록</h3>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>날짜</th>
              <th>출근</th>
              <th>퇴근</th>
              <th>근무시간</th>
              <th>메모</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${logs.sort((a, b) => b.date.localeCompare(a.date)).map(log => `
              <tr>
                <td>${log.date}</td>
                <td>${log.startTime || '-'}</td>
                <td>${log.endTime || '-'}</td>
                <td>${formatHours(log.hours)}</td>
                <td style="font-size: 0.8125rem; color: var(--text-light);">${log.memo || ''}</td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="openEditMyWorkLogModal(${log.id})">수정</button>
                  <button class="btn btn-danger btn-sm" onclick="deleteMyWorkLog(${log.id})">삭제</button>
                </td>
              </tr>
            `).join('') || '<tr><td colspan="6" class="empty-state">이 달의 근무기록이 없습니다.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 직원이 자기 근무기록 삭제
function deleteMyWorkLog(logId) {
  if (confirm('이 근무기록을 삭제하시겠습니까?')) {
    deleteWorkLog(logId);
    renderContent();
    showToast('근무기록이 삭제되었습니다.');
  }
}

// 근무기록 수정 모달
function openEditMyWorkLogModal(logId) {
  const log = appData.workLogs.find(l => l.id === logId);
  if (!log) {
    showToast('근무기록을 찾을 수 없습니다.');
    return;
  }

  const staff = getStaffById(log.staffId);
  const staffName = staff ? staff.name : '알 수 없음';

  document.getElementById('modalTitle').textContent = '근무기록 수정';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label class="form-label">직원</label>
      <input type="text" class="form-input" value="${staffName}" disabled>
    </div>
    <div class="form-group">
      <label class="form-label">날짜 *</label>
      <input type="date" id="editLogDate" class="form-input" value="${log.date}">
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
      <div class="form-group">
        <label class="form-label">출근 시간 *</label>
        <input type="time" id="editLogStartTime" class="form-input" value="${log.startTime || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">퇴근 시간 *</label>
        <input type="time" id="editLogEndTime" class="form-input" value="${log.endTime || ''}">
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">휴게시간 (분)</label>
      <input type="number" id="editLogBreak" class="form-input" value="${log.breakMinutes || 0}" min="0">
      <small style="color: var(--text-light);">쉬는시간은 급여에 포함되지 않습니다.</small>
    </div>
    <div class="form-group">
      <label class="form-label">메모</label>
      <input type="text" id="editLogMemo" class="form-input" value="${log.memo || ''}" placeholder="메모 (선택)">
    </div>
    <div id="editLogPreview" style="margin-top: 1rem; padding: 1rem; background: var(--bg); border-radius: 8px;">
      <strong>계산된 근무시간:</strong> <span id="editLogHoursPreview">${log.hours.toFixed(2)}시간</span>
    </div>
  `;

  // 시간 변경 시 미리보기 업데이트
  const updatePreview = () => {
    const start = document.getElementById('editLogStartTime').value;
    const end = document.getElementById('editLogEndTime').value;
    const breakMin = parseInt(document.getElementById('editLogBreak').value) || 0;

    if (start && end) {
      const hours = calculateHours(start, end, breakMin, staff?.roundingRule || 'exact');
      document.getElementById('editLogHoursPreview').textContent = hours.toFixed(2) + '시간';
    }
  };

  document.getElementById('editLogStartTime').addEventListener('change', updatePreview);
  document.getElementById('editLogEndTime').addEventListener('change', updatePreview);
  document.getElementById('editLogBreak').addEventListener('change', updatePreview);

  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveEditMyWorkLog(${logId})">저장</button>
  `;
  openModal();
}

// 근무기록 수정 저장
function saveEditMyWorkLog(logId) {
  const date = document.getElementById('editLogDate').value;
  const startTime = document.getElementById('editLogStartTime').value;
  const endTime = document.getElementById('editLogEndTime').value;
  const breakMinutes = parseInt(document.getElementById('editLogBreak').value) || 0;
  const memo = document.getElementById('editLogMemo').value.trim();

  if (!date || !startTime || !endTime) {
    alert('날짜와 출퇴근 시간을 모두 입력해주세요.');
    return;
  }

  const log = appData.workLogs.find(l => l.id === logId);
  if (!log) {
    showToast('근무기록을 찾을 수 없습니다.');
    return;
  }

  const staff = getStaffById(log.staffId);
  const hours = calculateHours(startTime, endTime, breakMinutes, staff?.roundingRule || 'exact');

  const nextLog = {
    staffId: log.staffId,
    date,
    startTime,
    endTime,
    breakMinutes,
    hours,
    memo
  };

  if (!hasWorkLogChanges(log, nextLog)) {
    closeModal();
    showToast('변경된 내용이 없습니다.');
    return;
  }

  updateWorkLog(logId, {
    ...nextLog,
    modifiedAt: new Date().toISOString(),
    modifiedByType: 'staff',
    modifiedByName: currentUser.staff?.name || '직원',
    historyEntry: {
      editedByType: 'staff',
      editedById: currentUser.staffId,
      editedByName: currentUser.staff?.name || '직원',
      editedAt: new Date().toISOString(),
      reason: ''
    }
  });

  closeModal();
  renderContent();
  showToast('근무기록이 수정되었습니다.');
}

// ============ 직원 화면: 출퇴근 기록 ============
function renderClockIn(container) {
  const staff = currentUser.staff;
  const today = formatDate();
  const todayLogs = appData.workLogs.filter(l => l.staffId === staff.id && l.date === today);
  const lastLog = todayLogs[todayLogs.length - 1];

  container.innerHTML = `
    <div class="card" style="max-width: 500px; margin: 2rem auto;">
      <h2 style="text-align: center; margin-bottom: 1.5rem; color: var(--primary);">출퇴근 기록</h2>

      <div style="text-align: center; margin-bottom: 2rem;">
        <div style="font-size: 3rem; font-weight: 700; color: var(--primary);" id="currentTime"></div>
        <div style="color: var(--text-light);">${today}</div>
      </div>

      ${lastLog && !lastLog.endTime ? `
        <div style="text-align: center; padding: 1rem; background: #e8f5e9; border-radius: 10px; margin-bottom: 1.5rem;">
          <div style="color: var(--success); font-weight: 600;">출근 완료</div>
          <div>출근시간: ${lastLog.startTime}</div>
        </div>
        <div class="form-group">
          <label class="form-label">휴게시간 (분)</label>
          <input type="number" id="clockOutBreak" class="form-input" value="${lastLog.breakMinutes || 0}" min="0" step="10" placeholder="예: 30">
          <small style="color: var(--text-light);">쉬는시간은 급여에 포함되지 않습니다.</small>
        </div>
        <button class="btn btn-danger" style="width: 100%; padding: 1rem; font-size: 1.125rem;" onclick="clockOut()">
          퇴근하기
        </button>
      ` : `
        <button class="btn btn-success" style="width: 100%; padding: 1rem; font-size: 1.125rem;" onclick="clockIn()">
          출근하기
        </button>
      `}

      <div style="margin-top: 2rem;">
        <h4 style="margin-bottom: 0.75rem;">또는 직접 입력</h4>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">날짜</label>
            <input type="date" id="manualDate" class="form-input" value="${today}">
          </div>
          <div class="form-group">
            <label class="form-label">근무시간</label>
            <input type="number" id="manualHours" class="form-input" step="0.5" min="0" placeholder="예: 3.5" oninput="updateManualPreview()">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">휴게시간 (분)</label>
          <input type="number" id="manualBreak" class="form-input" value="0" min="0" step="10" placeholder="예: 30" oninput="updateManualPreview()">
          <small style="color: var(--text-light);">쉬는시간은 급여에 포함되지 않습니다. 입력한 근무시간에서 차감됩니다.</small>
        </div>
        <div id="manualPreview" style="margin-bottom: 1rem; padding: 0.75rem; background: var(--bg); border-radius: 8px; font-size: 0.875rem; display: none;">
          급여 반영 시간: <strong id="manualPreviewHours">0시간</strong>
        </div>
        <div class="form-group">
          <label class="form-label">메모</label>
          <input type="text" id="manualMemo" class="form-input" placeholder="예: 보강">
        </div>
        <button class="btn btn-primary" style="width: 100%;" onclick="addManualLog()">기록 추가</button>
      </div>

      ${todayLogs.length > 0 ? `
        <div style="margin-top: 2rem; border-top: 1px solid #eee; padding-top: 1.5rem;">
          <h4 style="margin-bottom: 0.75rem;">오늘 기록 (${todayLogs.length}건)</h4>
          <div style="display: flex; flex-direction: column; gap: 0.5rem;">
            ${todayLogs.map(log => `
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: #f5f5f5; border-radius: 8px;">
                <div>
                  <span style="font-weight: 600;">${log.startTime || '직접입력'}</span>
                  ${log.endTime ? ` ~ ${log.endTime}` : ' (퇴근 전)'}
                  <span style="color: var(--primary); margin-left: 0.5rem;">${formatHours(log.hours)}</span>
                  ${log.breakMinutes ? `<span style="color: var(--text-light); font-size: 0.8rem; margin-left: 0.5rem;">휴게 ${log.breakMinutes}분 제외</span>` : ''}
                  ${log.memo ? `<span style="color: var(--text-light); font-size: 0.8rem; margin-left: 0.5rem;">(${log.memo})</span>` : ''}
                </div>
                <button class="btn btn-danger btn-sm" onclick="deleteTodayLog(${log.id})">삭제</button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  updateClock();
  if (clockIntervalId) {
    clearInterval(clockIntervalId);
  }
  clockIntervalId = setInterval(updateClock, 1000);
}

// 직접 입력 시 휴게시간을 뺀 급여 반영 시간 미리보기
function updateManualPreview() {
  const preview = document.getElementById('manualPreview');
  if (!preview) return;

  const hours = parseFloat(document.getElementById('manualHours').value);
  const breakMinutes = parseInt(document.getElementById('manualBreak').value) || 0;

  if (isNaN(hours) || hours <= 0) {
    preview.style.display = 'none';
    return;
  }

  const netHours = Math.max(0, hours - breakMinutes / 60);
  preview.style.display = 'block';
  document.getElementById('manualPreviewHours').textContent = formatHours(netHours);
}

function updateClock() {
  const el = document.getElementById('currentTime');
  if (el) {
    el.textContent = new Date().toLocaleTimeString('ko-KR');
  }
}

// 오늘 기록 삭제
function deleteTodayLog(logId) {
  if (confirm('이 기록을 삭제하시겠습니까?')) {
    deleteWorkLog(logId);
    renderContent();
    showToast('기록이 삭제되었습니다.');
  }
}

function clockIn() {
  const staff = currentUser.staff;
  const today = formatDate();
  const time = formatTime();

  addWorkLog({
    staffId: staff.id,
    date: today,
    startTime: time,
    endTime: '',
    breakMinutes: 0,
    hours: 0,
    memo: ''
  });

  renderContent();
  showToast('출근이 기록되었습니다!');
}

function clockOut() {
  const staff = currentUser.staff;
  const today = formatDate();
  const time = formatTime();

  const todayLogs = appData.workLogs.filter(l => l.staffId === staff.id && l.date === today);
  const lastLog = todayLogs[todayLogs.length - 1];

  if (lastLog && !lastLog.endTime) {
    const breakInput = document.getElementById('clockOutBreak');
    const breakMinutes = breakInput ? parseInt(breakInput.value) || 0 : (lastLog.breakMinutes || 0);

    const workedMinutes = (new Date(`2000-01-01 ${time}`) - new Date(`2000-01-01 ${lastLog.startTime}`)) / 60000;
    if (breakMinutes >= workedMinutes) {
      alert('휴게시간이 실제 근무시간보다 길거나 같습니다. 다시 확인해주세요.');
      return;
    }

    lastLog.endTime = time;
    lastLog.breakMinutes = breakMinutes;
    lastLog.hours = calculateHours(lastLog.startTime, lastLog.endTime, breakMinutes, staff.roundingRule || 'exact');
    saveData(appData);
    renderContent();
    showToast(`퇴근이 기록되었습니다! (${formatHours(lastLog.hours)}${breakMinutes ? `, 휴게 ${breakMinutes}분 제외` : ''})`);
  }
}

function addManualLog() {
  const staff = currentUser.staff;
  const date = document.getElementById('manualDate').value;
  const hours = parseFloat(document.getElementById('manualHours').value);
  const breakMinutes = parseInt(document.getElementById('manualBreak').value) || 0;
  const memo = document.getElementById('manualMemo').value.trim();

  if (!date || isNaN(hours) || hours <= 0) {
    alert('날짜와 근무시간을 입력해주세요.');
    return;
  }

  // 쉬는시간은 급여에 포함되지 않으므로 입력한 근무시간에서 차감
  const netHours = Math.max(0, hours - breakMinutes / 60);

  if (netHours <= 0) {
    alert('휴게시간이 근무시간보다 길거나 같습니다. 다시 확인해주세요.');
    return;
  }

  addWorkLog({
    staffId: staff.id,
    date,
    startTime: '',
    endTime: '',
    breakMinutes,
    hours: netHours,
    memo
  });

  document.getElementById('manualHours').value = '';
  document.getElementById('manualBreak').value = 0;
  document.getElementById('manualMemo').value = '';
  updateManualPreview();
  showToast('근무 기록이 추가되었습니다!');
}

// ============ 4대보험 직원 관리 ============

function formatResidentId(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 6) {
    return digits;
  }
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}

function renderInsuranceTeachers(container) {
  const allTeachers = getInsuranceTeachersByBusiness(selectedBusiness);
  const { year, month } = parseMonthKey(selectedMonth);
  const rates = getActiveInsuranceRates();

  // 재직/퇴사 보기
  const activeTeachers = allTeachers.filter(t => !t.terminationDate);
  const viewInfo = getEmploymentViewList('insurance', allTeachers);
  const filteredTeachers = viewInfo.rows;

  // 재직자 기준 월 합계 (요약 카드용)
  let sumSalary = 0, sumDeduction = 0, sumNet = 0;
  activeTeachers.forEach(teacher => {
    const absentDays = getInsuranceAbsenceDays(teacher.id, selectedMonth);
    const calc = calculateInsurancePayroll(teacher, absentDays);
    sumSalary += calc.monthlySalary;
    sumDeduction += calc.totalDeduction + calc.absenceDeduction;
    sumNet += calc.finalNetPay;
  });

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
      <h2 style="color: var(--primary);">${year}년 ${month}월 4대보험 직원 관리</h2>
      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <div class="month-selector">
          <input type="month" value="${selectedMonth}" onchange="changeMonth(this.value)">
        </div>
        ${renderEmploymentViewChips('insurance', viewInfo)}
        <button class="btn btn-primary" onclick="openAddInsuranceTeacherModal()">+ 직원 추가</button>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card primary">
        <div class="summary-label">총 실지급 예정액</div>
        <div class="summary-value">${formatKRW(sumNet)}</div>
        <div class="summary-sub">재직자 ${activeTeachers.length}명 기준</div>
      </div>
      <div class="summary-card accent">
        <div class="summary-label">총 월급여 (세전)</div>
        <div class="summary-value">${formatKRW(sumSalary)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label" style="color: var(--text-light);">총 공제액</div>
        <div class="summary-value" style="color: var(--danger);">${formatKRW(sumDeduction)}</div>
        <div class="summary-sub" style="color: var(--text-light);">4대보험 + 소득세 + 결근공제</div>
      </div>
    </div>

    <div style="margin-bottom: 1.5rem; padding: 0.875rem 1rem; background: var(--bg); border-radius: 10px; font-size: 0.8125rem; color: var(--text-light);">
      현재 적용 요율 (근로자 부담분):
      국민연금 <strong style="color: var(--text);">${formatRatePercent(rates.nationalPension)}</strong> ·
      건강보험 <strong style="color: var(--text);">${formatRatePercent(rates.healthInsurance)}</strong> ·
      장기요양 <strong style="color: var(--text);">건강보험의 ${formatRatePercent(rates.longTermCare)}</strong> ·
      고용보험 <strong style="color: var(--text);">${formatRatePercent(rates.employmentInsurance)}</strong>
      &nbsp;|&nbsp; 요율 변경은 <a href="javascript:void(0)" onclick="switchTab('settings')" style="color: var(--primary); font-weight: 600;">설정 &gt; 4대보험 요율 설정</a>에서 할 수 있습니다.
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">등록된 4대보험 직원 (${filteredTeachers.length}명)</h3>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>주민번호</th>
              <th>소속</th>
              <th>직급</th>
              <th>월급여</th>
              <th>결근일수</th>
              <th>결근공제</th>
              <th>4대보험 공제</th>
              <th>실지급액</th>
              <th>입사일</th>
              <th>퇴사일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTeachers.length > 0 ? (() => {
              let tableSalary = 0, tableAbsence = 0, tableDeduction = 0, tableNet = 0;
              const rows = filteredTeachers.map((teacher, index) => {
              const isTerminated = !!teacher.terminationDate;
              const absentDays = getInsuranceAbsenceDays(teacher.id, selectedMonth);
              const calc = calculateInsurancePayroll(teacher, absentDays);
              const businessName = getBusinessName(teacher.businessId);
              const terminationDateDisplay = teacher.terminationDate || '-';
              tableSalary += calc.monthlySalary;
              tableAbsence += calc.absenceDeduction;
              tableDeduction += calc.totalDeduction;
              tableNet += calc.finalNetPay;

              return `
                ${terminationGroupRowHTML(filteredTeachers, index, 12)}
                <tr class="${isTerminated ? 'row-terminated' : ''}">
                  <td>
                    <strong>${teacher.name}</strong>
                    ${isTerminated ? '<span class="badge badge-terminated">퇴사</span>' : ''}
                  </td>
                  <td style="font-family: monospace; font-size: 0.8125rem;">${teacher.residentId || '-'}</td>
                  <td><span class="badge badge-business">${businessName}</span></td>
                  <td>${teacher.position || '-'}</td>
                  <td>${formatKRW(teacher.monthlySalary)}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value="${absentDays}"
                      class="form-input"
                      style="width: 90px; min-width: 90px;"
                      onchange="updateInsuranceAbsenceDays(${teacher.id}, this.value)"
                    >
                  </td>
                  <td style="color: var(--danger);">-${formatKRW(calc.absenceDeduction)}</td>
                  <td style="color: var(--danger);">-${formatKRW(calc.totalDeduction)}</td>
                  <td><strong style="color: var(--success);">${formatKRW(calc.finalNetPay)}</strong></td>
                  <td style="font-size: 0.8125rem;">${teacher.hireDate || '-'}</td>
                  <td style="font-size: 0.8125rem; color: ${isTerminated ? 'var(--danger)' : 'inherit'};">${terminationDateDisplay}</td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-primary btn-sm" onclick="showInsuranceDetailModal(${teacher.id})">상세</button>
                      <button class="btn btn-accent btn-sm" onclick="generateInsurancePDF(${teacher.id}, '${selectedMonth}')">PDF</button>
                      <button class="btn btn-outline btn-sm" onclick="openEditInsuranceTeacherModal(${teacher.id})">수정</button>
                      <button class="btn btn-danger btn-sm" onclick="confirmDeleteInsuranceTeacher(${teacher.id})">삭제</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('');
              const totalRow = `
                <tr style="border-top: 2px solid var(--border); background: var(--bg); font-weight: 700;">
                  <td colspan="4">합계 (${filteredTeachers.length}명)</td>
                  <td>${formatKRW(tableSalary)}</td>
                  <td></td>
                  <td style="color: var(--danger);">-${formatKRW(tableAbsence)}</td>
                  <td style="color: var(--danger);">-${formatKRW(tableDeduction)}</td>
                  <td style="color: var(--success);">${formatKRW(tableNet)}</td>
                  <td colspan="3"></td>
                </tr>
              `;
              return rows + totalRow;
            })() : '<tr><td colspan="12" class="empty-state">등록된 4대보험 직원이 없습니다.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function updateInsuranceAbsenceDays(teacherId, value) {
  const absentDays = Math.max(0, parseInt(value, 10) || 0);
  setInsuranceAbsenceDays(teacherId, selectedMonth, absentDays);
  renderContent();
  showToast('결근일수가 저장되었습니다.');
}

function openAddInsuranceTeacherModal() {
  document.getElementById('modalTitle').textContent = '4대보험 직원 추가';
  document.getElementById('modalBody').innerHTML = getInsuranceTeacherFormHTML();
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveNewInsuranceTeacher()">저장</button>
  `;
  openModal();
}

function getInsuranceTeacherFormHTML(teacher = null) {
  const defaultBusinessId = teacher?.businessId ||
    (selectedBusiness !== 'all' ? selectedBusiness : appData.businesses[0]?.id);

  const positionOptions = ['원장', '실장', '주임', '일반'];
  const isCustomPosition = teacher?.position && !positionOptions.includes(teacher.position);

  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">이름 *</label>
        <input type="text" id="insTeacherName" class="form-input" value="${teacher?.name || ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">소속 사업장 *</label>
        <select id="insTeacherBusinessId" class="form-select">
          ${appData.businesses.map(b =>
            `<option value="${b.id}" ${defaultBusinessId === b.id ? 'selected' : ''}>${b.name}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">직급</label>
        <select id="insTeacherPosition" class="form-select" onchange="toggleInsuranceCustomPosition(this)">
          <option value="">선택 안함</option>
          ${positionOptions.map(p => `
            <option value="${p}" ${teacher?.position === p ? 'selected' : ''}>${p}</option>
          `).join('')}
          <option value="custom" ${isCustomPosition ? 'selected' : ''}>기타 (직접입력)</option>
        </select>
      </div>
      <div class="form-group" id="insCustomPositionGroup" style="display: ${isCustomPosition ? 'block' : 'none'};">
        <label class="form-label">직급 직접입력</label>
        <input type="text" id="insTeacherPositionCustom" class="form-input" value="${isCustomPosition ? teacher.position : ''}" placeholder="직급 입력">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">월 급여 (세전 총액, 식대 포함) *</label>
        <input type="number" id="insTeacherSalary" class="form-input" value="${teacher?.monthlySalary || 3000000}" min="0" step="10000">
      </div>
      <div class="form-group">
        <label class="form-label">이 중 비과세 (식대 등)</label>
        <input type="number" id="insTeacherNonTaxable" class="form-input" value="${teacher?.nonTaxableAmount || 0}" min="0" step="10000" placeholder="예: 200000">
        <small style="color: var(--text-light); font-size: 0.75rem;">고용보험·소득세는 비과세를 뺀 금액으로 계산합니다</small>
      </div>
    </div>
    <div class="form-section-title">공제 기준 (세무사 명세서와 맞출 때)</div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">국민연금 기준소득월액</label>
        <input type="number" id="insTeacherPensionBase" class="form-input" value="${teacher?.pensionBase || ''}" min="0" step="1000" placeholder="비워두면 과세급여">
      </div>
      <div class="form-group">
        <label class="form-label">건강보험 보수월액</label>
        <input type="number" id="insTeacherHealthBase" class="form-input" value="${teacher?.healthBase || ''}" min="0" step="1000" placeholder="비워두면 과세급여">
      </div>
      <div class="form-group">
        <label class="form-label">공제대상가족 수 (본인 포함)</label>
        <input type="number" id="insTeacherDependents" class="form-input" value="${teacher?.dependents || 1}" min="1" max="11" step="1">
      </div>
    </div>
    <small style="color: var(--text-light); font-size: 0.75rem; display: block; margin-bottom: 1rem;">
      국민연금·건강보험은 공단에 신고된 금액 기준으로 고지되어 사람마다 다를 수 있습니다. 명세서 금액과 다르면 이 칸에 신고 금액을 넣어주세요.
    </small>
    <div class="form-group">
      <label class="form-label">주민등록번호</label>
      <input
        type="text"
        id="insTeacherResidentId"
        class="form-input"
        value="${formatResidentId(teacher?.residentId || '')}"
        placeholder="예: 900101-1234567"
        maxlength="14"
      >
      <small style="color: var(--text-light);">세무 처리용으로만 사용됩니다.</small>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">입사일</label>
        <input type="date" id="insTeacherHireDate" class="form-input" value="${teacher?.hireDate || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">퇴사일</label>
        <input type="date" id="insTeacherTermDate" class="form-input" value="${teacher?.terminationDate || ''}">
      </div>
    </div>

    ${(() => {
      const rates = getActiveInsuranceRates();
      return `
    <div style="background: var(--bg); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
      <strong>4대보험 공제 안내 (근로자 부담분, 현재 적용 요율)</strong>
      <p style="font-size: 0.875rem; color: var(--text-light); margin-top: 0.5rem;">
        • 국민연금: ${formatRatePercent(rates.nationalPension)}<br>
        • 건강보험: ${formatRatePercent(rates.healthInsurance)}<br>
        • 장기요양: 건강보험의 ${formatRatePercent(rates.longTermCare)}<br>
        • 고용보험: ${formatRatePercent(rates.employmentInsurance)}<br>
        요율 변경은 설정 &gt; 4대보험 요율 설정에서 할 수 있습니다.
      </p>
    </div>
      `;
    })()}
  `;
}

function toggleInsuranceCustomPosition(select) {
  const customGroup = document.getElementById('insCustomPositionGroup');
  customGroup.style.display = select.value === 'custom' ? 'block' : 'none';
}

// 공제 기준 입력값 (비과세·기준소득월액·보수월액·가족 수)
function readInsuranceDeductionBasisFields() {
  const num = id => Math.max(0, parseInt(document.getElementById(id).value, 10) || 0);
  return {
    nonTaxableAmount: num('insTeacherNonTaxable'),
    pensionBase: num('insTeacherPensionBase') || null,
    healthBase: num('insTeacherHealthBase') || null,
    dependents: Math.max(1, num('insTeacherDependents'))
  };
}

function getInsurancePositionValue() {
  const select = document.getElementById('insTeacherPosition');
  if (select.value === 'custom') {
    return document.getElementById('insTeacherPositionCustom').value.trim() || null;
  }
  return select.value || null;
}

function saveNewInsuranceTeacher() {
  const name = document.getElementById('insTeacherName').value.trim();
  if (!name) {
    alert('이름을 입력해주세요.');
    return;
  }

  const hireDate = document.getElementById('insTeacherHireDate').value || null;
  const terminationDate = document.getElementById('insTeacherTermDate').value || null;
  const residentId = formatResidentId(document.getElementById('insTeacherResidentId').value.trim());

  if (hireDate && terminationDate && terminationDate < hireDate) {
    alert('퇴사일은 입사일 이후여야 합니다.');
    return;
  }

  if (residentId && !/^\d{6}-\d{7}$/.test(residentId)) {
    alert('주민등록번호 형식을 확인해주세요. 예: 900101-1234567');
    return;
  }

  addInsuranceTeacher({
    name,
    businessId: parseInt(document.getElementById('insTeacherBusinessId').value),
    monthlySalary: parseInt(document.getElementById('insTeacherSalary').value) || 0,
    ...readInsuranceDeductionBasisFields(),
    residentId,
    hireDate,
    terminationDate,
    position: getInsurancePositionValue()
  });

  closeModal();
  renderContent();
  showToast('4대보험 직원이 추가되었습니다.');
}

function openEditInsuranceTeacherModal(id) {
  const teacher = getInsuranceTeacherById(id);
  document.getElementById('modalTitle').textContent = '4대보험 직원 수정';
  document.getElementById('modalBody').innerHTML = getInsuranceTeacherFormHTML(teacher);
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveEditInsuranceTeacher(${id})">저장</button>
  `;
  openModal();
}

function saveEditInsuranceTeacher(id) {
  const name = document.getElementById('insTeacherName').value.trim();
  if (!name) {
    alert('이름을 입력해주세요.');
    return;
  }

  const hireDate = document.getElementById('insTeacherHireDate').value || null;
  const terminationDate = document.getElementById('insTeacherTermDate').value || null;
  const residentId = formatResidentId(document.getElementById('insTeacherResidentId').value.trim());

  if (hireDate && terminationDate && terminationDate < hireDate) {
    alert('퇴사일은 입사일 이후여야 합니다.');
    return;
  }

  if (residentId && !/^\d{6}-\d{7}$/.test(residentId)) {
    alert('주민등록번호 형식을 확인해주세요. 예: 900101-1234567');
    return;
  }

  updateInsuranceTeacher(id, {
    name,
    businessId: parseInt(document.getElementById('insTeacherBusinessId').value),
    monthlySalary: parseInt(document.getElementById('insTeacherSalary').value) || 0,
    ...readInsuranceDeductionBasisFields(),
    residentId,
    hireDate,
    terminationDate,
    position: getInsurancePositionValue()
  });

  closeModal();
  renderContent();
  showToast('4대보험 직원 정보가 수정되었습니다.');
}

function showInsuranceDetailModal(id) {
  const teacher = getInsuranceTeacherById(id);
  const absentDays = getInsuranceAbsenceDays(id, selectedMonth);
  const calc = calculateInsurancePayroll(teacher, absentDays);

  document.getElementById('modalTitle').textContent = `${teacher.name} 4대보험 상세`;
  document.getElementById('modalBody').innerHTML = `
    <div class="summary-grid" style="margin-bottom: 1rem;">
      <div class="summary-card">
        <div class="summary-label" style="color: var(--text-light);">월 급여 (세전)</div>
        <div class="summary-value" style="font-size: 1.25rem;">${formatKRW(calc.monthlySalary)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label" style="color: var(--text-light);">결근 공제</div>
        <div class="summary-value" style="font-size: 1.25rem; color: var(--danger);">-${formatKRW(calc.absenceDeduction)}</div>
        <div class="summary-sub">${calc.absentDays}일 x ${formatKRW(calc.dailyDeduction)}</div>
      </div>
      <div class="summary-card primary">
        <div class="summary-label">실지급액</div>
        <div class="summary-value" style="font-size: 1.25rem;">${formatKRW(calc.finalNetPay)}</div>
      </div>
    </div>

    <div style="margin-bottom: 1rem; padding: 1rem; background: var(--bg); border-radius: 8px;">
      <strong>${selectedMonth} 결근 정보</strong>
      <div style="margin-top: 0.5rem; color: var(--text-light);">결근 ${calc.absentDays}일, 1일 공제액 ${formatKRW(calc.dailyDeduction)}</div>
      <div style="margin-top: 0.25rem; color: var(--text-light);">주민등록번호: ${teacher.residentId || '-'}</div>
      <div style="margin-top: 0.25rem; color: var(--text-light);">과세급여 ${formatKRW(calc.taxableSalary)} (비과세 ${formatKRW(calc.nonTaxableAmount)} 제외)</div>
    </div>

    <h4 style="margin-bottom: 0.75rem; color: var(--primary);">4대보험 공제 내역</h4>
    <table style="width: 100%;">
      <tbody>
        <tr>
          <td style="padding: 0.5rem 0;">결근 공제</td>
          <td style="padding: 0.5rem 0; color: var(--text-light); font-size: 0.875rem;">${calc.absentDays}일</td>
          <td style="padding: 0.5rem 0; text-align: right; color: var(--danger);">-${formatKRW(calc.absenceDeduction)}</td>
        </tr>
        ${calc.breakdown.map(item => `
          <tr>
            <td style="padding: 0.5rem 0;">${item.name}</td>
            <td style="padding: 0.5rem 0; color: var(--text-light); font-size: 0.875rem;">${item.rate}</td>
            <td style="padding: 0.5rem 0; text-align: right; color: var(--danger);">-${formatKRW(item.amount)}</td>
          </tr>
        `).join('')}
        <tr style="border-top: 2px solid var(--border); font-weight: 700;">
          <td style="padding: 0.75rem 0;" colspan="2">총 공제액</td>
          <td style="padding: 0.75rem 0; text-align: right; color: var(--danger);">-${formatKRW(calc.totalDeduction + calc.absenceDeduction)}</td>
        </tr>
      </tbody>
    </table>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">닫기</button>
  `;
  openModal();
}

function confirmDeleteInsuranceTeacher(id) {
  const teacher = getInsuranceTeacherById(id);
  if (confirm(`${teacher.name}님을 삭제하시겠습니까?`)) {
    deleteInsuranceTeacher(id);
    renderContent();
    showToast('4대보험 직원이 삭제되었습니다.');
  }
}

// ============ 특강 관리 ============
let selectedSpecialLecture = null;

function renderSpecialLectures(container) {
  const { year, month } = parseMonthKey(selectedMonth);
  const filteredLectures = getSpecialLecturesByBusiness(selectedBusiness);

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--primary);">특강 관리</h2>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <div class="month-selector">
          <input type="month" value="${selectedMonth}" onchange="changeMonth(this.value)">
        </div>
        <button class="btn btn-primary" onclick="openAddSpecialLectureModal()">+ 특강 추가</button>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">등록된 특강 (${filteredLectures.length}개)</h3>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>특강명</th>
              <th>과목</th>
              <th>강사</th>
              <th>비율</th>
              <th>기간</th>
              <th>${month}월 학생수</th>
              <th>${month}월 수강료</th>
              <th>${month}월 예상지급액</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${filteredLectures.length > 0 ? filteredLectures.map(lecture => {
              const students = getSpecialLectureStudents(lecture.id, selectedMonth);
              const calc = students.length > 0 ? calculateSpecialLecture(lecture, students, appData.settings) : null;
              const businessName = getBusinessName(lecture.businessId);
              const period = lecture.startDate && lecture.endDate
                ? `${lecture.startDate} ~ ${lecture.endDate}`
                : '-';

              return `
                <tr>
                  <td>
                    <strong>${lecture.name}</strong>
                    <br><span class="badge badge-business" style="font-size: 0.7rem;">${businessName}</span>
                  </td>
                  <td><span class="badge badge-special">${lecture.subject}</span></td>
                  <td>${lecture.instructorName}</td>
                  <td>
                    <span class="badge badge-part">${formatPercent(lecture.commissionRate)}</span>
                    ${lecture.excludeInstructorTax ? '<br><span style="font-size: 0.75rem; color: var(--text-light);">3.3 제외</span>' : ''}
                  </td>
                  <td style="font-size: 0.8125rem;">${period}</td>
                  <td>${students.length}명</td>
                  <td>${calc ? formatKRW(calc.totalTuition) : '-'}</td>
                  <td><strong style="color: var(--success);">${calc ? formatKRW(calc.netPay) : '-'}</strong></td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-accent btn-sm" onclick="openSpecialLectureStudentManagement(${lecture.id})">학생관리</button>
                      <button class="btn btn-primary btn-sm" onclick="generateSpecialLecturePDF(${lecture.id}, '${selectedMonth}')">PDF</button>
                      <button class="btn btn-outline btn-sm" onclick="openEditSpecialLectureModal(${lecture.id})">수정</button>
                      <button class="btn btn-danger btn-sm" onclick="confirmDeleteSpecialLecture(${lecture.id})">삭제</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('') : '<tr><td colspan="9" class="empty-state">등록된 특강이 없습니다.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>

    <div id="specialLectureStudentSection"></div>
  `;
}

function openAddSpecialLectureModal() {
  document.getElementById('modalTitle').textContent = '특강 추가';
  document.getElementById('modalBody').innerHTML = getSpecialLectureFormHTML();
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveNewSpecialLecture()">저장</button>
  `;
  openModal();
}

function getSpecialLectureFormHTML(lecture = null) {
  const defaultBusinessId = lecture?.businessId ||
    (selectedBusiness !== 'all' ? selectedBusiness : appData.businesses[0]?.id);

  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">특강명 *</label>
        <input type="text" id="specialLectureName" class="form-input" value="${lecture?.name || ''}" placeholder="예: 겨울특강 수학">
      </div>
      <div class="form-group">
        <label class="form-label">과목 *</label>
        <input type="text" id="specialLectureSubject" class="form-input" value="${lecture?.subject || ''}" placeholder="예: 수학, 영어">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">강사 이름 *</label>
        <input type="text" id="specialLectureInstructor" class="form-input" value="${lecture?.instructorName || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">강사 비율 (%) *</label>
        <input type="number" id="specialLectureRate" class="form-input" value="${lecture ? lecture.commissionRate * 100 : 50}" min="1" max="100" step="1">
        <small style="color: var(--text-light);">동일 강사도 과목별로 다른 비율 적용 가능</small>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">소속 사업장 *</label>
        <select id="specialLectureBusinessId" class="form-select">
          ${appData.businesses.map(b =>
            `<option value="${b.id}" ${defaultBusinessId === b.id ? 'selected' : ''}>${b.name}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">기본 수강료 (1인)</label>
        <input type="number" id="specialLectureTuition" class="form-input" value="${lecture?.tuitionPerStudent || 0}" min="0" step="10000">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">시작일</label>
        <input type="date" id="specialLectureStartDate" class="form-input" value="${lecture?.startDate || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">종료일</label>
        <input type="date" id="specialLectureEndDate" class="form-input" value="${lecture?.endDate || ''}">
      </div>
    </div>
    <div class="form-group">
      <label class="checkbox-label" style="display: flex; gap: 0.5rem; align-items: center;">
        <input type="checkbox" id="specialLectureExcludeTax" ${lecture?.excludeInstructorTax ? 'checked' : ''}>
        <span>사업소득세 3.3% 제외</span>
      </label>
    </div>

    <div style="background: var(--bg); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
      <strong>공제 안내</strong>
      <p style="font-size: 0.875rem; color: var(--text-light); margin-top: 0.5rem;">
        • 카드수수료 1% (전체 수강료에서 먼저 공제)<br>
        • 사업소득세 3.3% (강사 몫에서 공제, 제외 체크 시 미적용)
      </p>
    </div>
  `;
}

function saveNewSpecialLecture() {
  const name = document.getElementById('specialLectureName').value.trim();
  const subject = document.getElementById('specialLectureSubject').value.trim();
  const instructorName = document.getElementById('specialLectureInstructor').value.trim();

  if (!name || !subject || !instructorName) {
    alert('특강명, 과목, 강사 이름을 입력해주세요.');
    return;
  }

  addSpecialLecture({
    name,
    subject,
    instructorName,
    commissionRate: parseFloat(document.getElementById('specialLectureRate').value) / 100,
    businessId: parseInt(document.getElementById('specialLectureBusinessId').value),
    excludeInstructorTax: document.getElementById('specialLectureExcludeTax').checked,
    tuitionPerStudent: parseInt(document.getElementById('specialLectureTuition').value) || 0,
    startDate: document.getElementById('specialLectureStartDate').value || null,
    endDate: document.getElementById('specialLectureEndDate').value || null
  });

  closeModal();
  renderContent();
  showToast('특강이 추가되었습니다.');
}

function openEditSpecialLectureModal(id) {
  const lecture = getSpecialLectureById(id);
  document.getElementById('modalTitle').textContent = '특강 수정';
  document.getElementById('modalBody').innerHTML = getSpecialLectureFormHTML(lecture);
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveEditSpecialLecture(${id})">저장</button>
  `;
  openModal();
}

function saveEditSpecialLecture(id) {
  const name = document.getElementById('specialLectureName').value.trim();
  const subject = document.getElementById('specialLectureSubject').value.trim();
  const instructorName = document.getElementById('specialLectureInstructor').value.trim();

  if (!name || !subject || !instructorName) {
    alert('특강명, 과목, 강사 이름을 입력해주세요.');
    return;
  }

  updateSpecialLecture(id, {
    name,
    subject,
    instructorName,
    commissionRate: parseFloat(document.getElementById('specialLectureRate').value) / 100,
    businessId: parseInt(document.getElementById('specialLectureBusinessId').value),
    excludeInstructorTax: document.getElementById('specialLectureExcludeTax').checked,
    tuitionPerStudent: parseInt(document.getElementById('specialLectureTuition').value) || 0,
    startDate: document.getElementById('specialLectureStartDate').value || null,
    endDate: document.getElementById('specialLectureEndDate').value || null
  });

  closeModal();
  renderContent();
  showToast('특강 정보가 수정되었습니다.');
}

function confirmDeleteSpecialLecture(id) {
  const lecture = getSpecialLectureById(id);
  if (confirm(`${lecture.name} 특강을 삭제하시겠습니까? 관련 학생 데이터도 함께 삭제됩니다.`)) {
    deleteSpecialLecture(id);
    renderContent();
    showToast('특강이 삭제되었습니다.');
  }
}

// ============ 특강 학생 관리 ============
function openSpecialLectureStudentManagement(lectureId) {
  selectedSpecialLecture = lectureId;
  const lecture = getSpecialLectureById(lectureId);
  const students = getSpecialLectureStudents(lectureId, selectedMonth);
  const { year, month } = parseMonthKey(selectedMonth);
  const calc = students.length > 0 ? calculateSpecialLecture(lecture, students, appData.settings) : null;

  const html = `
    <div class="card" style="margin-top: 1.5rem;">
      <div class="card-header">
        <h3 class="card-title">${lecture.name} (${lecture.subject}) - ${month}월 학생 관리</h3>
        <div style="display: flex; gap: 0.5rem;">
          <label class="btn btn-success btn-sm" style="cursor: pointer;">
            Excel 업로드
            <input type="file" accept=".xlsx,.xls,.csv,.txt" style="display: none;" onchange="handleSpecialLectureExcelUpload(this, ${lectureId})">
          </label>
          <button class="btn btn-primary btn-sm" onclick="openAddSpecialLectureStudentModal(${lectureId})">+ 학생 추가</button>
        </div>
      </div>

      <!-- 텍스트 붙여넣기 입력 -->
      <div style="background: var(--bg); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
        <label style="font-size: 0.875rem; font-weight: 600; display: block; margin-bottom: 0.5rem;">📋 텍스트 붙여넣기</label>
        <textarea id="pasteStudentText_${lectureId}" class="form-input" rows="4" placeholder="이름    금액
최효준    280000
장근혁    350000
이유찬    250000" style="width: 100%; font-family: monospace; font-size: 0.875rem;"></textarea>
        <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem; align-items: center;">
          <button class="btn btn-primary" onclick="addStudentsFromText(${lectureId})">텍스트로 추가</button>
          <span style="font-size: 0.75rem; color: var(--text-light);">형식: 이름(탭 또는 공백)금액 - 한 줄에 한 명</span>
        </div>
      </div>

      <!-- 학생 수 빠른 입력 -->
      <div style="background: var(--bg); padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
        <div style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 150px;">
            <label style="font-size: 0.875rem; font-weight: 600; display: block; margin-bottom: 0.25rem;">학생 수 빠른 등록</label>
            <input type="number" id="quickStudentCount_${lectureId}" class="form-input" placeholder="예: 10" min="1" max="100" style="width: 100%;">
          </div>
          <div style="flex: 1; min-width: 150px;">
            <label style="font-size: 0.875rem; font-weight: 600; display: block; margin-bottom: 0.25rem;">1인당 수강료</label>
            <input type="number" id="quickStudentTuition_${lectureId}" class="form-input" value="${lecture.tuitionPerStudent || 0}" min="0" step="10000" style="width: 100%;">
          </div>
          <button class="btn btn-accent" onclick="addQuickStudents(${lectureId})">추가</button>
        </div>
        <p style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.5rem;">
          학생 수만 입력하면 "학생1, 학생2..." 형태로 자동 등록됩니다.
        </p>
      </div>

      ${calc ? `
        <div class="summary-grid" style="margin-bottom: 1rem;">
          <div class="summary-card">
            <div class="summary-label" style="color: var(--text-light);">총 수강료</div>
            <div class="summary-value" style="font-size: 1.25rem;">${formatKRW(calc.totalTuition)}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label" style="color: var(--text-light);">강사: ${lecture.instructorName}</div>
            <div class="summary-value" style="font-size: 1.25rem;">${formatPercent(lecture.commissionRate)}</div>
          </div>
          <div class="summary-card primary">
            <div class="summary-label">강사 실지급액</div>
            <div class="summary-value" style="font-size: 1.25rem;">${formatKRW(calc.netPay)}</div>
          </div>
        </div>
      ` : ''}

      ${students.length > 0 ? `
      <div style="margin-bottom: 0.5rem; display: flex; gap: 0.5rem; align-items: center;">
        <button class="btn btn-danger btn-sm" onclick="deleteSelectedSpecialLectureStudents(${lectureId})">선택 삭제</button>
        <span id="selectedSpecialCount_${lectureId}" style="font-size: 0.8125rem; color: var(--text-light);">0명 선택</span>
      </div>
      ` : ''}

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th style="width: 40px;"><input type="checkbox" id="selectAllSpecial_${lectureId}" onchange="toggleAllSpecialLectureStudents(${lectureId})"></th>
              <th>학생명</th>
              <th>수강료</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${students.length > 0 ? students.map(student => `
              <tr>
                <td><input type="checkbox" class="special-student-checkbox-${lectureId}" data-student-id="${student.id}" onchange="updateSpecialSelectedCount(${lectureId})"></td>
                <td>${student.name}</td>
                <td>${formatKRW(student.tuition)}</td>
                <td>
                  <div class="actions">
                    <button class="btn btn-outline btn-sm" onclick="openEditSpecialLectureStudentModal(${lectureId}, ${student.id})">수정</button>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteSpecialLectureStudent(${lectureId}, ${student.id})">삭제</button>
                  </div>
                </td>
              </tr>
            `).join('') : '<tr><td colspan="4" class="empty-state">등록된 학생이 없습니다.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById('specialLectureStudentSection').innerHTML = html;
}

// 학생 수 빠른 등록
function addQuickStudents(lectureId) {
  const countInput = document.getElementById(`quickStudentCount_${lectureId}`);
  const tuitionInput = document.getElementById(`quickStudentTuition_${lectureId}`);

  const count = parseInt(countInput.value) || 0;
  const tuition = parseInt(tuitionInput.value) || 0;

  if (count <= 0) {
    alert('학생 수를 입력해주세요.');
    return;
  }

  if (tuition <= 0) {
    alert('1인당 수강료를 입력해주세요.');
    return;
  }

  const existingStudents = getSpecialLectureStudents(lectureId, selectedMonth);
  const nextId = existingStudents.length > 0
    ? Math.max(...existingStudents.map(s => s.id || 0)) + 1
    : 1;

  const newStudents = [];
  for (let i = 0; i < count; i++) {
    newStudents.push({
      id: nextId + i,
      name: `학생${existingStudents.length + i + 1}`,
      tuition: tuition
    });
  }

  const allStudents = [...existingStudents, ...newStudents];
  setSpecialLectureStudents(lectureId, selectedMonth, allStudents);

  countInput.value = '';
  renderContent();
  openSpecialLectureStudentManagement(lectureId);
  showToast(`${count}명의 학생이 추가되었습니다. (총 ${formatKRW(count * tuition)})`);
}

// 텍스트 붙여넣기로 학생 추가
function addStudentsFromText(lectureId) {
  const textarea = document.getElementById(`pasteStudentText_${lectureId}`);
  const text = textarea.value.trim();

  if (!text) {
    alert('텍스트를 입력해주세요.');
    return;
  }

  const lines = text.split(/\r?\n/).filter(l => l.trim());
  const students = [];

  for (const line of lines) {
    // 탭, 여러 공백, 쉼표로 분리
    const parts = line.trim().split(/[\t,]+|\s{2,}/);

    if (parts.length === 0) continue;

    // 첫 부분이 이름
    let name = parts[0].trim();

    // 이름에서 숫자만 있는 부분 제거 (금액이 붙어있는 경우 처리)
    // 예: "최효준    280,000" 또는 "최효준280000"

    // 금액 찾기: 마지막 숫자 패턴
    let tuition = 0;

    // 나머지 부분에서 숫자 찾기
    for (let i = 1; i < parts.length; i++) {
      const numStr = parts[i].replace(/[^\d]/g, '');
      if (numStr) {
        tuition = parseInt(numStr) || 0;
        break;
      }
    }

    // 이름과 금액이 공백 하나로만 구분된 경우 처리
    if (tuition === 0) {
      const match = line.match(/^(.+?)\s+([\d,]+)\s*$/);
      if (match) {
        name = match[1].trim();
        tuition = parseInt(match[2].replace(/[^\d]/g, '')) || 0;
      }
    }

    if (!name || name.match(/^(이름|학생|성명|번호)$/)) continue;

    students.push({ name, tuition });
  }

  if (students.length === 0) {
    alert('유효한 학생 데이터가 없습니다.\n\n형식 예시:\n최효준    280000\n장근혁    350000');
    return;
  }

  const existingStudents = getSpecialLectureStudents(lectureId, selectedMonth);
  const nextId = existingStudents.length > 0
    ? Math.max(...existingStudents.map(s => s.id || 0)) + 1
    : 1;

  const newStudents = students.map((s, i) => ({
    id: nextId + i,
    name: s.name,
    tuition: s.tuition
  }));

  const totalTuition = newStudents.reduce((sum, s) => sum + s.tuition, 0);
  const allStudents = [...existingStudents, ...newStudents];
  setSpecialLectureStudents(lectureId, selectedMonth, allStudents);

  textarea.value = '';
  renderContent();
  openSpecialLectureStudentManagement(lectureId);
  showToast(`${newStudents.length}명 추가 완료! (총 ${formatKRW(totalTuition)})`);
}

function openAddSpecialLectureStudentModal(lectureId) {
  const lecture = getSpecialLectureById(lectureId);

  document.getElementById('modalTitle').textContent = '학생 추가';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label class="form-label">학생명 *</label>
      <input type="text" id="slStudentName" class="form-input" placeholder="학생 이름">
    </div>
    <div class="form-group">
      <label class="form-label">수강료 *</label>
      <input type="number" id="slStudentTuition" class="form-input" value="${lecture.tuitionPerStudent || 0}" min="0" step="10000">
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveNewSpecialLectureStudent(${lectureId})">저장</button>
  `;
  openModal();
}

function saveNewSpecialLectureStudent(lectureId) {
  const name = document.getElementById('slStudentName').value.trim();
  const tuition = parseInt(document.getElementById('slStudentTuition').value) || 0;

  if (!name) {
    alert('학생명을 입력해주세요.');
    return;
  }

  addSpecialLectureStudent(lectureId, selectedMonth, { name, tuition });
  closeModal();
  renderContent();
  openSpecialLectureStudentManagement(lectureId);
  showToast('학생이 추가되었습니다.');
}

function openEditSpecialLectureStudentModal(lectureId, studentId) {
  const students = getSpecialLectureStudents(lectureId, selectedMonth);
  const student = students.find(s => s.id === studentId);

  document.getElementById('modalTitle').textContent = '학생 수정';
  document.getElementById('modalBody').innerHTML = `
    <div class="form-group">
      <label class="form-label">학생명 *</label>
      <input type="text" id="slStudentName" class="form-input" value="${student.name}">
    </div>
    <div class="form-group">
      <label class="form-label">수강료 *</label>
      <input type="number" id="slStudentTuition" class="form-input" value="${student.tuition}" min="0" step="10000">
    </div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">취소</button>
    <button class="btn btn-primary" onclick="saveEditSpecialLectureStudent(${lectureId}, ${studentId})">저장</button>
  `;
  openModal();
}

function saveEditSpecialLectureStudent(lectureId, studentId) {
  const name = document.getElementById('slStudentName').value.trim();
  const tuition = parseInt(document.getElementById('slStudentTuition').value) || 0;

  if (!name) {
    alert('학생명을 입력해주세요.');
    return;
  }

  updateSpecialLectureStudent(lectureId, selectedMonth, studentId, { name, tuition });
  closeModal();
  renderContent();
  openSpecialLectureStudentManagement(lectureId);
  showToast('학생 정보가 수정되었습니다.');
}

function confirmDeleteSpecialLectureStudent(lectureId, studentId) {
  if (confirm('이 학생을 삭제하시겠습니까?')) {
    deleteSpecialLectureStudent(lectureId, selectedMonth, studentId);
    renderContent();
    openSpecialLectureStudentManagement(lectureId);
    showToast('학생이 삭제되었습니다.');
  }
}

// 특강 - 체크박스 전체 선택/해제
function toggleAllSpecialLectureStudents(lectureId) {
  const selectAll = document.getElementById(`selectAllSpecial_${lectureId}`);
  const checkboxes = document.querySelectorAll(`.special-student-checkbox-${lectureId}`);
  checkboxes.forEach(cb => cb.checked = selectAll.checked);
  updateSpecialSelectedCount(lectureId);
}

// 특강 - 선택된 학생 수 업데이트
function updateSpecialSelectedCount(lectureId) {
  const checkboxes = document.querySelectorAll(`.special-student-checkbox-${lectureId}:checked`);
  const countSpan = document.getElementById(`selectedSpecialCount_${lectureId}`);
  if (countSpan) {
    countSpan.textContent = `${checkboxes.length}명 선택`;
  }
  // 전체 선택 체크박스 상태 업데이트
  const allCheckboxes = document.querySelectorAll(`.special-student-checkbox-${lectureId}`);
  const selectAll = document.getElementById(`selectAllSpecial_${lectureId}`);
  if (selectAll) {
    selectAll.checked = allCheckboxes.length > 0 && checkboxes.length === allCheckboxes.length;
  }
}

// 특강 - 선택된 학생 삭제
function deleteSelectedSpecialLectureStudents(lectureId) {
  const checkboxes = document.querySelectorAll(`.special-student-checkbox-${lectureId}:checked`);
  if (checkboxes.length === 0) {
    alert('삭제할 학생을 선택해주세요.');
    return;
  }

  if (!confirm(`선택한 ${checkboxes.length}명의 학생을 삭제하시겠습니까?`)) {
    return;
  }

  const studentIds = Array.from(checkboxes).map(cb => parseInt(cb.dataset.studentId));
  const students = getSpecialLectureStudents(lectureId, selectedMonth);
  const remaining = students.filter(s => !studentIds.includes(s.id));
  setSpecialLectureStudents(lectureId, selectedMonth, remaining);
  renderContent();
  openSpecialLectureStudentManagement(lectureId);
  showToast(`${checkboxes.length}명의 학생이 삭제되었습니다.`);
}

function handleSpecialLectureExcelUpload(input, lectureId) {
  if (input.files.length > 0) {
    const file = input.files[0];
    const fileName = file.name.toLowerCase();
    console.log('[v8] 파일 업로드:', fileName, file.size, 'bytes');

    // XLSX 라이브러리 확인
    if (typeof XLSX === 'undefined') {
      alert('엑셀 라이브러리가 로드되지 않았습니다.\n\nCtrl+Shift+R을 눌러 페이지를 새로고침해주세요.');
      return;
    }

    const lecture = getSpecialLectureById(lectureId);
    const defaultTuition = lecture.tuitionPerStudent || 0;
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

    console.log('[v8] 엑셀파일 여부:', isExcel, '기본수강료:', defaultTuition);

    if (isExcel) {
      // 엑셀 파일 직접 처리
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          console.log('[v8] FileReader 완료');
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          console.log('[v8] 파싱된 행 수:', jsonData.length, jsonData.slice(0, 3));

          // 학생 데이터 추출
          const students = [];
          const firstRow = jsonData[0] || [];
          const hasHeader = String(firstRow[0] || '').match(/학생|이름|성명|번호|수강/);
          const startIdx = hasHeader ? 1 : 0;

          for (let i = startIdx; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            const name = String(row[0] || '').trim();
            if (!name) continue;

            let tuition = 0;
            if (row.length >= 2 && row[1] != null && row[1] !== '') {
              tuition = parseInt(String(row[1]).replace(/[^\d]/g, '')) || 0;
            }
            if (tuition === 0) tuition = defaultTuition;

            students.push({ name, tuition });
          }

          console.log('[v8] 추출된 학생:', students.length, students.slice(0, 3));
          processStudents(students, lectureId);
        } catch (err) {
          console.error('[v8] 파싱 오류:', err);
          alert('엑셀 파일 읽기 실패: ' + err.message);
        }
      };
      reader.onerror = () => alert('파일 읽기 실패');
      reader.readAsArrayBuffer(file);
    } else {
      // CSV/TXT 파일 처리
      const reader = new FileReader();
      reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        const students = [];

        for (const line of lines) {
          const parts = line.split(/[,\t]/);
          const name = (parts[0] || '').trim();
          if (!name || name.match(/학생|이름|성명/)) continue;

          let tuition = parseInt((parts[1] || '').replace(/[^\d]/g, '')) || defaultTuition;
          students.push({ name, tuition });
        }

        console.log('[v8] CSV 학생:', students.length);
        processStudents(students, lectureId);
      };
      reader.readAsText(file, 'UTF-8');
    }
  }

  function processStudents(students, lectureId) {
    if (students.length === 0) {
      alert('유효한 학생 데이터가 없습니다.\n\n형식:\n- 첫 번째 열: 학생 이름\n- 두 번째 열(선택): 수강료');
      return;
    }

    const existingStudents = getSpecialLectureStudents(lectureId, selectedMonth);
    const nextId = existingStudents.length > 0
      ? Math.max(...existingStudents.map(s => s.id || 0)) + 1
      : 1;

    const newStudents = students.map((s, i) => ({
      id: nextId + i,
      name: s.name,
      tuition: s.tuition
    }));

    const allStudents = [...existingStudents, ...newStudents];
    setSpecialLectureStudents(lectureId, selectedMonth, allStudents);

    renderContent();
    openSpecialLectureStudentManagement(lectureId);
    showToast(`${newStudents.length}명의 학생이 추가되었습니다.`);
  }
  input.value = '';
}

// ============ 모달 ============
function openModal() {
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

// ============ 직원 비밀번호 변경 ============
function renderChangePassword(container) {
  const staff = currentUser.staff;

  container.innerHTML = `
    <div class="card" style="max-width: 400px; margin: 2rem auto;">
      <h2 style="text-align: center; margin-bottom: 0.5rem; color: var(--primary);">급여 계좌</h2>
      <p style="font-size: 0.8rem; color: var(--text-light); margin-bottom: 1.5rem; text-align: center;">
        급여를 받을 본인 계좌를 입력해주세요.
      </p>
      ${getBankAccountFieldsHTML('my', staff)}
      <button class="btn btn-primary" style="width: 100%;" onclick="saveMyBankAccount()">계좌 저장</button>
    </div>

    <div class="card" style="max-width: 400px; margin: 2rem auto;">
      <h2 style="text-align: center; margin-bottom: 1.5rem; color: var(--primary);">비밀번호 변경</h2>

      <div class="form-group">
        <label class="form-label">현재 비밀번호</label>
        <input type="password" id="currentPassword" class="form-input" placeholder="현재 비밀번호 입력">
      </div>

      <div class="form-group">
        <label class="form-label">새 비밀번호</label>
        <input type="password" id="newPassword" class="form-input" placeholder="새 비밀번호 입력 (4자리 이상)">
      </div>

      <div class="form-group">
        <label class="form-label">새 비밀번호 확인</label>
        <input type="password" id="confirmPassword" class="form-input" placeholder="새 비밀번호 다시 입력" onkeypress="if(event.key==='Enter') changeStaffPassword()">
      </div>

      <button class="btn btn-primary" style="width: 100%;" onclick="changeStaffPassword()">비밀번호 변경</button>

      <p style="font-size: 0.8rem; color: var(--text-light); margin-top: 1rem; text-align: center;">
        비밀번호는 4자리 이상으로 설정해주세요.
      </p>
    </div>
  `;
}

// 직원 본인 급여 계좌 저장
function saveMyBankAccount() {
  const staff = currentUser.staff;
  const bankAccount = readBankAccountFields('my', staff.name);
  if (!bankAccount.bankName || !bankAccount.accountNumber) {
    alert('은행과 계좌번호를 입력해주세요.');
    return;
  }
  const bankAccountError = validateBankAccount(bankAccount);
  if (bankAccountError) {
    alert(bankAccountError);
    return;
  }

  updateStaff(staff.id, bankAccount);
  currentUser.staff = getStaffById(staff.id);
  renderContent();
  showToast('급여 계좌가 저장되었습니다.');
}

// 관리자용: 직원 비밀번호 초기화
function resetStaffPassword(staffId) {
  const staff = getStaffById(staffId);
  if (!staff) return;

  if (confirm(`${staff.name}님의 비밀번호를 0000으로 초기화하시겠습니까?`)) {
    const user = getUserByStaffId(staffId);
    if (user) {
      updateUserPassword(user.userId, '0000');
      appData.users[user.userId].mustChangePassword = true;
      saveData(appData);
    } else {
      staff.password = '0000';
      saveData(appData);
    }
    showToast(`${staff.name}님의 비밀번호가 0000으로 초기화되었습니다. 로그인 ID: ${staff.loginId || '관리자 확인 필요'}`);
  }
}

function changeStaffPassword() {
  const staff = currentUser.staff;
  const user = getUserByStaffId(staff.id);
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // 현재 비밀번호 확인
  if ((user?.password || staff.password) !== currentPassword) {
    alert('현재 비밀번호가 일치하지 않습니다.');
    return;
  }

  // 새 비밀번호 유효성 검사
  if (newPassword.length < 4) {
    alert('새 비밀번호는 4자리 이상이어야 합니다.');
    return;
  }

  // 새 비밀번호 확인
  if (newPassword !== confirmPassword) {
    alert('새 비밀번호가 일치하지 않습니다.');
    return;
  }

  // 비밀번호 변경
  if (user) {
    updateUserPassword(user.userId, newPassword);
  } else {
    const staffData = getStaffById(staff.id);
    staffData.password = newPassword;
    saveData(appData);
  }

  // 현재 세션의 staff 객체도 업데이트
  currentUser.staff.password = newPassword;

  // 입력 필드 초기화
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';

  showToast('비밀번호가 변경되었습니다!');
}

// ============ 초기화 ============
document.addEventListener('DOMContentLoaded', function () {
  // 모달 외부 클릭시 닫기 - 비활성화 (실수로 닫히는 것 방지)
  // document.getElementById('modalOverlay').addEventListener('click', (e) => {
  //   if (e.target === e.currentTarget) closeModal();
  // });

  // 직원 선택 목록 초기화
  populateStaffSelect();
  updateBranding();
});
