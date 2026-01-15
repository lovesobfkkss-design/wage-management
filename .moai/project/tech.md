# 기술 스택

## 개요

| 구분 | 기술 |
|------|------|
| **프론트엔드** | HTML5, CSS3, Vanilla JavaScript |
| **백엔드** | Firebase Realtime Database |
| **배포** | Vercel (정적 호스팅) |
| **빌드 도구** | 없음 (정적 파일) |

## 프론트엔드

### HTML5
- 시맨틱 마크업
- 폼 요소 활용

### CSS3
- CSS 변수로 테마 관리
- Flexbox/Grid 레이아웃
- 반응형 디자인 (미디어 쿼리)
- 폰트: Pretendard (한글 최적화)

### JavaScript (ES6+)
- **프레임워크 없음**: 순수 바닐라 JS
- **모듈 패턴**: 파일별 책임 분리
- **DOM 조작**: innerHTML, 이벤트 리스너
- **비동기 처리**: Promise, async/await

## 백엔드 (Firebase)

### Firebase Realtime Database
- **실시간 동기화**: `on('value')` 리스너
- **데이터 구조**: JSON 트리
- **지역**: asia-southeast1 (싱가포르)

### 보안 규칙
```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```
> 현재 개발용 공개 규칙. 프로덕션에서는 인증 추가 필요

## 데이터 저장

### 하이브리드 저장 전략
1. **localStorage**: 빠른 초기 로딩, 오프라인 지원
2. **Firebase**: 서버 영구 저장, 다중 기기 동기화

### 데이터 모델
```javascript
{
  businesses: [{ id, name }],
  staff: [{ id, name, type, hourlyRate, ... }],
  workLogs: [{ id, staffId, date, startTime, endTime, ... }],
  commissionInstructors: [{ id, name, commissionRate, ... }],
  commissionStudents: [{ instructorId, monthKey, students }],
  settings: { minimumWage, assistantDeduction, ... }
}
```

## 외부 의존성

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| Firebase App | 10.7.1 (compat) | 앱 초기화 |
| Firebase Database | 10.7.1 (compat) | 실시간 DB |
| Pretendard | 1.3.9 | 한글 폰트 |

## 개발 환경

### 요구사항
- 최신 웹 브라우저 (Chrome, Edge, Safari, Firefox)
- 인터넷 연결 (Firebase 동기화용)

### 로컬 개발
```bash
# 별도 빌드 불필요
# index.html을 브라우저에서 직접 열기
# 또는 로컬 서버 실행
npx serve .
```

### 배포
- Vercel에 GitHub 저장소 연결
- push 시 자동 배포
- 정적 파일이므로 별도 빌드 설정 불필요

## 아키텍처 결정 이유

### 왜 바닐라 JavaScript인가?
- **단순성**: 프레임워크 학습 불필요
- **빠른 로딩**: 번들 크기 최소화
- **유지보수**: 의존성 최소화

### 왜 Firebase인가?
- **서버리스**: 별도 백엔드 구축 불필요
- **실시간 동기화**: 여러 기기에서 동시 사용
- **무료 티어**: 소규모 사용에 적합

### 왜 Vercel인가?
- **무료**: 정적 사이트 무료 호스팅
- **자동 배포**: GitHub 연동으로 CI/CD
- **빠른 CDN**: 전 세계 엣지 서버

## 확장 고려사항

### 추후 개선 가능 영역
1. **인증 강화**: Firebase Auth 도입
2. **PWA**: 오프라인 완전 지원
3. **알림**: 푸시 알림 (FCM)
4. **리포트**: 월별/연별 통계 차트
