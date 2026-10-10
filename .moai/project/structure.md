# 프로젝트 구조

## 디렉토리 트리

```
급여관리/
├── index.html              # 메인 진입점 (로그인 화면, 앱 골격, 스크립트 로드)
├── css/
│   └── style.css           # 전체 스타일링 (약 1,240줄)
├── js/
│   ├── app.js              # 화면 렌더링과 이벤트 처리 (약 6,350줄)
│   ├── data.js             # 데이터 관리 & Firebase 연동 (약 1,680줄)
│   ├── utils.js            # 계산·포맷 유틸리티 (약 850줄)
│   ├── pdf-generator.js    # 급여명세서 PDF 생성 (약 720줄)
│   ├── pdf-export.js       # PDF 내보내기 보조
│   ├── nanum-gothic-font.js# PDF용 한글 폰트
│   └── firebase-config.js  # Firebase 설정
├── api/
│   └── send-sms.js         # 알리고 SMS 발송 (Vercel 서버리스 함수)
├── scripts/                # 레거시 → 학원별 구조 마이그레이션 도구 (Node)
│   ├── backup-legacy-data.js
│   ├── migrate-legacy-to-academy.js
│   ├── verify-migration.js
│   └── lib/                # firebase-admin, 마이그레이션·급여 계산 유틸
├── backups/                # 데이터 백업 JSON
├── package.json            # 마이그레이션 도구용 (firebase-admin)
├── ALIGO_SETUP.md          # SMS 발송 환경변수 안내
├── MIGRATION_PLAN.md       # 학원별 구조 전환 계획
├── SCRIPT_DESIGN.md        # 마이그레이션 스크립트 설계
├── PLAN.md                 # 비율제 강사 기능 초기 계획
├── .moai/                  # MoAI-ADK 설정과 프로젝트 문서
├── .claude/                # Claude Code 설정
└── .github/                # GitHub 워크플로우
```

## 주요 파일 설명

### index.html
- 로그인 화면(관리자/직원, 비밀번호 찾기), 메인 앱, 모달 구조 정의
- 외부 라이브러리와 JS 파일 로드 순서 관리
- `?v=숫자` 캐시 버전: JS/CSS를 수정하면 이 숫자를 올려야 브라우저에 반영됨

### js/app.js (화면 로직)
- **관리자 탭**: 대시보드, 직원관리, 4대보험, 비율제강사, 월급제강사, 특강관리, 근무기록, 급여정산, 문자생성, 설정
- **직원 탭**: 내 근무기록, 출퇴근 기록, 내 정보(급여 계좌·비밀번호)
- **공통 조각**
  - 재직/퇴사 보기 (`getEmploymentViewList`, `renderEmploymentViewChips`)
  - 급여 계좌 입력·표시 (`getBankAccountFieldsHTML`, `bankAccountCellHTML`)
  - 급여 통합 행 (`buildPayrollRows`): 대시보드·급여정산·Excel이 같은 데이터를 사용
  - 월별 비교와 변동 분석 (`buildMonthlyComparison`, `renderPayChangeAnalysisHTML`)
  - 월급 미입력 경고와 한번에 입력 (`getPendingMonthlyInstructors`, `openBulkMonthlyInstructorPayrollModal`)

### js/data.js (데이터 레이어)
- **학원별 데이터 모드**: `academies/{academyId}` 경로 사용, 로그인 시 전환
- **계정**: 학원 관리자 가입, 직원 가입 신청·승인, 로그인, 비밀번호 찾기
- **CRUD**: 사업장, 시급제 직원, 근무기록(수정 이력), 비율제 강사·학생, 월급제 강사·월별 급여, 4대보험 직원·결근, 특강·학생
- **데이터 호환성**: 새 필드가 없는 기존 데이터에 기본값 채우기 (`ensureDataCompatibility`)
- **내보내기/가져오기**: JSON, Excel

### js/utils.js (계산)
- **상수**: 최저시급, 4대보험 기본 요율, 은행 목록
- **급여 계산**: 시급제, 비율제, 특강, 월급제 3.3%
- **4대보험 계산**: `calculateInsuranceDeduction` (비과세·기준소득월액·10원 절사), `getIncomeTax` (간이세액 공식)
- **포맷팅과 파일 처리**: 금액·날짜, CSV/Excel 학생 명단 파싱, 문자 문구 생성

### js/pdf-generator.js
- 유형별 급여명세서 PDF (시급제, 비율제, 4대보험, 월급제 강사, 특강)

### api/send-sms.js
- 알리고 API 호출. 인증 정보는 Vercel 환경변수에서만 읽음

### css/style.css
- CSS 변수로 테마 관리, 반응형 레이아웃, 컴포넌트별 스타일

## 모듈 구성

```
index.html
   │  (로드 순서)
   ├─ utils.js            계산·포맷 (다른 파일에 의존하지 않음)
   ├─ firebase-config.js  Firebase 초기화
   ├─ data.js             데이터 관리 & 동기화  ← utils.js
   ├─ pdf-generator.js    PDF 생성            ← utils.js, data.js
   └─ app.js              화면 렌더링          ← 위 전부

app.js ──(문자 발송)──▶ /api/send-sms ──▶ 알리고
```

## 데이터 흐름

1. **로그인**: 학원코드로 학원을 찾고 해당 학원 데이터를 불러옴
2. **Firebase 동기화**: `on('value')` 리스너로 다른 기기의 변경을 실시간 반영
3. **사용자 액션**: UI 이벤트 → data.js 함수 호출
4. **저장**: localStorage 캐시 + Firebase 동시 저장
5. **화면 갱신**: 저장 후 `renderContent()`로 현재 탭을 다시 그림

급여 금액은 저장하지 않고 화면을 그릴 때마다 현재 설정과 계산식으로 다시 계산합니다. 따라서 요율이나 계산식을 바꾸면 지난 달 금액 표시도 함께 바뀝니다.
