# 기술 스택

## 개요

| 구분 | 기술 |
|------|------|
| **프론트엔드** | HTML5, CSS3, Vanilla JavaScript |
| **데이터** | Firebase Realtime Database |
| **서버 기능** | Vercel 서버리스 함수 (SMS 발송) |
| **배포** | Vercel (GitHub `main` 브랜치 push 시 자동 배포) |
| **빌드 도구** | 없음 (정적 파일) |

## 프론트엔드

### HTML5 / CSS3
- CSS 변수로 테마 관리, Flexbox/Grid 레이아웃, 미디어 쿼리 반응형
- 폰트: Pretendard
- 차트는 라이브러리 없이 CSS 막대와 인라인 SVG로 구현

### JavaScript (ES6+)
- **프레임워크 없음**: 순수 바닐라 JS, 전역 함수 기반
- **렌더링**: 템플릿 문자열을 `innerHTML`에 넣고 `onclick` 속성으로 이벤트 연결
- **입력값 출력**: 직접 입력받은 값은 `escapeHtml()`을 거쳐 화면에 넣음
- **캐시 버전**: `index.html`의 `?v=숫자`를 올려야 수정한 JS/CSS가 반영됨

## 백엔드

### Firebase Realtime Database
- **실시간 동기화**: `on('value')` 리스너
- **지역**: asia-southeast1 (싱가포르)
- **경로 구조**
  - `academiesByCode/{학원코드}` → 학원 ID 조회
  - `academies/{academyId}` → 학원별 데이터 전체
  - `appData` → 학원별 구조 이전의 레거시 데이터

### 보안 규칙
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
> 현재 공개 규칙입니다. 로그인은 앱 화면에서만 검사하고, 비밀번호·주민등록번호·계좌번호가 데이터베이스에 그대로 저장됩니다. Firebase Auth와 접근 규칙 도입이 필요합니다.

### Vercel 서버리스 함수
- `api/send-sms.js`: 알리고 SMS 발송
- 환경변수 `ALIGO_USER_ID`, `ALIGO_API_KEY`, `ALIGO_SENDER` (설정 방법은 `ALIGO_SETUP.md`)

## 데이터 저장

### 하이브리드 저장 전략
1. **localStorage**: 빠른 초기 로딩용 캐시
2. **Firebase**: 서버 영구 저장, 다중 기기 동기화

### 데이터 모델 (학원 1곳 기준)
```javascript
{
  profile: { academyId, academyCode, name, status },
  users: { [userId]: { role, loginId, password, staffId, phoneNumber, ... } },
  pendingStaffRequests: [{ id, name, loginId, phoneNumber, residentId, bankName, accountNumber, status }],
  businesses: [{ id, name }],

  // 시급제
  staff: [{ id, name, type, tier1Hours, tier1Rate, tier2Rate, roundingRule, businessId,
            hireDate, terminationDate, position, phoneNumber, residentId,
            bankName, accountNumber, accountHolder }],
  workLogs: [{ id, staffId, date, startTime, endTime, breakMinutes, hours }],
  workLogHistories: [...],

  // 4대보험
  insuranceTeachers: [{ id, name, monthlySalary, nonTaxableAmount, pensionBase, healthBase,
                        dependents, businessId, hireDate, terminationDate, position, residentId }],
  insuranceAbsences: [{ teacherId, monthKey, absentDays }],

  // 월급제 3.3%
  monthlyInstructors: [{ id, name, defaultGrossPay, businessId, hireDate, terminationDate, ... }],
  monthlyInstructorPayrolls: [{ instructorId, monthKey, grossPay, extraDeduction, memo }],

  // 비율제 · 특강
  commissionInstructors: [{ id, name, commissionRate, businessId, ... }],
  commissionStudents: [{ instructorId, monthKey, students: [{ name, tuition }] }],
  specialLectures: [{ id, name, instructorName, commissionRate, businessId, ... }],
  specialLectureStudents: [{ lectureId, monthKey, students }],

  messageLogs: [...],
  settings: {
    payrollRules: { minimumWage, assistantDeduction, instructorDeduction, cardFeeRate,
                    insuranceRates: { nationalPension, healthInsurance, longTermCare, employmentInsurance } },
    ui: {}
  }
}
```

## 급여 계산 규칙

### 4대보험 직원 (`calculateInsuranceDeduction`)
세무사 급여명세서와 같은 결과가 나오도록 맞춘 규칙입니다.

| 항목 | 기준 금액 | 요율 (기본값) |
|------|-----------|---------------|
| 국민연금 | 기준소득월액 (미입력 시 과세급여, 천원 미만 절사) | 4.75% |
| 건강보험 | 보수월액 (미입력 시 과세급여) | 3.595% |
| 장기요양 | 건강보험료 | 13.14% |
| 고용보험 | 과세급여 | 0.9% |
| 소득세 | 과세급여, 공제대상가족 수 | 간이세액 |
| 지방소득세 | 소득세 | 10% |

- 과세급여 = 월 급여 − 비과세(식대 등)
- 모든 항목 10원 미만 절사
- 국민연금·건강보험 기준 금액은 공단 신고 금액이라 급여가 같아도 사람마다 다를 수 있음

### 소득세 (`getIncomeTax`)
- 간이세액표를 통째로 넣지 않고 표를 만드는 공식(소득세법 시행령 별표2)으로 계산
- 2026년 9월 세무사 명세서 3건과 일치 확인. 월 500만원 이상 구간은 대조 자료 없음
- 8~20세 자녀 세액공제는 반영하지 않음

### 그 밖의 유형
- 시급제: 조교 고용보험 0.9%, 파트강사 사업소득세 3.3%
- 월급제 강사: 3.3% + 추가 공제
- 비율제·특강: 수강료 × 비율 → 카드수수료 1% → 3.3%

## 외부 의존성

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| Firebase App / Database | 10.7.1 (compat) | 데이터 저장과 동기화 |
| html2canvas | 1.4.1 | PDF용 화면 캡처 |
| jsPDF | 2.5.1 | PDF 생성 |
| SheetJS (xlsx) | 0.18.5 | Excel 읽기·내보내기 |
| Pretendard | 1.3.9 | 한글 폰트 |
| firebase-admin | 13.x | 마이그레이션 스크립트 전용 (Node) |

## 개발 환경

### 로컬 개발
```bash
# 별도 빌드 불필요. 로컬 서버로 실행
npx serve .

# 문법 검사
node --check js/app.js
```

### 배포
- GitHub `main`에 push하면 Vercel이 자동 배포
- 급여명세서 PDF 등 개인정보 파일은 저장소에 올리지 않음

## 아키텍처 결정 이유

- **바닐라 JavaScript**: 프레임워크 학습과 빌드 없이 유지보수
- **Firebase**: 별도 백엔드 없이 여러 기기 실시간 동기화
- **Vercel**: 정적 호스팅과 서버리스 함수(SMS)를 함께 제공

## 확장 고려사항

1. **인증 강화**: Firebase Auth 도입, 데이터베이스 접근 규칙, 비밀번호·주민등록번호 보호
2. **급여 확정 저장**: 월별 정산 결과를 저장해 계산식이 바뀌어도 과거 금액이 유지되도록
3. **계좌 정보 확대**: 월급제·비율제·4대보험 직원에도 급여 계좌 입력
4. **자동 테스트**: 급여 계산 함수 단위 테스트
