# 프로젝트: 여름고소아 (Summer-Gosoa) 작업 지시서

## 1. 프로젝트 개요

- 고양 소노 스카이거너스 팬들을 위한 비시즌 경기 아카이빙 서비스.
- 사용자가 명경기를 추천하고, 각 경기 및 코멘트(추천 이유)에 좋아요를 누르는 기능.

## 2. 초기 세팅 현황

- 폰트: `src/assets/fonts`에 KBL 폰트 배치 완료, `layout.tsx`에 변수 설정됨.
- 데이터: `src/constants/schedule.ts`에 25-26 시즌 전체 경기 데이터 구비됨.
- DB: Supabase `games`, `reasons` 테이블 생성 완료.
- Env: `.env.local` 설정 완료.
- Client: `src/lib/supabase.ts`에 초기화 완료.

## 3. 구현 요구사항

### A. 스타일 시스템

- Tailwind config에 `font-court`, `font-jump` 테마를 `layout.tsx`의 CSS 변수와 연결하세요.
- 브랜드 컬러: `#72A3CC` (소노 스카이블루)를 기본으로 사용하세요. 모달 제외 모든 배경색을 브랜드 컬러로 사용하세요.
- 포인트 컬러: `#213D65`를 강조색으로 사용하세요.

### B. 로직 구현 (src/services/gameService.ts)

- `getGamesWithTopReason()`: 경기 목록과 각 경기의 좋아요 1등 코멘트 fetch.
- `addGameWithReason(date, content)`: yymmdd 날짜로 중복 체크 후 Upsert 처리.
- `updateLike(reasonId, currentLikes)`: 좋아요 낙관적 업데이트(Optimistic Update) 대응용 함수.

### C. 핵심 컴포넌트

1. **GameSearchInput**:

   - `yymmdd` 형식 입력 시 미리 정의된 경기 일정 데이터와 매칭하여 자동완성.
   - 선택 시 `홈팀 name 점수 : 어웨이팀 name 점수` 형태로 요약 표시하고(e.g. 소노 98 : 정관장 95), 텍스트 스타일링으로 결과 강조(승팀 볼드 처리, 패팀 회색).

2. **GameCard (Main List Item)**:

   - 전체적인 무드는 깔끔한 와이어프레임 스타일.
   - [날짜(mmdd 형식) + 결과아이콘 + 도시] | [좋아요 1등 코멘트 (truncate)] | [유니폼 좋아요 배지(해당 경기를 추천하는 좋아요 버튼)] [더보기 버튼] 순서로 배치된 가로형 리스트 아이템.
   - 경기장이 '고양'일 경우 텍스트를 볼드 처리하고 포인트 컬러(#213D65) 적용.
   - 좋아요 배지는 유니폼 아이콘 중앙에 숫자가 백넘버처럼 들어가는 디자인. (추후 제공할 SVG 사용) 1k 이상 포맷팅 적용.

3. **CommentModal**:
   - 특정 경기 클릭/더보기 클릭 시 노출.
   - 해당 경기에 등록된 모든 추천 이유를 '좋아요순'으로 나열.
   - 각 코멘트 옆에도 작은 좋아요 버튼 배치.

## 4. 디자인 가이드

- 최대한 간결한 '와이어프레임' 스타일을 유지하되, 소노의 스포티한 감성을 살릴 것.
- 숫자가 1000 이상일 경우 `1.1k` 포맷팅 적용 로직 포함.
