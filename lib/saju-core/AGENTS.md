# SAJU-CORE MODULE

Korean Saju (사주, Four Pillars of Destiny) calculation engine. TypeScript port of legacy PHP system.

## OVERVIEW

Calculates 사주팔자 (Four Pillars) from birth date/time, performs 십신/신약신강/대운 analysis, and generates fortune interpretations.

## STRUCTURE

```
saju-core/
├── index.ts              # Exports: constants, models, facade
├── facade.ts             # FortuneTellerService (main API, 534 lines)
├── utils.ts              # extractHanja(), extractKorean()
├── models/               # Zod schemas + TypeScript types
│   ├── fortuneTeller.ts  # FortuneRequest, Pillar, SajuData, FortuneResponse
│   ├── sajuFortuneTypes.ts # 21 fortune type enum
│   └── dataTypes.ts      # Database record types
├── saju/                 # Calculation modules (8,500+ lines)
│   ├── calculator.ts     # FourPillarsCalculator (core engine)
│   ├── sipsin.ts         # 십신 (Ten Spirits) + 대운 (Great Fortune)
│   ├── sinyakSingang.ts  # 신약신강 (day stem strength)
│   ├── lifecycleStage.ts # 십이운성 (12 lifecycle stages)
│   ├── jijanggan.ts      # 지장간 (hidden stems)
│   ├── hyungchung.ts     # 형충파해 (conflicts/clashes)
│   ├── gunghap.ts        # 궁합 (compatibility)
│   ├── interpreters.ts   # Theme-based interpretation
│   ├── constants.ts      # Stems, branches, sipsin mappings
│   ├── combinations.ts   # Fortune type → table mapping
│   ├── dataLoader.ts     # JSON data loader (singleton)
│   └── twelveSinsal/     # 신살 (spiritual influences)
├── yukim/                # 육임 divination methods
└── data/                 # JSON lookup tables (~61MB)
    ├── mansedata.json    # 만세력 calendar (17MB)
    ├── s_tables.json     # Fortune interpretations (10MB)
    └── *.json            # Various lookup tables
```

## WHERE TO LOOK

| Task | Location | Key Function |
|------|----------|--------------|
| Calculate saju | `facade.ts:107` | `FortuneTellerService.calculateSaju()` |
| Get fortune interpretation | `facade.ts:433` | `FortuneTellerService.getSajuFortune()` |
| Four pillars logic | `calculator.ts:206` | `FourPillarsCalculator.calculateFourPillars()` |
| Ten spirits | `sipsin.ts` | `SipsinCalculator.analyzeSipsin()` |
| Great fortune (대운) | `sipsin.ts` | `calculateGreatFortune()` |
| Strength analysis | `sinyakSingang.ts` | `SinyakSingangAnalyzer.analyzeSinyakSingang()` |
| Compatibility | `gunghap.ts` | `GunghapAnalyzer.analyzeCompatibility()` |
| Add fortune type | `combinations.ts` + `sajuFortuneTypes.ts` | Add to enum + mapping |
| Modify interpretations | `interpretationData.ts` | `INTERPRETATION_DATA` |
| Add sinsal calculation | `twelveSinsal/` | Add mapping + calculator |

## CODE MAP

| Symbol | Type | Lines | Role |
|--------|------|-------|------|
| `FortuneTellerService` | Class | 534 | Main API facade, orchestrates calculators |
| `FourPillarsCalculator` | Class | 709 | Core 사주 calculation from birth date |
| `SipsinCalculator` | Class | 671 | 십신 analysis + 대운 calculation |
| `GunghapAnalyzer` | Class | 693 | Compatibility scoring |
| `SinyakSingangAnalyzer` | Class | 441 | Day stem strength analysis |
| `LifecycleStageCalculator` | Class | 357 | 십이운성 calculation |
| `ThemeInterpreterManager` | Class | 637 | Fortune interpretation by theme |
| `getDataLoader()` | Function | - | Singleton data loader |

## CONVENTIONS

### Domain Terminology (Korean)
- 천간 (Heavenly Stems): 갑을병정무기경신임계
- 지지 (Earthly Branches): 자축인묘진사오미신유술해
- 오행 (Five Elements): 목화토금수
- 십신 (Ten Spirits): 비견, 겁재, 식신, 상관, 편재, 정재, 편관, 정관, 편인, 정인
- 십이운성 (12 Stages): 장생, 목욕, 관대, 건록, 제왕, 쇠, 병, 사, 묘, 절, 태, 양

### Data Flow
```
FortuneRequest → FortuneTellerService.calculateSaju()
    → FourPillarsCalculator (pillars)
    → SipsinCalculator (십신)
    → SinyakSingangAnalyzer (strength)
    → LifecycleStageCalculator (운성)
    → calculateComprehensiveSinsal() (신살)
    → calculateHyungchung() (형충)
→ FortuneResponse
```

### Zod Patterns
- Schema in `models/fortuneTeller.ts`, types via `z.infer<>`
- Korean property names: `천간`, `지지`, `오행`, `십이운성`, `지장간`
- Validation functions: `validateFortuneRequest()`, `validateFortuneResponse()`

### Lookup Tables
- Constants in `constants.ts`: `HEAVENLY_STEMS`, `SIPSIN_STEM_RELATIONS`
- JSON data via `getDataLoader().loadSTables()`
- Sinsal mappings in `twelveSinsal/mappings.ts`

## COMPLEXITY HOTSPOTS

| File | Lines | Risk | Notes |
|------|-------|------|-------|
| `calculator.ts` | 709 | HIGH | Many edge cases: midnight, jeolip, time correction |
| `sipsin.ts` | 671 | HIGH | 60-cycle tables, forward/backward direction |
| `facade.ts` | 534 | MEDIUM | God object risk, orchestrates 8+ calculators |
| `gunghap.ts` | 693 | MEDIUM | 7-dimension weighted compatibility scoring |

## ANTI-PATTERNS (THIS MODULE)

### Code Smells
1. **God object**: `FortuneTellerService` does too much (534 lines)
   - Consider: Split into SajuCalculationService + InterpretationService

2. **Large static data in TS**: `interpretationData.ts` (789 lines)
   - Consider: Move to JSON, load at runtime

3. **Singleton data loader**: May cause issues in serverless
   - Location: `dataLoader.ts`

### FORBIDDEN
- NEVER modify JSON data files directly (regenerate from source)
- NEVER hardcode time corrections (use `SOLAR_TIME_CORRECTIONS`)
- NEVER skip jeolip adjustment for date calculations

## NOTES

### Data Files (~61MB total)
Files are large; avoid importing entire dataset. Use `getDataLoader()` for lazy loading.

### Adding New Fortune Type
1. Add to `SajuFortuneType` enum in `models/sajuFortuneTypes.ts`
2. Add table mapping in `combinations.ts` (`SAJU_COMBINATIONS`)
3. If new calculation needed, create calculator and register in facade

### Time Correction
- `SOLAR_TIME_CORRECTIONS` in `calculator.ts:25-34` defines city offsets
- `applyLocationCorrection()` handles longitude-based time adjustment
- Midnight (자시) handling in `applyMidnightAdjustment()`
