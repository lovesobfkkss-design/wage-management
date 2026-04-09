/*
  Legacy PDF export entrypoint kept for backward compatibility.
  Uses html2canvas + jsPDF image export to avoid custom font issues.
*/
(function () {
  if (window.generateStaffPayrollPDF && window.generateCommissionPDF) {
    return;
  }

  const jspdfNs = window.jspdf;
  if (!jspdfNs || !jspdfNs.jsPDF) {
    console.error('jsPDF not loaded.');
    return;
  }

  const { jsPDF } = jspdfNs;

  function createStaffPayslipHTML(staff, monthKey, logs, wage, ded) {
    const parsed = parseMonthKey(monthKey);
    const businessName = getBusinessName(staff.businessId);
    const totalHours = logs.reduce((sum, log) => sum + log.hours, 0);
    const typeName = staff.type === 'assistant' ? '조교' : '파트강사';
    const deductionRate = staff.type === 'assistant' ? '0.8%' : '3.3%';
    const today = new Date();
    const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

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
          <p style="margin: 4px 0;">정산월: ${parsed.year}년 ${parsed.month}월</p>
        </div>

        <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[직원 정보]</h3>
          <p style="margin: 4px 0; font-size: 13px;">이름: ${staff.name}</p>
          <p style="margin: 4px 0; font-size: 13px;">직급: ${typeName}</p>
          <p style="margin: 4px 0; font-size: 13px;">주민등록번호: ${staff.residentId || '-'}</p>
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

  function createCommissionPayslipHTML(instructor, monthKey, students, calc) {
    const parsed = parseMonthKey(monthKey);
    const businessName = getBusinessName(instructor.businessId);
    const today = new Date();
    const todayStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

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
          <p style="margin: 4px 0;">정산월: ${parsed.year}년 ${parsed.month}월</p>
        </div>

        <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[강사 정보]</h3>
          <p style="margin: 4px 0; font-size: 13px;">이름: ${instructor.name}</p>
          <p style="margin: 4px 0; font-size: 13px;">주민등록번호: ${instructor.residentId || '-'}</p>
          <p style="margin: 4px 0; font-size: 13px;">정산비율: ${instructor.commissionRate * 100}%</p>
          <p style="margin: 4px 0; font-size: 13px;">담당학생: ${students.length}명</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[정산 기준]</h3>
          <p style="margin: 4px 0; font-size: 13px;">총 수강료: ${formatKRW(calc.totalTuition)} 원</p>
          <p style="margin: 4px 0; font-size: 13px;">카드수수료 (1%): - ${formatKRW(Math.round(calc.cardFee))} 원</p>
          <p style="margin: 4px 0; font-size: 13px;">수수료공제 후: ${formatKRW(Math.round(calc.afterCardFee))} 원</p>
          <p style="margin: 4px 0; font-size: 13px;">강사 정산액 (${instructor.commissionRate * 100}%): ${formatKRW(Math.round(calc.instructorGross))} 원</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[공제 내역]</h3>
          <p style="margin: 4px 0; font-size: 13px;">사업소득세 (3.3%): - ${formatKRW(Math.round(calc.incomeTax))} 원</p>
        </div>

        <hr style="border: none; border-top: 1px solid #333; margin: 20px 0;">

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 14px; margin: 0 0 10px 0; color: #333;">[최종 정산]</h3>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0;">
            <span>세전정산액:</span>
            <span>${formatKRW(Math.round(calc.instructorGross))} 원</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 13px; margin: 4px 0;">
            <span>공제액:</span>
            <span>- ${formatKRW(Math.round(calc.totalDeduction))} 원</span>
          </div>
          <hr style="border: none; border-top: 1px solid #ccc; margin: 10px 0; width: 200px;">
          <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; margin: 4px 0;">
            <span>실지급액:</span>
            <span>${formatKRW(Math.round(calc.netPay))} 원</span>
          </div>
        </div>

        <div style="text-align: right; font-size: 13px; margin-top: 40px;">
          발급인: ________________
        </div>
      </div>
    `;
  }

  function loadHtml2Canvas() {
    if (window.html2canvas) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('html2canvas load failed'));
      document.head.appendChild(script);
    });
  }

  async function htmlToPDF(html, fileName) {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.innerHTML = html;
    document.body.appendChild(container);

    const element = container.querySelector('#pdfContent');

    try {
      if (!window.html2canvas) {
        await loadHtml2Canvas();
      }
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

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
      document.body.removeChild(container);
    }
  }

  window.generateStaffPayrollPDF = function (staffId, monthKey) {
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
    const parsed = parseMonthKey(monthKey);

    const html = createStaffPayslipHTML(staff, monthKey, logs, wage, ded);
    const fileName = `급여명세서_${staff.name}_${parsed.year}년${parsed.month}월.pdf`;

    htmlToPDF(html, fileName);
  };

  window.generateCommissionPDF = function (instructorId, monthKey) {
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
    const parsed = parseMonthKey(monthKey);

    const html = createCommissionPayslipHTML(instructor, monthKey, students, calc);
    const fileName = `급여명세서_${instructor.name}_${parsed.year}년${parsed.month}월.pdf`;

    htmlToPDF(html, fileName);
  };
})();
