
## [2026-03-08] Task 7: sipsin extraction 구현

- `find_yong()` Phase 1의 `paljayuk[0..6]`, `paljayuk1[0..4]`를 순수 함수로 분리 포팅했다.
- 원문 PHP를 그대로 반영해 `timegan`도 `type=12` 경로(지지 십성 테이블)로 계산했으며, 이 경우 TS 매핑에서는 빈 문자열이 나올 수 있음을 확인했다.
- 카운트 로직은 `inn/bi/sh/ja/kw`를 각각 2개 십성군 합산으로 구현했고, 샘플 입력(甲子년 丙寅월 甲子일 甲子시)에서 `inn=2` 검증됨.

## [2026-03-08] Task 8: find_yong Phase 2 구현

- `determineHyung(monthBranchSipsin, dayBranchSipsin)`을 5×5 그룹 산식(`monthGroup * 5 + dayGroup + 1`)으로 구현해 1..25 전 케이스를 안정적으로 생성했다.
- PHP `switch($hyung)` case 1..25를 TypeScript로 이식하면서 각 case마다 `break`를 추가해 원본 fall-through 버그를 제거했다.
- `deriveFullRoles(Y, H)`는 PHP의 `ssin[2..4]` 계산식(`Y+3`, `H+3`, 잔여코드) 기반으로 코드/역할명을 생성했다.
- `findYong()` 메인 파이프라인(`extract → count → hyung → Y/H → full roles`)을 export했고, `yongToSipsin`, `yongChungan`은 기존 `yongsinFlows` 함수를 재사용했다.
- 교차검증 샘플에서 usefulCode 불일치 케이스가 확인되어 `.sisyphus/evidence/task-8-findyong-crossval.txt`에 기록했다(데이터/기존 로직 수정 없이 보고만).
