/* ============================================
   강한영어수학학원 급여관리시스템 - 메인 앱
   ============================================ */

// 상태 변수
let currentUser = null;
let currentTab = 'dashboard';
let selectedMonth = getMonthKey();
let selectedRole = 'admin';

// ============ 로그인 관련 ============
function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));
  event.target.closest('.role-btn').classList.add('active');

  document.getElementById('adminLogin').classList.toggle('hidden', role !== 'admin');
  document.getElementById('staffLogin').classList.toggle('hidden', role !== 'staff');

  if (role === 'staff') {
    populateStaffSelect();
  }
}

function populateStaffSelect() {
  const select = document.getElementById('staffSelect');
  select.innerHTML = '<option value="">-- 본인 이름 선택 --</option>';
  appData.staff.forEach(s => {
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
  const staff = getStaffById(staffId);
  currentUser = { role: 'staff', staffId, staff };
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
  renderNavTabs();
  renderContent();
}

// ============ 네비게이션 ============
function renderNavTabs() {
  const navTabs = document.getElementById('navTabs');

  if (currentUser.role === 'admin') {
    navTabs.innerHTML = `
      <button class="nav-tab ${currentTab === 'dashboard' ? 'active' : ''}" onclick="switchTab('dashboard')">대시보드</button>
      <button class="nav-tab ${currentTab === 'staff' ? 'active' : ''}" onclick="switchTab('staff')">직원관리</button>
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

  let totalGross = 0;
  let totalNet = 0;
  let totalDeductions = 0;
  let staffCount = appData.staff.length;

  appData.staff.forEach(staff => {
    const logs = getStaffWorkLogs(staff.id, monthKey);
    const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
    const wage = calculateWage(staff, totalHours);
    const ded = calculateDeduction(staff, wage.grossPay, appData.settings);
    totalGross += wage.grossPay;
    totalDeductions += ded.deduction;
    totalNet += ded.netPay;
  });

  container.innerHTML = `
    <h2 style="margin-bottom: 1.5rem; color: var(--primary);">${year}년 ${month}월 대시보드</h2>

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
        <div class="summary-sub" style="color: var(--text-light);">조교 + 강사</div>
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
              <th>총 근무시간</th>
              <th>세전 급여</th>
              <th>공제액</th>
              <th>실지급액</th>
            </tr>
          </thead>
          <tbody>
            ${appData.staff.map(staff => {
              const logs = getStaffWorkLogs(staff.id, monthKey);
              const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
              const wage = calculateWage(staff, totalHours);
              const ded = calculateDeduction(staff, wage.grossPay, appData.settings);
              return `
                <tr>
                  <td><strong>${staff.name}</strong></td>
                  <td>${formatHours(totalHours)}</td>
                  <td>${formatKRW(wage.grossPay)}</td>
                  <td style="color: var(--danger);">-${formatKRW(ded.deduction)}</td>
                  <td><strong>${formatKRW(ded.netPay)}</strong></td>
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
  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">직원 관리</h3>
        <button class="btn btn-primary" onclick="openAddStaffModal()">+ 직원 추가</button>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>유형</th>
              <th>시급 정보</th>
              <th>공제 유형</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            ${appData.staff.map(staff => {
              let wageInfo = '';
              if (staff.tier1Hours > 0) {
                wageInfo = `첫 ${staff.tier1Hours}시간: ${formatKRW(staff.tier1Rate)}, 이후: ${formatKRW(staff.tier2Rate)}`;
              } else {
                wageInfo = `${formatKRW(staff.tier2Rate || staff.hourlyRate)}/시간`;
              }
              const typeName = staff.type === 'assistant' ? '조교' : '강사';
              const deductionType = staff.type === 'assistant' ? '고용보험 0.8%' : '3.3%';
              return `
                <tr>
                  <td><strong>${staff.name}</strong></td>
                  <td><span class="badge ${staff.type === 'assistant' ? 'badge-assistant' : 'badge-instructor'}">${typeName}</span></td>
                  <td style="font-size: 0.8125rem;">${wageInfo}</td>
                  <td style="font-size: 0.8125rem;">${deductionType}</td>
                  <td>
                    <div class="actions">
                      <button class="btn btn-outline btn-sm" onclick="openEditStaffModal(${staff.id})">수정</button>
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

function getStaffFormHTML(staff = null) {
  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">이름 *</label>
        <input type="text" id="staffName" class="form-input" value="${staff?.name || ''}" required>
      </div>
      <div class="form-group">
        <label class="form-label">공제 유형 *</label>
        <select id="staffType" class="form-select">
          <option value="assistant" ${staff?.type === 'assistant' ? 'selected' : ''}>고용보험 0.8% (조교)</option>
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

  addStaff({
    name,
    type: document.getElementById('staffType').value,
    hourlyRate: parseInt(document.getElementById('tier2Rate').value) || 12000,
    tier1Hours: parseInt(document.getElementById('tier1Hours').value) || 0,
    tier1Rate: parseInt(document.getElementById('tier1Rate').value) || 0,
    tier2Rate: parseInt(document.getElementById('tier2Rate').value) || 12000,
    roundingRule: document.getElementById('roundingRule').value
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

  updateStaff(staffId, {
    name,
    type: document.getElementById('staffType').value,
    hourlyRate: parseInt(document.getElementById('tier2Rate').value) || 12000,
    tier1Hours: parseInt(document.getElementById('tier1Hours').value) || 0,
    tier1Rate: parseInt(document.getElementById('tier1Rate').value) || 0,
    tier2Rate: parseInt(document.getElementById('tier2Rate').value) || 12000,
    roundingRule: document.getElementById('roundingRule').value
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

// ============ 근무기록 ============
function renderWorkLogs(container) {
  const { year, month } = parseMonthKey(selectedMonth);

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
  return `
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">날짜 *</label>
        <input type="date" id="logDate" class="form-input" value="${log?.date || today}">
      </div>
      <div class="form-group">
        <label class="form-label">직원 *</label>
        <select id="logStaff" class="form-select">
          ${appData.staff.map(s => `
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
  const log = appData.workLogs.find(l => l.id === logId);
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
  const staffId = parseInt(document.getElementById('logStaff').value);
  const staff = getStaffById(staffId);
  const startTime = document.getElementById('logStart').value;
  const endTime = document.getElementById('logEnd').value;
  const breakMinutes = parseInt(document.getElementById('logBreak').value) || 0;
  let hours = parseFloat(document.getElementById('logHours').value);

  if (isNaN(hours) && startTime && endTime) {
    hours = calculateHours(startTime, endTime, breakMinutes, staff?.roundingRule || 'exact');
  }

  updateWorkLog(logId, {
    staffId,
    date: document.getElementById('logDate').value,
    startTime,
    endTime,
    breakMinutes,
    hours,
    memo: document.getElementById('logMemo').value.trim()
  });

  closeModal();
  renderContent();
  showToast('근무기록이 수정되었습니다.');
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

  let totalGross = 0;
  let totalDeductions = 0;
  let totalNet = 0;

  const payrollData = appData.staff.map(staff => {
    const logs = getStaffWorkLogs(staff.id, selectedMonth);
    const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
    const wage = calculateWage(staff, totalHours);
    const ded = calculateDeduction(staff, wage.grossPay, appData.settings);

    totalGross += wage.grossPay;
    totalDeductions += ded.deduction;
    totalNet += ded.netPay;

    return { staff, totalHours, wage, ded };
  }).filter(item => item.totalHours > 0);

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
      <h2 style="color: var(--primary);">${year}년 ${month}월 급여 정산</h2>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <div class="month-selector">
          <input type="month" value="${selectedMonth}" onchange="changeMonth(this.value)">
        </div>
        <button class="btn btn-success btn-sm" onclick="exportPayrollToExcel('${selectedMonth}')">Excel 다운로드</button>
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

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">직원별 상세 정산</h3>
      </div>
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>이름</th>
              <th>근무시간</th>
              <th>산출 내역</th>
              <th>세전</th>
              <th>공제</th>
              <th>실지급</th>
              <th>명세서</th>
            </tr>
          </thead>
          <tbody>
            ${payrollData.map(item => {
              const { staff, totalHours, wage, ded } = item;
              return `
                <tr>
                  <td><strong>${staff.name}</strong></td>
                  <td>${formatHours(totalHours)}</td>
                  <td style="font-size: 0.8125rem;">${wage.breakdown}</td>
                  <td>${formatKRW(wage.grossPay)}</td>
                  <td style="color: var(--danger); font-size: 0.8125rem;">
                    -${formatKRW(ded.deduction)}<br>
                    <span style="color: var(--text-light);">(${ded.typeName})</span>
                  </td>
                  <td><strong style="color: var(--success);">${formatKRW(ded.netPay)}</strong></td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick="showPayslip(${staff.id})">명세서</button>
                  </td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="7" class="empty-state">이 달의 급여 정산 데이터가 없습니다.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
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

  const staffWithWork = appData.staff.filter(staff => {
    const logs = getStaffWorkLogs(staff.id, selectedMonth);
    return logs.reduce((sum, log) => sum + log.hours, 0) > 0;
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
        <h3 class="card-title">직원별 문자 생성</h3>
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

    <div id="allMessagesContainer"></div>
  `;
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
  const staffWithWork = appData.staff.filter(staff => {
    const logs = getStaffWorkLogs(staff.id, selectedMonth);
    return logs.reduce((sum, log) => sum + log.hours, 0) > 0;
  });

  let html = '<div class="card"><div class="card-header"><h3 class="card-title">전체 문자 목록</h3></div>';

  staffWithWork.forEach(staff => {
    const logs = getStaffWorkLogs(staff.id, selectedMonth);
    const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
    const wage = calculateWage(staff, totalHours);
    const ded = calculateDeduction(staff, wage.grossPay, appData.settings);
    const message = generatePayrollMessage(staff, selectedMonth, totalHours, wage, ded);

    html += `
      <div style="margin-bottom: 1.5rem; padding: 1rem; background: var(--bg); border-radius: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
          <strong>${staff.name}</strong>
          <button class="btn btn-success btn-sm" onclick="copyMessage(\`${encodeURIComponent(message)}\`)">복사</button>
        </div>
        <div class="message-preview" style="font-size: 0.8125rem;">${message}</div>
      </div>
    `;
  });

  html += '</div>';
  document.getElementById('allMessagesContainer').innerHTML = html;
}

// ============ 설정 ============
function renderSettings(container) {
  container.innerHTML = `
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
      </div>
      <button class="btn btn-primary" onclick="saveSettings()">설정 저장</button>
    </div>

    <div class="card">
      <div class="card-header">
        <h3 class="card-title">시스템 정보</h3>
      </div>
      <div style="color: var(--text-light); font-size: 0.875rem;">
        <p>등록된 직원 수: ${appData.staff.length}명</p>
        <p>총 근무기록 수: ${appData.workLogs.length}건</p>
        <p>현재 최저시급: ${formatKRW(MINIMUM_WAGE)}</p>
      </div>
    </div>
  `;
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
              </tr>
            `).join('') || '<tr><td colspan="5" class="empty-state">이 달의 근무기록이 없습니다.</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
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
    </div>
  `;

  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const el = document.getElementById('currentTime');
  if (el) {
    el.textContent = new Date().toLocaleTimeString('ko-KR');
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

// ============ 모달 ============
function openModal() {
  document.getElementById('modalOverlay').classList.add('active');
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('active');
}

// ============ 초기화 ============
document.addEventListener('DOMContentLoaded', function () {
  // 모달 외부 클릭시 닫기
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // 직원 선택 목록 초기화
  populateStaffSelect();
});
