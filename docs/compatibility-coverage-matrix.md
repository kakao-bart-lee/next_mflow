# 호환성 커버리지 매트릭스 (Compatibility Coverage Matrix)

> 생성일: 2026-03-08  
> 목적: PHP 원본 ↔ TS 구현 커버리지 현황 및 유지/폐기/보류 판단  
> 기준: T3 인벤토리(`table-code-inventory.md`) + `combinations.ts` + `tableCatalog.ts` + `legacyCompatibility/` 패밀리 모듈

---

## ⚠️ 중요 주의사항

> **`combinations.ts` 참조 ≠ 계산 로직 완료**  
> `combinations.ts`에 코드가 등록되어 있다는 것은 해당 PHP 파일이 어떤 테이블을 사용하는지 매핑한 것일 뿐,  
> 실제 PHP 계산 로직이 TypeScript로 포팅되었음을 의미하지 않습니다.  
> 실제 계산 완료 여부는 `tableCatalog.ts` 등록 여부 또는 `legacyCompatibility/` 패밀리 모듈 함수 존재로 판단합니다.

---

## 판단 기준

| 판단 | 의미 |
|------|------|
| **남길 것** | TS 구현 완료 또는 핵심 기능으로 유지 필요 |
| **보류** | combinations.ts 참조만 있고 실제 계산 미구현 — 우선순위 결정 필요 |
| **접을 것** | PHP에만 존재하고 TS 미참조 — 현재 서비스 범위 밖 |

---

## G 패밀리 — 궁합 (Compatibility)

| 코드 | 한글명 | PHP 존재 | TS 구현 | 상태 | 판단 | 근거 |
|------|--------|----------|---------|------|------|------|
| G001 | 결혼 후 사랑 흐름 | ✅ | `legacyTimingInsights.ts:buildLegacyMarriageFlowInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G003 | 궁합 기본 성향 | ✅ | `legacyBasicCompatibility.ts:buildLegacyBasicCompatibilityInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G004 | 미래 배우자 얼굴상 | ✅ | `legacyTimingInsights.ts:buildLegacyFutureSpouseInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G005 | 미래 배우자 성격상 | ✅ | `legacyTimingInsights.ts:buildLegacyFutureSpouseInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G006 | 미래 배우자 직업상 | ✅ | `legacyTimingInsights.ts:buildLegacyFutureSpouseInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G007 | 미래 배우자 연애타입 | ✅ | `legacyTimingInsights.ts:buildLegacyFutureSpouseInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G012 | 세부 궁합 분석 | ✅ | `legacyBasicCompatibility.ts:buildLegacyDetailedCompatibilityInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G016 | 속궁합 (섹스궁합) | ✅ | `legacySpouseInsights.ts:buildLegacyIntimacyInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G019 | 별자리 궁합 | ✅ | `legacyZodiacInsights.ts:buildLegacyZodiacCompatibilityInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G020 | 침실 섹스궁합 | ✅ | `legacySpouseInsights.ts:buildLegacyBedroomInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G022 | 정통궁합 (오행 곱셈) | ✅ | `legacyBasicCompatibility.ts:buildLegacyTraditionalCompatibilityInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G023 | 겉궁합 (오행 조합) | ✅ | `legacyBasicCompatibility.ts:buildLegacyOuterCompatibilityInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G024 | 운명 핵심 포인트 | ✅ | `legacySpouseInsights.ts:buildLegacyDestinyCoreInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G026 | 띠 궁합 (12×12 동물) | ❌ PHP 없음 | `legacyZodiacInsights.ts:buildLegacyAnimalCompatibilityInsight` | TS 역공학 구현 | **남길 것** | PHP 없음이나 TS에서 역공학 완성 |
| G028 | 사상체질 궁합 | ✅ | `legacyZodiacInsights.ts:buildLegacySasangCompatibilityInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G030 | 배우자성 핵심 구조 | ✅ | `legacySpouseInsights.ts:buildLegacySpouseCoreInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G031 | 배우자성·배우자궁 해설 | ✅ | `legacySpouseInsights.ts:buildLegacyPartnerRoleInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G032 | 이성의 성격 (연간 오행) | ✅ | `legacySpouseInsights.ts:buildLegacyPartnerPersonalityInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G033 | 혼인·연애 시기표 | ✅ | `legacyTimingInsights.ts:buildLegacyMarriageTimingTableInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| G034 | 인연 시기와 흐름 | ✅ | `legacyTimingInsights.ts:buildLegacyRelationshipTimingInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |

**G 패밀리 소계**: 20개 전체 남길 것 (PHP 없는 G026 포함)

---

## Y 패밀리 — 육임 (Yukim)

| 코드 | 한글명 | PHP 존재 | TS 구현 | 상태 | 판단 | 근거 |
|------|--------|----------|---------|------|------|------|
| Y001 | 연애 취약점과 요령 | ✅ | `legacyTimingInsights.ts:buildLegacyLoveWeakPointInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| Y003 | 그이의 러브스타일 | ✅ | `legacySpouseInsights.ts:buildLegacyLoveStyleInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| Y004 | 섹스 토정비결 (월별 섹스운) | ✅ | `legacyTimingInsights.ts:buildLegacyYearlyLoveCycleInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |

**Y 패밀리 소계**: 3개 전체 남길 것 (완전 커버)

---

## T 패밀리 — 수리/기타 (Numerology)

| 코드 | 한글명 | PHP 존재 | TS 구현 | 상태 | 판단 | 근거 |
|------|--------|----------|---------|------|------|------|
| T010 | 사주 타입 분석 | ✅ | `legacyBasicCompatibility.ts:buildLegacyTypeProfileInsight` | 구현됨 | **남길 것** | legacyCompatibility 완전 구현 |
| T013 | 태어난 계절 운세 | ✅ | `combinations.ts:saju_21` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| T022 | 성별 기반 운세 | ✅ | `combinations.ts:saju_21` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| T026 | 십이운성 기반 운세 | ✅ | `combinations.ts:saju_11,saju_14` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| T028 | 오행 일간 기반 운세 | ✅ | `combinations.ts:saju_2,saju_12` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| T035 | 일지 오행 기반 운세 | ✅ | `combinations.ts:saju_2` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| T039 | 나에게 맞는 숫자운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | tableCatalog 등록 = 서비스 활성 |
| T056 | 질병운 (일간+월지) | ✅ | `combinations.ts:saju_8` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| T057 | 질병운 (일간+일지) | ✅ | `combinations.ts:saju_8` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| T058 | 질병운 (월지) | ✅ | `combinations.ts:saju_8` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| T060 | 사주로 보는 심리분석 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | tableCatalog 등록 = 서비스 활성 |
| T061 | 기타 운세 보조 | ✅ | `combinations.ts:saju_2,saju_12` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| T017 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| T023 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| T024 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| T029 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| T034 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| T042 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| T043 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| T046 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| T048 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| T052 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| T053 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |

**T 패밀리 소계**: 남길 것 3 / 보류 8 / 접을 것 11 (총 22개)

---

## S 패밀리 — 사주 (Saju)

| 코드 | 한글명 | PHP 존재 | TS 구현 | 상태 | 판단 | 근거 |
|------|--------|----------|---------|------|------|------|
| S007 | 현재의 길흉사 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S008 | 미래운세 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S009 | 기타운세1 / 갈등운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S010 | 기타운세2 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S014 | 현재운세 / 현재나의운 분석 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S015 | 직업 방향 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S018 | 초년운 (당사주) | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S019 | 중년운 (당사주) | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S020 | 말년운 (당사주) | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S021 | 수명운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S022 | 자평명리학 기본 | ✅ | `combinations.ts:saju_3` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S023 | 성격 핵심 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S026 | 용신 기반 십성운 | ✅ | `combinations.ts:saju_2,saju_15` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S027 | 재물운 (월지 십성) | ✅ | `combinations.ts:saju_3,saju_19` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S028 | 인간관계 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S029 | 일간 배열 기반 운세 | ✅ | `combinations.ts:saju_15,saju_18,saju_20` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S030 | 일지 십성 기반 운세 | ✅ | `combinations.ts:saju_15,saju_18,saju_20` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S031 | 협력운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S040 | 화합운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S042 | 월별 운세 | ✅ | `combinations.ts:saju_1,saju_2,saju_16,saju_19` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S045 | 초년운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S046 | 중년운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S047 | 말년운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S048 | 타고난 성격 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S049 | 사회성 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S050 | 목표의식 / 적성 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S051 | 건강운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S052 | 직업운 (시지 기반) | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S053 | 연애운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S054 | 섹스운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S055 | 궁합 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S056 | 부부궁 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S057 | 금전운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S058 | 가정운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S059 | 자식운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S060 | 학업운 (별자리 기반) | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S061 | 천생연분 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S062 | 보조설명1 (월지 번호) | ❌ PHP 없음 | `calculatorFactory.ts:S062` | TS에만 존재 | **남길 것** | TS 자체 구현 |
| S063 | 총평 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S064 | 건강운 (자평명리학) | ✅ | `combinations.ts:saju_3` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S065 | 자평명리학 보조 | ✅ | `combinations.ts:saju_3` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S066 | 자평명리학 보조2 | ✅ | `combinations.ts:saju_3` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S067 | 시기별 운세 | ✅ | `combinations.ts:saju_3` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S068 | 자평명리학 보조3 | ✅ | `combinations.ts:saju_3` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S070 | 계절운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S071 | 오행운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S072 | 음양운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S073 | 십성운1 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S074 | 십성운2 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S077 | 오행기운세 기본 | ✅ | `combinations.ts:saju_9` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S078 | 사교운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S079 | 일간 기반 오행운1 | ✅ | `combinations.ts:saju_9` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S080 | 일간 기반 오행운2 | ✅ | `combinations.ts:saju_9` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S081 | 성별 오행운 | ✅ | `combinations.ts:saju_9` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S082 | 일간 기반 재물운 | ✅ | `combinations.ts` 다수 | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S083 | 일간 기반 건강운 | ✅ | `combinations.ts:saju_9,saju_16,saju_17` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S084 | 일간 기반 운세4 | ✅ | `combinations.ts:saju_9` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S085 | 선천적 기질 (성별) | ✅ | `combinations.ts:saju_9,saju_20` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S087 | 오늘의 운세 1 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S088 | 오늘의 운세 2 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S089 | 오늘의 운세 3 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S090 | 오늘의 운세 4 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S091 | 오늘의 운세 5 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S092 | 오늘의 운세 6 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S095 | 새해신수 일간 기반1 | ✅ | `combinations.ts:saju_2` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S097 | 새해신수 일간 기반2 | ✅ | `combinations.ts:saju_2` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S098 | 새해신수 일간 기반3 | ✅ | `combinations.ts:saju_2` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S099 | 새해신수 일간 기반4 | ✅ | `combinations.ts:saju_2` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S100 | 새해신수 일간 기반5 | ✅ | `combinations.ts:saju_2` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S101 | 새해신수 월별 운세 | ✅ | `combinations.ts:saju_2` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S103 | 새해신수 기본1 | ✅ | `combinations.ts:saju_2` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S104 | 새해신수 기본2 | ✅ | `combinations.ts:saju_2` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S106 | 토정비결 기본1 | ✅ | `combinations.ts:saju_1` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S107 | 토정비결 기본2 | ✅ | `combinations.ts:saju_1` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S108 | 토정비결 기본3 | ✅ | `combinations.ts:saju_1` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S109 | 토정비결 기본4 | ✅ | `combinations.ts:saju_1` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S110 | 토정비결 기본5 | ✅ | `combinations.ts:saju_1` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S113 | 기본운세 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S116 | 재물처방1 | ✅ | `combinations.ts` 다수 | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S117 | 재물처방2 | ✅ | `combinations.ts` 다수 | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S118 | 재물처방3 | ✅ | `combinations.ts` 다수 | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S119 | 월간 기반 운세 | ✅ | `combinations.ts:saju_15` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S121 | 오늘의 운세 보조 | ✅ | `combinations.ts:saju_2` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S126 | 살풀이 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S128 | 당사주 평생총운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S129 | 전생 해석 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S130 | 당사주 초년운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S131 | 당사주 중년운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S132 | 당사주 말년운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S133 | 당사주 배우자운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S134 | 당사주 자식운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S135 | 당사주 형제운 | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| S142 | 토정비결 연지 기반1 | ✅ | `combinations.ts:saju_1` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S143 | 토정비결 연지 기반2 | ✅ | `combinations.ts:saju_1` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S144 | 새해신수 보조 | ✅ | `combinations.ts:saju_2` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S145 | 월간 기반 운세2 | ✅ | `combinations.ts:saju_15` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S146 | 월간 기반 운세3 | ✅ | `combinations.ts:saju_15` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| S002 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| S005 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| S006 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| S013 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| S016 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| S024 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| S033 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| S034 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| S035 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| S036 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| S037 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| S111 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| S112 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| S122 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| S124 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |

**S 패밀리 소계**: 남길 것 ~43 / 보류 ~37 / 접을 것 ~15 (총 ~95개)

---

## F 패밀리 — 주역괘 (Hexagram)

| 코드 | 한글명 | PHP 존재 | TS 구현 | 상태 | 판단 | 근거 |
|------|--------|----------|---------|------|------|------|
| F011 | 주역괘 (일지 기반) | ✅ | `tableCatalog.ts` 등록 | tableCatalog 등록됨 | **남길 것** | 서비스 활성 |
| F007 | 페이지 기반 꿈 해몽 | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| F012 | 주역괘 (월지 기반) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| F013 | 주역괘 (성별 기반) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| F019 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| F020 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| F022 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| F024 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| F029 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| F033 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| F034 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |

**F 패밀리 소계**: 남길 것 1 / 접을 것 10 (총 11개)

---

## J 패밀리 — 참조/보조 (Reference)

| 코드 | 한글명 | PHP 존재 | TS 구현 | 상태 | 판단 | 근거 |
|------|--------|----------|---------|------|------|------|
| J004 | 오늘 일지 기반 보조1 | ✅ | `combinations.ts:saju_16,saju_17` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| J005 | 오늘 일지 기반 보조2 | ✅ | `combinations.ts:saju_1,saju_8,saju_16` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| J009 | 오늘 일지 기반 보조3 | ✅ | `combinations.ts:saju_2,saju_12` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| J010 | 오늘 일지 기반 보조4 | ✅ | `combinations.ts:saju_15` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| J023 | 십이운성 건록 기반 | ✅ | `combinations.ts:saju_15` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| J037 | 점수 기반 보조 해설 | ✅ | `combinations.ts:saju_1,saju_8,saju_16` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| J044 | 점수 기반 보조 해설2 | ✅ | `combinations.ts:saju_15` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| J047 | 새해신수 보조1 | ✅ | `combinations.ts:saju_2` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| J048 | 새해신수 보조2 | ✅ | `combinations.ts:saju_2` | combinations 참조만 | **보류** | 계산 로직 미포팅 |
| J006 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J015 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J017 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J018 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J019 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J020 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J021 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J022 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J024 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J025 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J026 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J027 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J028 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J029 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J030 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J033 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J036 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J038 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J039 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J040 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J041 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J042 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J043 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J045 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J049 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J050 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J051 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |
| J052 | (미확인) | ✅ | TS 미참조 | 미구현 | **접을 것** | TS 전혀 미참조 |

**J 패밀리 소계**: 보류 9 / 접을 것 28 (총 37개)

---

## 요약 통계 (Summary Stats)

| 패밀리 | 전체 코드 수 | 남길 것 | 보류 | 접을 것 |
|--------|------------|---------|------|---------|
| G | 20 | 20 | 0 | 0 |
| Y | 3 | 3 | 0 | 0 |
| T | 23 | 3 | 9 | 11 |
| S | ~95 | ~43 | ~37 | ~15 |
| F | 11 | 1 | 0 | 10 |
| J | 37 | 0 | 9 | 28 |
| **합계** | **~189** | **~70** | **~55** | **~64** |

### 판단별 비율

- **남길 것**: ~37% — 현재 서비스에서 활성 사용 중
- **보류**: ~29% — combinations.ts 참조 있으나 계산 로직 미포팅 (우선순위 결정 필요)
- **접을 것**: ~34% — PHP에만 존재, TS 미참조 (현재 서비스 범위 밖)

### 구현 완료 기준

| 기준 | 의미 |
|------|------|
| `tableCatalog.ts` 등록 | 서비스에서 실제 사용 중 (남길 것) |
| `legacyCompatibility/` 패밀리 모듈 함수 | 계산 로직 완전 포팅 (남길 것) |
| `combinations.ts` 참조만 | 매핑만 있고 계산 미완성 (보류) |
| TS 미참조 | 현재 서비스 범위 밖 (접을 것) |

---

## 특이사항

1. **G026**: PHP 파일 없음. TS에서 역공학으로 구현 (`// PROVENANCE: No PHP source file found`)
2. **S062**: PHP 파일 없음. `calculatorFactory.ts`에만 존재 (보조설명1, 월지 번호 기반)
3. **N 패밀리**: 작명(이름 짓기) 기능 전체가 TS에 미구현 — 이 매트릭스 범위 밖 (접을 것)
4. **F 패밀리**: F011(주역괘)만 TS 구현, 나머지 10개 PHP 코드 미구현
5. **J 패밀리**: 38개 중 9개만 TS combinations에 참조됨 (실제 계산 로직은 별도 포팅 필요)
6. **보류 코드 포팅 우선순위**: 사용자 노출 빈도 높은 S 패밀리 (토정비결, 새해신수) 우선 검토 권장
