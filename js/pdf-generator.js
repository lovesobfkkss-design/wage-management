/* ============================================
   급여 명세서 PDF 출력 모듈
   SPEC-PDF-001
   html2canvas + jsPDF 방식 (한글 지원)
   ============================================ */

// jsPDF 초기화
const { jsPDF } = window.jspdf;

function formatDateKorean(date) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

/**
 * 급여명세서 HTML 생성 (시급제 직원용)
 */
function createStaffPayslipHTML(staff, monthKey, logs, wage, ded) {
  const { year, month } = parseMonthKey(monthKey);
  const businessName = getBusinessName(staff.businessId);
  const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
  const typeName = staff.type === 'assistant' ? '조교' : '파트강사';
  const deductionRate = staff.type === 'assistant' ? '0.8%' : '3.3%';
  const today = new Date();
  const todayStr = formatDateKorean(today);

  return `
    <div id="pdfContent" style="
      width: 595px;
      padding: 40px;
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
      background: white;
      color: #1a1a1a;
      line-height: 1.6;
    ">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; margin: 0 0 8px 0;">${businessName}</h1>
        <h2 style="font-size: 18px; font-weight: 500; margin: 0; color: #666;">급여 명세서</h2>
      </div>

      <div style="font-size: 13px; margin-bottom: 20px;">
        <p style="margin: 4px 0;">발급일: ${todayStr}</p>
        <p style="margin: 4px 0;">정산월: ${year}년 ${month}월</p>
      </div>

      <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[직원 정보]</h3>
        <p style="margin: 4px 0; font-size: 13px;">이름: ${staff.name}</p>
        <p style="margin: 4px 0; font-size: 13px;">직급: ${typeName}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[근무 내역]</h3>
        <p style="margin: 4px 0; font-size: 13px;">총 근무시간: ${totalHours.toFixed(2)} 시간</p>
        <p style="margin: 4px 0; font-size: 13px;">시급: ${formatKRW(staff.hourlyRate)} 원</p>
        ${staff.tier1Hours > 0 ? `
          <p style="margin: 4px 0; font-size: 13px; padding-left: 10px;">- 1구간 (${staff.tier1Hours}시간): ${formatKRW(staff.tier1Rate)} 원/시간</p>
          <p style="margin: 4px 0; font-size: 13px; padding-left: 10px;">- 2구간: ${formatKRW(staff.tier2Rate)} 원/시간</p>
        ` : ''}
        <p style="margin: 4px 0; font-size: 13px;">세전급여: ${formatKRW(Math.round(wage.grossPay))} 원</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[공제 내역]</h3>
        <p style="margin: 4px 0; font-size: 13px;">공제 유형: ${ded.typeName}</p>
        <p style="margin: 4px 0; font-size: 13px;">공제율: ${deductionRate}</p>
        <p style="margin: 4px 0; font-size: 13px;">공제액: ${formatKRW(Math.round(ded.deduction))} 원</p>
      </div>

      <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">

      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[정산 요약]</h3>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0;">
          <span>세전급여:</span>
          <span>${formatKRW(Math.round(wage.grossPay))} 원</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0;">
          <span>공제액:</span>
          <span>- ${formatKRW(Math.round(ded.deduction))} 원</span>
        </div>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 10px 0; width: 200px;">
        <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; margin: 4px 0;">
          <span>실지급액:</span>
          <span>${formatKRW(Math.round(ded.netPay))} 원</span>
        </div>
      </div>

      <div style="text-align: right; font-size: 13px; margin-top: 40px;">
        발급인: ________________
      </div>
    </div>
  `;
}

/**
 * 급여명세서 HTML 생성 (비율제 강사용)
 */
function createCommissionPayslipHTML(instructor, monthKey, students, calc) {
  const { year, month } = parseMonthKey(monthKey);
  const businessName = getBusinessName(instructor.businessId);
  const today = new Date();
  const todayStr = formatDateKorean(today);

  // 학생 목록 HTML 생성
  const studentListHTML = students.map((s, i) => `
    <tr>
      <td style="padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 12px;">${i + 1}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 12px;">${s.name}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 12px; text-align: right;">${formatKRW(s.tuition)}</td>
    </tr>
  `).join('');

  return `
    <div id="pdfContent" style="
      width: 595px;
      padding: 40px;
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
      background: white;
      color: #1a1a1a;
      line-height: 1.6;
    ">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; margin: 0 0 8px 0;">${businessName}</h1>
        <h2 style="font-size: 18px; font-weight: 500; margin: 0; color: #666;">비율제 강사 정산 명세서</h2>
      </div>

      <div style="font-size: 13px; margin-bottom: 20px;">
        <p style="margin: 4px 0;">발급일: ${todayStr}</p>
        <p style="margin: 4px 0;">정산월: ${year}년 ${month}월</p>
      </div>

      <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[강사 정보]</h3>
        <p style="margin: 4px 0; font-size: 13px;">이름: ${instructor.name}</p>
        <p style="margin: 4px 0; font-size: 13px;">정산비율: ${instructor.commissionRate * 100}%</p>
        <p style="margin: 4px 0; font-size: 13px;">담당학생: ${students.length}명</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[학생별 수강료]</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px; text-align: left; font-size: 12px; border-bottom: 2px solid #333; width: 40px;">번호</th>
              <th style="padding: 8px; text-align: left; font-size: 12px; border-bottom: 2px solid #333;">학생명</th>
              <th style="padding: 8px; text-align: right; font-size: 12px; border-bottom: 2px solid #333; width: 120px;">수강료</th>
            </tr>
          </thead>
          <tbody>
            ${studentListHTML}
          </tbody>
          <tfoot>
            <tr style="background: #f9f9f9; font-weight: bold;">
              <td colspan="2" style="padding: 8px; font-size: 13px; border-top: 2px solid #333;">합계</td>
              <td style="padding: 8px; text-align: right; font-size: 13px; border-top: 2px solid #333;">${formatKRW(calc.totalTuition)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[정산 내역]</h3>
        <p style="margin: 4px 0; font-size: 13px;">총 수강료: ${formatKRW(calc.totalTuition)}</p>
        <p style="margin: 4px 0; font-size: 13px;">카드수수료 (1%): - ${formatKRW(Math.round(calc.cardFee))}</p>
        <p style="margin: 4px 0; font-size: 13px;">수수료공제 후: ${formatKRW(Math.round(calc.afterCardFee))}</p>
        <p style="margin: 4px 0; font-size: 13px;">강사 정산액 (${instructor.commissionRate * 100}%): ${formatKRW(Math.round(calc.instructorGross))}</p>
        <p style="margin: 4px 0; font-size: 13px;">사업소득세 (3.3%): - ${formatKRW(Math.round(calc.incomeTax))}</p>
      </div>

      <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">

      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[최종 정산]</h3>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0;">
          <span>세전정산액:</span>
          <span>${formatKRW(Math.round(calc.instructorGross))}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0;">
          <span>공제액:</span>
          <span>- ${formatKRW(Math.round(calc.totalDeduction))}</span>
        </div>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 10px 0; width: 200px;">
        <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; margin: 4px 0;">
          <span>실지급액:</span>
          <span>${formatKRW(Math.round(calc.netPay))}</span>
        </div>
      </div>

      <div style="text-align: right; font-size: 13px; margin-top: 40px;">
        발급인: ________________
      </div>
    </div>
  `;
}

/**
 * HTML을 PDF로 변환
 */
async function htmlToPDF(html, fileName) {
  // 임시 컨테이너 생성
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = html;
  document.body.appendChild(container);

  const element = container.querySelector('#pdfContent');

  try {
    // html2canvas로 캡처
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    // PDF 생성
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(fileName);

    showToast('PDF가 다운로드되었습니다.');
  } catch (error) {
    console.error('PDF 생성 오류:', error);
    showToast('PDF 생성 중 오류가 발생했습니다.');
  } finally {
    // 임시 컨테이너 제거
    document.body.removeChild(container);
  }
}

/**
 * 시급제 직원 급여 명세서 PDF 생성
 * @param {number} staffId - 직원 ID
 * @param {string} monthKey - 월 키 (YYYY-MM)
 */
function generateStaffPayrollPDF(staffId, monthKey) {
  const staff = getStaffById(staffId);
  if (!staff) {
    showToast('직원 정보를 찾을 수 없습니다.');
    return;
  }

  const logs = getStaffWorkLogs(staffId, monthKey);
  const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);

  if (totalHours === 0) {
    showToast('해당 월의 근무 기록이 없습니다.');
    return;
  }

  const wage = calculateWage(staff, totalHours);
  const ded = calculateDeduction(staff, wage.grossPay, appData.settings);
  const { year, month } = parseMonthKey(monthKey);

  const html = createStaffPayslipHTML(staff, monthKey, logs, wage, ded);
  const fileName = `급여명세서_${staff.name}_${year}년${month}월.pdf`;

  htmlToPDF(html, fileName);
}

/**
 * 비율제 강사 정산 명세서 PDF 생성
 * @param {number} instructorId - 강사 ID
 * @param {string} monthKey - 월 키 (YYYY-MM)
 */
function generateCommissionPDF(instructorId, monthKey) {
  const instructor = getCommissionInstructorById(instructorId);
  if (!instructor) {
    showToast('강사 정보를 찾을 수 없습니다.');
    return;
  }

  const students = getCommissionStudents(instructorId, monthKey);
  if (students.length === 0) {
    showToast('해당 월의 정산 대상이 없습니다.');
    return;
  }

  const calc = calculateCommission(instructor, students, appData.settings);
  const { year, month } = parseMonthKey(monthKey);

  const html = createCommissionPayslipHTML(instructor, monthKey, students, calc);
  const fileName = `급여명세서_${instructor.name}_${year}년${month}월.pdf`;

  htmlToPDF(html, fileName);
}

/**
 * 4대보험 직원 급여명세서 HTML 생성
 */
function createInsurancePayslipHTML(teacher, monthKey, calc) {
  const { year, month } = parseMonthKey(monthKey);
  const businessName = getBusinessName(teacher.businessId);
  const today = new Date();
  const todayStr = formatDateKorean(today);

  return `
    <div id="pdfContent" style="
      width: 595px;
      padding: 40px;
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
      background: white;
      color: #1a1a1a;
      line-height: 1.6;
    ">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; margin: 0 0 8px 0;">${businessName}</h1>
        <h2 style="font-size: 18px; font-weight: 500; margin: 0; color: #666;">급여 명세서</h2>
      </div>

      <div style="font-size: 13px; margin-bottom: 20px;">
        <p style="margin: 4px 0;">발급일: ${todayStr}</p>
        <p style="margin: 4px 0;">정산월: ${year}년 ${month}월</p>
      </div>

      <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[직원 정보]</h3>
        <p style="margin: 4px 0; font-size: 13px;">이름: ${teacher.name}</p>
        <p style="margin: 4px 0; font-size: 13px;">직급: ${teacher.position || '4대보험 직원'}</p>
        <p style="margin: 4px 0; font-size: 13px;">입사일: ${teacher.hireDate || '-'}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[급여 내역]</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">기본급</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatKRW(calc.monthlySalary)}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[공제 내역]</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">항목</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #ddd;">비율</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #ddd;">금액</th>
            </tr>
          </thead>
          <tbody>
            ${calc.breakdown.map(item => `
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: center; color: #666;">${item.rate}</td>
                <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #c00;">-${formatKRW(item.amount)}</td>
              </tr>
            `).join('')}
            <tr style="background: #f9f9f9; font-weight: bold;">
              <td colspan="2" style="padding: 8px; border: 1px solid #ddd;">공제액 계</td>
              <td style="padding: 8px; border: 1px solid #ddd; text-align: right; color: #c00;">-${formatKRW(calc.totalDeduction)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">

      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[정산 요약]</h3>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0;">
          <span>지급액 계:</span>
          <span>${formatKRW(calc.monthlySalary)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0;">
          <span>공제액 계:</span>
          <span>- ${formatKRW(calc.totalDeduction)}</span>
        </div>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 10px 0; width: 200px; margin-left: auto;">
        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin: 4px 0;">
          <span>실지급액:</span>
          <span>${formatKRW(calc.netPay)}</span>
        </div>
      </div>

      <div style="text-align: center; font-size: 12px; color: #666; margin-top: 40px;">
        귀하의 노고에 감사드립니다.
      </div>
    </div>
  `;
}

/**
 * 4대보험 직원 급여명세서 PDF 생성
 */
function generateInsurancePDF(teacherId, monthKey) {
  const teacher = getInsuranceTeacherById(teacherId);
  if (!teacher) {
    showToast('직원 정보를 찾을 수 없습니다.');
    return;
  }

  const calc = calculateInsuranceDeduction(teacher.monthlySalary);
  const { year, month } = parseMonthKey(monthKey);

  const html = createInsurancePayslipHTML(teacher, monthKey, calc);
  const fileName = `급여명세서_${teacher.name}_${year}년${month}월.pdf`;

  htmlToPDF(html, fileName);
}

/**
 * 특강 정산 명세서 HTML 생성
 */
function createSpecialLecturePayslipHTML(lecture, monthKey, students, calc) {
  const { year, month } = parseMonthKey(monthKey);
  const businessName = getBusinessName(lecture.businessId);
  const today = new Date();
  const todayStr = formatDateKorean(today);

  // 학생 목록 HTML 생성
  const studentListHTML = students.map((s, i) => `
    <tr>
      <td style="padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 12px;">${i + 1}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 12px;">${s.name}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #eee; font-size: 12px; text-align: right;">${formatKRW(s.tuition)}</td>
    </tr>
  `).join('');

  return `
    <div id="pdfContent" style="
      width: 595px;
      padding: 40px;
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
      background: white;
      color: #1a1a1a;
      line-height: 1.6;
    ">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-size: 24px; margin: 0 0 8px 0;">${businessName}</h1>
        <h2 style="font-size: 18px; font-weight: 500; margin: 0; color: #666;">특강 정산 명세서</h2>
      </div>

      <div style="font-size: 13px; margin-bottom: 20px;">
        <p style="margin: 4px 0;">발급일: ${todayStr}</p>
        <p style="margin: 4px 0;">정산월: ${year}년 ${month}월</p>
      </div>

      <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[특강 정보]</h3>
        <p style="margin: 4px 0; font-size: 13px;">특강명: ${lecture.name}</p>
        <p style="margin: 4px 0; font-size: 13px;">과목: ${lecture.subject || '-'}</p>
        <p style="margin: 4px 0; font-size: 13px;">강사: ${lecture.instructorName}</p>
        <p style="margin: 4px 0; font-size: 13px;">정산비율: ${Math.round(lecture.commissionRate * 100)}%</p>
        <p style="margin: 4px 0; font-size: 13px;">수강생: ${students.length}명</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[학생별 수강료]</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 8px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 8px; text-align: left; font-size: 12px; border-bottom: 2px solid #333; width: 40px;">번호</th>
              <th style="padding: 8px; text-align: left; font-size: 12px; border-bottom: 2px solid #333;">학생명</th>
              <th style="padding: 8px; text-align: right; font-size: 12px; border-bottom: 2px solid #333; width: 120px;">수강료</th>
            </tr>
          </thead>
          <tbody>
            ${studentListHTML}
          </tbody>
          <tfoot>
            <tr style="background: #f9f9f9; font-weight: bold;">
              <td colspan="2" style="padding: 8px; font-size: 13px; border-top: 2px solid #333;">합계</td>
              <td style="padding: 8px; text-align: right; font-size: 13px; border-top: 2px solid #333;">${formatKRW(calc.totalTuition)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[정산 내역]</h3>
        <p style="margin: 4px 0; font-size: 13px;">총 수강료: ${formatKRW(calc.totalTuition)}</p>
        <p style="margin: 4px 0; font-size: 13px;">카드수수료 (1%): - ${formatKRW(calc.cardFee)}</p>
        <p style="margin: 4px 0; font-size: 13px;">수수료공제 후: ${formatKRW(calc.afterCardFee)}</p>
        <p style="margin: 4px 0; font-size: 13px;">강사 정산액 (${Math.round(lecture.commissionRate * 100)}%): ${formatKRW(calc.instructorGross)}</p>
        <p style="margin: 4px 0; font-size: 13px;">사업소득세 (3.3%): - ${formatKRW(calc.incomeTax)}</p>
      </div>

      <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">

      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[최종 정산]</h3>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0;">
          <span>세전정산액:</span>
          <span>${formatKRW(calc.instructorGross)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0;">
          <span>공제액:</span>
          <span>- ${formatKRW(calc.incomeTax)}</span>
        </div>
        <hr style="border: none; border-top: 1px solid #ccc; margin: 10px 0; width: 200px; margin-left: auto;">
        <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin: 4px 0;">
          <span>실지급액:</span>
          <span>${formatKRW(calc.netPay)}</span>
        </div>
      </div>

      <div style="text-align: center; font-size: 12px; color: #666; margin-top: 40px;">
        귀하의 노고에 감사드립니다.
      </div>
    </div>
  `;
}

/**
 * 특강 정산 명세서 PDF 생성
 */
function generateSpecialLecturePDF(lectureId, monthKey) {
  const lecture = getSpecialLectureById(lectureId);
  if (!lecture) {
    showToast('특강 정보를 찾을 수 없습니다.');
    return;
  }

  const students = getSpecialLectureStudents(lectureId, monthKey);
  if (students.length === 0) {
    showToast('해당 월의 수강생이 없습니다.');
    return;
  }

  const calc = calculateSpecialLecture(lecture, students, appData.settings);
  const { year, month } = parseMonthKey(monthKey);

  const html = createSpecialLecturePayslipHTML(lecture, monthKey, students, calc);
  const fileName = `특강정산_${lecture.name}_${lecture.instructorName}_${year}년${month}월.pdf`;

  htmlToPDF(html, fileName);
}
