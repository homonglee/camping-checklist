# Camping Checklist v0.3.2

- 서비스: https://camping-checklist-three.vercel.app
- GitHub: https://github.com/homonglee/camping-checklist

캠핑 유형, 숙박 기간, 인원수에 따라 준비물을 추천하는 모바일 우선 MVP입니다.

## 구현 범위

- 캠핑 유형 5종: 백패킹, 오토캠핑, 차박캠핑, 카라반, 모터홈
- 10개 카테고리, 180개 Master 품목
- 유형별 필수/추천/선택/제외 규칙
- 숙박 기간·인원수 기반 수량 계산
- 카테고리 전체 선택 및 개별 ON/OFF
- 추천된 준비물을 모두 기본 선택하고 필요 없는 품목만 체크 해제
- 선택 품목 수, 카테고리 필터
- 각 카테고리 하단에서 해당 카테고리 준비물 바로 추가
- 수량·중요도·메모 수정 및 품목 삭제
- 체크리스트 이름 및 최근 목록 로컬 저장
- 선택한 항목만 PDF·XLSX 파일로 다운로드
- 하단 `체크리스트 저장` 버튼 바로 아래에서 PDF·XLSX 저장
- 모바일 브라우저 호환성을 위한 네이티브 Canvas PDF 렌더링
- 모바일·데스크톱 반응형 UI

## 실행

```bash
npm install
npm run dev
```

## 검증

```bash
npm test
npm run build
npm run test:e2e
```

E2E 테스트는 Chrome을 사용하며 생성 → 기본 전체 선택 확인 → 불필요 품목 체크 해제 → 10개 카테고리별 품목 추가 → PDF·XLSX 실제 다운로드 → 수정 → 저장 → 새로고침 복원과 390px/1280px 반응형을 검증합니다.

## 데이터 구조

각 Master 품목은 `id`, `name`, `category`, `quantityRule`, `relevance`를 가집니다. `relevance`에는 5개 캠핑 유형별 `required`, `recommended`, `optional`, `excluded` 상태가 저장됩니다. 생성된 체크 항목에는 `quantity`, `checked`, `memo`, `custom`이 추가됩니다.

수량 규칙은 다음 네 가지입니다.

- `fixed`: 여행당 1개
- `person`: 인원수만큼
- `day`: 일정 일수만큼
- `personDay`: 인원수 × 일정 일수
