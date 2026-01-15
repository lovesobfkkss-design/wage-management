/* ============================================
   급여 명세서 PDF 출력 모듈
   SPEC-PDF-001
   ============================================ */

// jsPDF 초기화
const { jsPDF } = window.jspdf;

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
  const businessName = getBusinessName(staff.businessId);

  // PDF 생성
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let yPos = 25;

  // 헤더
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(businessName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(14);
  doc.text('급여 명세서', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // 발급일/정산월
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const today = new Date();
  doc.text(`발급일: ${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`, marginLeft, yPos);
  yPos += 6;
  doc.text(`정산월: ${year}년 ${month}월`, marginLeft, yPos);
  yPos += 12;

  // 구분선
  doc.setLineWidth(0.5);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 10;

  // 직원 정보 섹션
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('[직원 정보]', marginLeft, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`이름: ${staff.name}`, marginLeft, yPos);
  yPos += 6;
  const typeName = staff.type === 'assistant' ? '조교' : '파트강사';
  doc.text(`직급: ${typeName}`, marginLeft, yPos);
  yPos += 12;

  // 근무 내역 섹션
  doc.setFont('helvetica', 'bold');
  doc.text('[근무 내역]', marginLeft, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`총 근무시간: ${totalHours.toFixed(2)} 시간`, marginLeft, yPos);
  yPos += 6;
  doc.text(`시급: ${formatKRW(staff.hourlyRate)} 원`, marginLeft, yPos);
  yPos += 6;

  // 2단계 시급제 표시
  if (staff.tier1Hours > 0) {
    doc.text(`  - 1구간 (${staff.tier1Hours}시간): ${formatKRW(staff.tier1Rate)} 원/시간`, marginLeft, yPos);
    yPos += 6;
    doc.text(`  - 2구간: ${formatKRW(staff.tier2Rate)} 원/시간`, marginLeft, yPos);
    yPos += 6;
  }

  doc.text(`세전급여: ${formatKRW(Math.round(wage.grossPay))} 원`, marginLeft, yPos);
  yPos += 12;

  // 공제 내역 섹션
  doc.setFont('helvetica', 'bold');
  doc.text('[공제 내역]', marginLeft, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`공제 유형: ${ded.typeName}`, marginLeft, yPos);
  yPos += 6;
  const deductionRate = staff.type === 'assistant' ? '0.8%' : '3.3%';
  doc.text(`공제율: ${deductionRate}`, marginLeft, yPos);
  yPos += 6;
  doc.text(`공제액: ${formatKRW(Math.round(ded.deduction))} 원`, marginLeft, yPos);
  yPos += 12;

  // 구분선
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 10;

  // 정산 요약 섹션
  doc.setFont('helvetica', 'bold');
  doc.text('[정산 요약]', marginLeft, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`세전급여:`, marginLeft, yPos);
  doc.text(`${formatKRW(Math.round(wage.grossPay))} 원`, marginLeft + 80, yPos, { align: 'right' });
  yPos += 6;
  doc.text(`공제액:`, marginLeft, yPos);
  doc.text(`- ${formatKRW(Math.round(ded.deduction))} 원`, marginLeft + 80, yPos, { align: 'right' });
  yPos += 8;

  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPos, marginLeft + 90, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`실지급액:`, marginLeft, yPos);
  doc.text(`${formatKRW(Math.round(ded.netPay))} 원`, marginLeft + 80, yPos, { align: 'right' });
  yPos += 20;

  // 서명란
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('발급인: ________________', pageWidth - marginRight - 60, yPos);

  // 파일 저장
  const fileName = `급여명세서_${staff.name}_${year}년${month}월.pdf`;
  doc.save(fileName);

  showToast('PDF가 다운로드되었습니다.');
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
  const businessName = getBusinessName(instructor.businessId);

  // PDF 생성
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLeft = 20;
  const marginRight = 20;
  let yPos = 25;

  // 헤더
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(businessName, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(14);
  doc.text('비율제 강사 정산 명세서', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // 발급일/정산월
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const today = new Date();
  doc.text(`발급일: ${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`, marginLeft, yPos);
  yPos += 6;
  doc.text(`정산월: ${year}년 ${month}월`, marginLeft, yPos);
  yPos += 12;

  // 구분선
  doc.setLineWidth(0.5);
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 10;

  // 강사 정보 섹션
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('[강사 정보]', marginLeft, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`이름: ${instructor.name}`, marginLeft, yPos);
  yPos += 6;
  doc.text(`정산비율: ${instructor.commissionRate * 100}%`, marginLeft, yPos);
  yPos += 6;
  doc.text(`담당학생: ${students.length}명`, marginLeft, yPos);
  yPos += 12;

  // 정산 기준 섹션
  doc.setFont('helvetica', 'bold');
  doc.text('[정산 기준]', marginLeft, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`총 수강료: ${formatKRW(calc.totalTuition)} 원`, marginLeft, yPos);
  yPos += 6;
  doc.text(`카드수수료 (1%): - ${formatKRW(Math.round(calc.cardFee))} 원`, marginLeft, yPos);
  yPos += 6;
  doc.text(`수수료공제 후: ${formatKRW(Math.round(calc.afterCardFee))} 원`, marginLeft, yPos);
  yPos += 6;
  doc.text(`강사 정산액 (${instructor.commissionRate * 100}%): ${formatKRW(Math.round(calc.instructorGross))} 원`, marginLeft, yPos);
  yPos += 12;

  // 공제 내역 섹션
  doc.setFont('helvetica', 'bold');
  doc.text('[공제 내역]', marginLeft, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`사업소득세 (3.3%): - ${formatKRW(Math.round(calc.incomeTax))} 원`, marginLeft, yPos);
  yPos += 12;

  // 구분선
  doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
  yPos += 10;

  // 최종 정산 섹션
  doc.setFont('helvetica', 'bold');
  doc.text('[최종 정산]', marginLeft, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.text(`세전정산액:`, marginLeft, yPos);
  doc.text(`${formatKRW(Math.round(calc.instructorGross))} 원`, marginLeft + 80, yPos, { align: 'right' });
  yPos += 6;
  doc.text(`공제액:`, marginLeft, yPos);
  doc.text(`- ${formatKRW(Math.round(calc.totalDeduction))} 원`, marginLeft + 80, yPos, { align: 'right' });
  yPos += 8;

  doc.setLineWidth(0.3);
  doc.line(marginLeft, yPos, marginLeft + 90, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`실지급액:`, marginLeft, yPos);
  doc.text(`${formatKRW(Math.round(calc.netPay))} 원`, marginLeft + 80, yPos, { align: 'right' });
  yPos += 20;

  // 서명란
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('발급인: ________________', pageWidth - marginRight - 60, yPos);

  // 파일 저장
  const fileName = `급여명세서_${instructor.name}_${year}년${month}월.pdf`;
  doc.save(fileName);

  showToast('PDF가 다운로드되었습니다.');
}
