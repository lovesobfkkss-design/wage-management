/* ============================================
   강한영어수학학원 급여관리시스템 - 메인 앱
   ============================================ */

// 상태 변수
let currentUser = null;
let currentTab = 'dashboard';
let selectedMonth = getMonthKey();
let selectedRole = 'admin';
let selectedBusiness = 'all';  // 'all' 또는 businessId
let showTerminatedStaff = false;  // 퇴사자 표시 토글
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

  if (role === 'staff') {
    populateStaffSelect();
  }
}

function populateStaffSelect() {
  const select = document.getElementById('staffSelect');
  select.innerHTML = '<option value="">-- 본인 이름 선택 --</option>';
  // 퇴사하지 않은 직원만 로그인 목록에 표시
  appData.staff
    .filter(s => !s.terminationDate)
    .forEach(s => {
      select.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    });
}

function loginAdmin() {
  const password = document.getElementById('adminPassword').value;
  if (password === ADMIN_PASSWORD) {
    currentUser = { role: 'admin' };
    showMainApp();
  } else {
    alert('비밀번호가 올바르지 않습니다.');
  }
}

function loginStaff() {
  const staffId = parseInt(document.getElementById('staffSelect').value);
  if (!staffId) {
    alert('이름을 선택해주세요.');
    return;
  }

  const password = document.getElementById('staffPassword').value;
  const staff = getStaffById(staffId);
  if (!staff) {
    alert('직원 정보를 찾을 수 없습니다.');
    return;
  }

  // 비밀번호 검증
  if (staff.password && staff.password !== password) {
    alert('비밀번호가 일치하지 않습니다.');
    return;
  }

  currentUser = { role: 'staff', staffId, staff };
  document.getElementById('staffPassword').value = ''; // 비밀번호 필드 초기화
  showMainApp();
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
      <button class="nav-tab ${currentTab === 'changePassword' ? 'active' : ''}" onclick="switchTab('changePassword')">비밀번호 변경</button>
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
  const monthKey = getMonthKey();
  const { year, month } = parseMonthKey(monthKey);

  // 선택된 사업장에 따라 직원 필터링
  const filteredStaff = getStaffByBusiness(selectedBusiness);
  const filteredInstructors = getCommissionInstructorsByBusiness(selectedBusiness);

  let totalGross = 0;
  let totalNet = 0;
  let totalDeductions = 0;
  const staffCount = filteredStaff.length + filteredInstructors.length;

  // 시급제 직원 계산
  filteredStaff.forEach(staff => {
    const logs = getStaffWorkLogs(staff.id, monthKey);
    const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
    const wage = calculateWage(staff, totalHours);
    const ded = calculateDeduction(staff, wage.grossPay, appData.settings);
    totalGross += wage.grossPay;
    totalDeductions += ded.deduction;
    totalNet += ded.netPay;
  });

  // 비율제 강사 계산
  filteredInstructors.forEach(instructor => {
    const students = getCommissionStudents(instructor.id, monthKey);
    if (students.length > 0) {
      const calc = calculateCommission(instructor, students, appData.settings);
      totalGross += calc.instructorGross;
      totalDeductions += calc.totalDeduction;
      totalNet += calc.netPay;
    }
  });

  // 사업장 이름 표시
  const businessTitle = selectedBusiness === 'all' ? '전체' : getBusinessName(selectedBusiness);

  container.innerHTML = `
    <h2 style="margin-bottom: 1.5rem; color: var(--primary);">${year}년 ${month}월 대시보드 - ${businessTitle}</h2>

    <div class="summary-grid">
      <div class="summary-card primary">
        <div class="summary-label">총 지급 예정액</div>
        <div class="summary-value">${formatKRW(totalNet)}</div>
        <div class="summary-sub">세후 실지급액</div>
      </div>
      <div class="summary-card accent">
        <div class="summary-label">총 급여 (세전)</div>
        <div class="summary-value">${formatKRW(totalGross)}</div>
        <div class="summary-sub">공제 전 금액</div>
      </div>
      <div class="summary-card">
        <div class="summary-label" style="color: var(--text-light);">총 공제액</div>
        <div class="summary-value" style="color: var(--danger);">${formatKRW(totalDeductions)}</div>
        <div class="summary-sub" style="color: var(--text-light);">고용보험 + 사업소득세</div>
      </div>
      <div class="summary-card">
        <div class="summary-label" style="color: var(--text-light);">등록 직원수</div>
        <div class="summary-value" style="color: var(--primary);">${staffCount}명</div>
        <div class="summary-sub" style="color: var(--text-light);">시급제 + 비율제</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">직원별 급여 현황</h3>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>소속</th>
              <th>유형</th>
              <th>근무/수강료</th>
              <th>세전 급여</th>
              <th>공제액</th>
              <th>실지급액</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStaff.map(staff => {
              const logs = getStaffWorkLogs(staff.id, monthKey);
              const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
              const wage = calculateWage(staff, totalHours);
              const ded = calculateDeduction(staff, wage.grossPay, appData.settings);
              const typeName = staff.type === 'assistant' ? '조교' : '파트강사';
              const businessName = getBusinessName(staff.businessId);
              return `
                <tr>
                  <td><strong>${staff.name}</strong></td>
                  <td><span class="badge badge-business">${businessName}</span></td>
                  <td><span class="badge ${staff.type === 'assistant' ? 'badge-assistant' : 'badge-instructor'}">${typeName}</span></td>
                  <td>${formatHours(totalHours)}</td>
                  <td>${formatKRW(wage.grossPay)}</td>
                  <td style="color: var(--danger);">-${formatKRW(ded.deduction)}</td>
                  <td><strong>${formatKRW(ded.netPay)}</strong></td>
                </tr>
              `;
            }).join('')}
            ${filteredInstructors.map(instructor => {
              const students = getCommissionStudents(instructor.id, monthKey);
              const calc = students.length > 0 ? calculateCommission(instructor, students, appData.settings) : null;
              const businessName = getBusinessName(instructor.businessId);
              return `
                <tr>
                  <td><strong>${instructor.name}</strong></td>
                  <td><span class="badge badge-business">${businessName}</span></td>
                  <td><span class="badge badge-part">비율제</span></td>
                  <td>${calc ? formatKRW(calc.totalTuition) : '-'}</td>
                  <td>${calc ? formatKRW(calc.instructorGross) : '-'}</td>
                  <td style="color: var(--danger);">${calc ? '-' + formatKRW(calc.totalDeduction) : '-'}</td>
                  <td><strong>${calc ? formatKRW(calc.netPay) : '-'}</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ============ 직원관리 ============
function renderStaffManagement(container) {
  // 선택된 사업장에 따라 직원 필터링
  const allStaff = getStaffByBusiness(selectedBusiness);

  // 퇴사자 필터링
  const activeStaff = allStaff.filter(s => !s.terminationDate);
  const terminatedStaff = allStaff.filter(s => !!s.terminationDate);

  // 표시할 직원 목록 결정
  const filteredStaff = showTerminatedStaff ? allStaff : activeStaff;

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">직원 관리</h3>
        <div style="display: flex; gap: 1rem; align-items: center;">
          ${terminatedStaff.length > 0 ? `
            <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-light); cursor: pointer;">
              <input type="checkbox" ${showTerminatedStaff ? 'checked' : ''} onchange="toggleTerminatedStaff(this.checked)">
              퇴사자 포함 (${terminatedStaff.length}명)
            </label>
          ` : ''}
          <button class="btn btn-primary" onclick="openAddStaffModal()">+ 직원 추가</button>
        </div>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>소속</th>
              <th>직급</th>
              <th>유형</th>
              <th>시급 정보</th>
              <th>입사일</th>
              <th>공제 유형</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStaff.map(staff => {
              const isTerminated = !!staff.terminationDate;
              const rowStyle = isTerminated ? 'background: #fafafa; opacity: 0.7;' : '';
              const nameStyle = isTerminated ? 'text-decoration: line-through; color: var(--text-light);' : '';

              let wageInfo = '';
              if (staff.tier1Hours > 0) {
                wageInfo = `첫 ${staff.tier1Hours}시간: ${formatKRW(staff.tier1Rate)}, 이후: ${formatKRW(staff.tier2Rate)}`;
              } else {
                wageInfo = `${formatKRW(staff.tier2Rate || staff.hourlyRate)}/시간`;
              }
              const typeName = staff.type === 'assistant' ? '조교' : '강사';
              const deductionType = staff.type === 'assistant' ? '고용보험 0.9%' : '3.3%';
              const businessName = getBusinessName(staff.businessId);
              const positionDisplay = staff.position || '-';
              const hireDateDisplay = staff.hireDate || '-';

              return `
                <tr style="${rowStyle}">
                  <td>
                    <strong style="${nameStyle}">${staff.name}</strong>
                    ${isTerminated ? '<span class="badge" style="background: #ffebee; color: #c62828; margin-left: 0.5rem; font-size: 0.7rem;">퇴사</span>' : ''}
                  </td>
                  <td><span class="badge badge-business">${businessName}</span></td>
                  <td>${positionDisplay}</td>
                  <td><span class="badge ${staff.type === 'assistant' ? 'badge-assistant' : 'badge-instructor'}">${typeName}</span></td>
                  <td style="font-size: 0.8125rem;">${wageInfo}</td>
                  <td style="font-size: 0.8125rem;">${hireDateDisplay}</td>
                  <td style="font-size: 0.8125rem;">${deductionType}</td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-outline btn-sm" onclick="openEditStaffModal(${staff.id})">수정</button>
                      <button class="btn btn-warning btn-sm" onclick="resetStaffPassword(${staff.id})">비번초기화</button>
                      <button class="btn btn-danger btn-sm" onclick="confirmDeleteStaff(${staff.id})">삭제</button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 퇴사자 표시 토글
function toggleTerminatedStaff(show) {
  showTerminatedStaff = show;
  renderContent();
}

function getStaffFormHTML(staff = null) {
  const businessOptions = appData.businesses.map(b =>
    `<option value="${b.id}" ${staff?.businessId === b.id ? 'selected' : ''}>${b.name}</option>`
  ).join('');

  // 기본 선택 사업장 결정: 수정 시 기존 값, 추가 시 선택된 사업장 또는 첫번째 사업장
  const defaultBusinessId = staff?.businessId ||
    (selectedBusiness !== 'all' ? selectedBusiness : appData.businesses[0]?.id);

  // 직급 옵션 정의
  const positionOptions = ['원장', '실장', '주임', '일반'];
  const isCustomPosition = staff?.position && !positionOptions.includes(staff.position);

  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">이름 *</label>
        <input type="text" id="staffName" class="form-input" value="${staff?.name || ''}" required>
      </div>
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
        <label class="form-label">입사일</label>
        <input type="date" id="staffHireDate" class="form-input" value="${staff?.hireDate || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">퇴사일</label>
        <input type="date" id="staffTerminationDate" class="form-input" value="${staff?.terminationDate || ''}">
        <small style="color: var(--text-light); font-size: 0.75rem;">퇴사일 입력 시 직원 목록에서 숨겨집니다</small>
      </div>
    </div>
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

  if (hireDate && terminationDate && terminationDate < hireDate) {
    alert('퇴사일은 입사일 이후여야 합니다.');
    return;
  }

  addStaff({
    name,
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
    position: getPositionValue()
  });

  closeModal();
  renderContent();
  showToast('직원이 추가되었습니다.');
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

  if (hireDate && terminationDate && terminationDate < hireDate) {
    alert('퇴사일은 입사일 이후여야 합니다.');
    return;
  }

  updateStaff(staffId, {
    name,
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
    position: getPositionValue()
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
            }).join('') : '<tr><td colspan="7" class="empty-state">등록된 비율제 강사가 없습니다.</td></tr>'}
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

  if (!name) {
    alert('이름을 입력해주세요.');
    return;
  }
  if (isNaN(ratePercent) || ratePercent < 1 || ratePercent > 100) {
    alert('비율은 1~100 사이로 입력해주세요.');
    return;
  }

  addCommissionInstructor({
    name,
    commissionRate: ratePercent / 100,
    businessId
  });

  closeModal();
  renderContent();
  showToast('비율제 강사가 추가되었습니다.');
}

function saveEditCommissionInstructor(id) {
  const name = document.getElementById('commInstructorName').value.trim();
  const ratePercent = parseInt(document.getElementById('commInstructorRate').value);
  const businessId = parseInt(document.getElementById('commInstructorBusinessId').value);

  if (!name) {
    alert('이름을 입력해주세요.');
    return;
  }

  updateCommissionInstructor(id, {
    name,
    commissionRate: ratePercent / 100,
    businessId
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

// ============ 급여정산 ============
function renderPayroll(container) {
  const { year, month } = parseMonthKey(selectedMonth);

  // 선택된 사업장에 따라 직원/강사 필터링
  const filteredStaff = getStaffByBusiness(selectedBusiness);
  const filteredInstructors = getCommissionInstructorsByBusiness(selectedBusiness);

  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  // 시급제 직원 정산
  const hourlyPayrollData = filteredStaff.map(staff => {
    const logs = getStaffWorkLogs(staff.id, selectedMonth);
    const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
    const wage = calculateWage(staff, totalHours);
    const ded = calculateDeduction(staff, wage.grossPay, appData.settings);

    totalGross += wage.grossPay;
    totalDeductions += ded.deduction;
    totalNet += ded.netPay;

    return { staff, totalHours, wage, ded, type: 'hourly' };
  }).filter(item => item.totalHours > 0);

  // 비율제 강사 정산
  const commissionPayrollData = filteredInstructors.map(instructor => {
    const students = getCommissionStudents(instructor.id, selectedMonth);
    if (students.length === 0) return null;

    const calc = calculateCommission(instructor, students, appData.settings);

    totalGross += calc.instructorGross;
    totalDeductions += calc.totalDeduction;
    totalNet += calc.netPay;

    return { instructor, calc, type: 'commission' };
  }).filter(item => item !== null);

  // 사업장 이름 표시
  const businessTitle = selectedBusiness === 'all' ? '전체' : getBusinessName(selectedBusiness);

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--primary);">${year}년 ${month}월 급여 정산 - ${businessTitle}</h2>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <div class="month-selector">
          <input type="month" value="${selectedMonth}" onchange="changeMonth(this.value)">
        </div>
        <button class="btn btn-success btn-sm" onclick="exportPayrollToExcel('${selectedMonth}', selectedBusiness)">Excel 다운로드</button>
      </div>
    </div>

    <div class="summary-grid">
      <div class="summary-card primary">
        <div class="summary-label">총 지급 예정액</div>
        <div class="summary-value">${formatKRW(totalNet)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label" style="color: var(--text-light);">총 세전 급여</div>
        <div class="summary-value" style="color: var(--primary);">${formatKRW(totalGross)}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label" style="color: var(--text-light);">총 공제액</div>
        <div class="summary-value" style="color: var(--danger);">${formatKRW(totalDeductions)}</div>
      </div>
    </div>

    ${hourlyPayrollData.length > 0 ? `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">시급제 직원 정산</h3>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>소속</th>
              <th>유형</th>
              <th>근무시간</th>
              <th>산출 내역</th>
              <th>세전</th>
              <th>공제</th>
              <th>실지급</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${hourlyPayrollData.map(item => {
              const { staff, totalHours, wage, ded } = item;
              const typeName = staff.type === 'assistant' ? '조교' : '파트강사';
              const businessName = getBusinessName(staff.businessId);
              return `
                <tr>
                  <td><strong>${staff.name}</strong></td>
                  <td><span class="badge badge-business">${businessName}</span></td>
                  <td><span class="badge ${staff.type === 'assistant' ? 'badge-assistant' : 'badge-instructor'}">${typeName}</span></td>
                  <td>${formatHours(totalHours)}</td>
                  <td style="font-size: 0.8125rem;">${wage.breakdown}</td>
                  <td>${formatKRW(wage.grossPay)}</td>
                  <td style="color: var(--danger); font-size: 0.8125rem;">
                    -${formatKRW(ded.deduction)}<br>
                    <span style="color: var(--text-light);">(${ded.typeName})</span>
                  </td>
                  <td><strong style="color: var(--success);">${formatKRW(ded.netPay)}</strong></td>
                  <td>
                    <button class="btn btn-accent btn-sm" onclick="openPayrollWorkLogModal(${staff.id})">시간수정</button>
                    <button class="btn btn-outline btn-sm" onclick="showPayslip(${staff.id})">보기</button>
                    <button class="btn btn-primary btn-sm" onclick="generateStaffPayrollPDF(${staff.id}, '${selectedMonth}')">PDF</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

    ${commissionPayrollData.length > 0 ? `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">비율제 강사 정산</h3>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>소속</th>
              <th>비율</th>
              <th>학생수</th>
              <th>총 수강료</th>
              <th>강사 몫</th>
              <th>공제</th>
              <th>실지급</th>
              <th>명세서</th>
            </tr>
          </thead>
          <tbody>
            ${commissionPayrollData.map(item => {
              const { instructor, calc } = item;
              const businessName = getBusinessName(instructor.businessId);
              return `
                <tr>
                  <td><strong>${instructor.name}</strong></td>
                  <td><span class="badge badge-business">${businessName}</span></td>
                  <td><span class="badge badge-part">${formatPercent(instructor.commissionRate)}</span></td>
                  <td>${calc.studentCount}명</td>
                  <td>${formatKRW(calc.totalTuition)}</td>
                  <td>${formatKRW(calc.instructorGross)}</td>
                  <td style="color: var(--danger); font-size: 0.8125rem;">
                    -${formatKRW(calc.totalDeduction)}<br>
                    <span style="color: var(--text-light);">(카드1%+3.3%)</span>
                  </td>
                  <td><strong style="color: var(--success);">${formatKRW(calc.netPay)}</strong></td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick="showCommissionPayslip(${instructor.id})">보기</button>
                    <button class="btn btn-primary btn-sm" onclick="generateCommissionPDF(${instructor.id}, '${selectedMonth}')">PDF</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

    ${hourlyPayrollData.length === 0 && commissionPayrollData.length === 0 ? `
    <div class="card">
      <div class="empty-state">이 달의 급여 정산 데이터가 없습니다.</div>
    </div>
    ` : ''}
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

    <div id="allMessagesContainer"></div>
  `;
}

function showCommissionMessageModal(instructorId) {
  const instructor = getCommissionInstructorById(instructorId);
  const students = getCommissionStudents(instructorId, selectedMonth);
  const calc = calculateCommission(instructor, students, appData.settings);
  const message = generateCommissionMessage(instructor, selectedMonth, calc);

  document.getElementById('modalTitle').textContent = `${instructor.name} 급여 확인 문자`;
  document.getElementById('modalBody').innerHTML = `
    <div class="message-preview">${message}</div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">닫기</button>
    <button class="btn btn-success" onclick="copyMessage(\`${encodeURIComponent(message)}\`)">복사하기</button>
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

  document.getElementById('modalTitle').textContent = `${staff.name} 급여 확인 문자`;
  document.getElementById('modalBody').innerHTML = `
    <div class="message-preview">${message}</div>
  `;
  document.getElementById('modalFooter').innerHTML = `
    <button class="btn btn-outline" onclick="closeModal()">닫기</button>
    <button class="btn btn-success" onclick="copyMessage(\`${encodeURIComponent(message)}\`)">복사하기</button>
  `;
  openModal();
}

function copyMessage(encodedMessage) {
  const message = decodeURIComponent(encodedMessage);
  copyToClipboard(message);
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

  if (staffWithWork.length === 0 && commissionWithStudents.length === 0) {
    html += '<div class="empty-state" style="padding: 2rem;">이 달의 급여 정산 대상자가 없습니다.</div>';
  }

  html += '</div>';
  document.getElementById('allMessagesContainer').innerHTML = html;
}

// ============ 설정 ============
function renderSettings(container) {
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

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">시스템 정보</h3>
      </div>
      <div style="color: var(--text-light); font-size: 0.875rem;">
        <p>등록된 사업장 수: ${appData.businesses.length}개</p>
        <p>등록된 시급제 직원 수: ${appData.staff.length}명</p>
        <p>등록된 비율제 강사 수: ${appData.commissionInstructors.length}명</p>
        <p>총 근무기록 수: ${appData.workLogs.length}건</p>
        <p>현재 최저시급: ${formatKRW(MINIMUM_WAGE)}</p>
      </div>
    </div>
  `;
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
            <input type="number" id="manualHours" class="form-input" step="0.5" min="0" placeholder="예: 3.5">
          </div>
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
    lastLog.endTime = time;
    lastLog.hours = calculateHours(lastLog.startTime, lastLog.endTime, lastLog.breakMinutes, staff.roundingRule || 'exact');
    saveData(appData);
    renderContent();
    showToast(`퇴근이 기록되었습니다! (${formatHours(lastLog.hours)})`);
  }
}

function addManualLog() {
  const staff = currentUser.staff;
  const date = document.getElementById('manualDate').value;
  const hours = parseFloat(document.getElementById('manualHours').value);
  const memo = document.getElementById('manualMemo').value.trim();

  if (!date || isNaN(hours) || hours <= 0) {
    alert('날짜와 근무시간을 입력해주세요.');
    return;
  }

  addWorkLog({
    staffId: staff.id,
    date,
    startTime: '',
    endTime: '',
    breakMinutes: 0,
    hours,
    memo
  });

  document.getElementById('manualHours').value = '';
  document.getElementById('manualMemo').value = '';
  showToast('근무 기록이 추가되었습니다!');
}

// ============ 4대보험 직원 관리 ============
let showTerminatedInsurance = false;

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

  // 퇴사자 필터링
  const activeTeachers = allTeachers.filter(t => !t.terminationDate);
  const terminatedTeachers = allTeachers.filter(t => !!t.terminationDate);
  const filteredTeachers = showTerminatedInsurance ? allTeachers : activeTeachers;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--primary);">${year}년 ${month}월 4대보험 직원 관리</h2>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <div class="month-selector">
          <input type="month" value="${selectedMonth}" onchange="changeMonth(this.value)">
        </div>
        ${terminatedTeachers.length > 0 ? `
          <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-light); cursor: pointer;">
            <input type="checkbox" ${showTerminatedInsurance ? 'checked' : ''} onchange="toggleTerminatedInsurance(this.checked)">
            퇴사자 포함 (${terminatedTeachers.length}명)
          </label>
        ` : ''}
        <button class="btn btn-primary" onclick="openAddInsuranceTeacherModal()">+ 직원 추가</button>
      </div>
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
              <th>소속</th>
              <th>직급</th>
              <th>월급여</th>
              <th>결근일수</th>
              <th>결근공제</th>
              <th>4대보험 공제</th>
              <th>실지급액</th>
              <th>입사일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${filteredTeachers.length > 0 ? filteredTeachers.map(teacher => {
              const isTerminated = !!teacher.terminationDate;
              const rowStyle = isTerminated ? 'background: #fafafa; opacity: 0.7;' : '';
              const nameStyle = isTerminated ? 'text-decoration: line-through; color: var(--text-light);' : '';
              const absentDays = getInsuranceAbsenceDays(teacher.id, selectedMonth);
              const calc = calculateInsurancePayroll(teacher.monthlySalary, absentDays);
              const businessName = getBusinessName(teacher.businessId);

              return `
                <tr style="${rowStyle}">
                  <td>
                    <strong style="${nameStyle}">${teacher.name}</strong>
                    ${isTerminated ? '<span class="badge" style="background: #ffebee; color: #c62828; margin-left: 0.5rem; font-size: 0.7rem;">퇴사</span>' : ''}
                  </td>
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
            }).join('') : '<tr><td colspan="10" class="empty-state">등록된 4대보험 직원이 없습니다.</td></tr>'}
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

function toggleTerminatedInsurance(show) {
  showTerminatedInsurance = show;
  renderContent();
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
    <div class="form-group">
      <label class="form-label">월 급여 (세전) *</label>
      <input type="number" id="insTeacherSalary" class="form-input" value="${teacher?.monthlySalary || 3000000}" min="0" step="10000">
    </div>
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

    <div style="background: var(--bg); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
      <strong>4대보험 공제 안내 (근로자 부담분)</strong>
      <p style="font-size: 0.875rem; color: var(--text-light); margin-top: 0.5rem;">
        • 국민연금: 4.75%<br>
        • 건강보험: 3.595%<br>
        • 장기요양: 건강보험의 13.14%<br>
        • 고용보험: 0.9%
      </p>
    </div>
  `;
}

function toggleInsuranceCustomPosition(select) {
  const customGroup = document.getElementById('insCustomPositionGroup');
  customGroup.style.display = select.value === 'custom' ? 'block' : 'none';
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
  const calc = calculateInsurancePayroll(teacher.monthlySalary, absentDays);

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

// 관리자용: 직원 비밀번호 초기화
function resetStaffPassword(staffId) {
  const staff = getStaffById(staffId);
  if (!staff) return;

  if (confirm(`${staff.name}님의 비밀번호를 0000으로 초기화하시겠습니까?`)) {
    staff.password = '0000';
    saveData(appData);
    showToast(`${staff.name}님의 비밀번호가 0000으로 초기화되었습니다.`);
  }
}

function changeStaffPassword() {
  const staff = currentUser.staff;
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // 현재 비밀번호 확인
  if (staff.password !== currentPassword) {
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
  const staffData = getStaffById(staff.id);
  staffData.password = newPassword;
  saveData(appData);

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
});
