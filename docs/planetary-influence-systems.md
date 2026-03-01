# 점성술 행성 영향력 계산 체계

> 사주 + 점성술 융합 서비스에서 행성 크기/영향력 시각화에 활용하기 위한 조사 자료.
> 작성일: 2026-03-02

---

## 1. Shadbala (षड्बल) — 베딕/Jyotish 체계

가장 정교한 수치 시스템. **6가지 힘의 합산**으로 각 행성에 Virupa(60 Virupa = 1 Rupa) 단위 점수를 부여한다.

### 1.1 6가지 구성 요소

| 구성 요소 | 내용 | 최대값 |
|-----------|------|--------|
| **Sthana Bala** (위치 강도) | 고양/자기 궁/우호 궁 여부 | ~200 Virupa |
| **Dig Bala** (방향 강도) | 어떤 하우스에 있는가 | 60 Virupa |
| **Kala Bala** (시간 강도) | 낮/밤, 월상, 요일/시간 주인 | ~150 Virupa |
| **Cheshta Bala** (운동 강도) | 역행/직행 속도 | 60 Virupa |
| **Naisargika Bala** (자연 강도) | 행성 고유의 고정값 | 60 Virupa |
| **Drik Bala** (시선 강도) | 다른 행성의 길/흉 aspect | ±60 Virupa |

### 1.2 각 행성의 최소 요구 강도

| 행성 | 필요 Rupa | Virupa |
|------|----------|--------|
| Sun | 6.5 | 390 |
| Moon | 6.0 | 360 |
| Mercury | 7.0 | 420 |
| Venus | 5.5 | 330 |
| Mars | 5.0 | 300 |
| Jupiter | 6.5 | 390 |
| Saturn | 5.0 | 300 |

### 1.3 Naisargika Bala (자연 고유 강도)

출생차트와 무관한 **고정 순위**:

> Sun > Moon > Venus > Jupiter > Mercury > Mars > Saturn

60 Virupa 기준 균등 분배:

| 행성 | 고정 점수 |
|------|----------|
| Sun | 60.00 |
| Moon | 51.43 |
| Venus | 42.86 |
| Jupiter | 34.29 |
| Mercury | 25.71 |
| Mars | 17.14 |
| Saturn | 8.57 |

### 1.4 Sthana Bala 하위 공식

#### Uchcha Bala (고양 강도)

```
Uchcha Bala = (180 - |행성 위치 - 감쇠점|) / 3
최대: 60 Virupa (행성이 고양점에 있을 때)
최소: 0 Virupa (행성이 감쇠점에 있을 때)
```

행성별 고양/감쇠 도수:

| 행성 | 고양점 (Exaltation) | 감쇠점 (Debilitation) |
|------|--------------------|--------------------|
| Sun | Aries 10° | Libra 10° |
| Moon | Taurus 3° | Scorpio 3° |
| Mercury | Virgo 15° | Pisces 15° |
| Venus | Pisces 27° | Virgo 27° |
| Mars | Capricorn 28° | Cancer 28° |
| Jupiter | Cancer 5° | Capricorn 5° |
| Saturn | Libra 20° | Aries 20° |

#### Saptavargaja Bala (7 Varga 배치)

| 배치 | Virupa |
|------|--------|
| Moolatrikona | 45 |
| Own Sign | 30 |
| 극친구 (Adhi Mitra) | 20 |
| 친구 (Mitra) | 15 |
| 중립 (Sama) | 10 |
| 적 (Satru) | 4 |
| 극적 (Adhi Satru) | 2 |

이론적 최대: 315 Virupa (7 Varga 모두 Moolatrikona)

#### Ojhajugmariamsa Bala

- 여성 행성 (Moon, Venus) → 짝수 궁: 15 Virupa
- 남성/중성 행성 → 홀수 궁: 15 Virupa
- Rasi + Navamsa 각각 적용 → 최대 30 Virupa

#### Kendradi Bala

| 하우스 유형 | 하우스 | Virupa |
|------------|--------|--------|
| Kendra (각) | 1, 4, 7, 10 | 60 |
| Panaphara (후속) | 2, 5, 8, 11 | 30 |
| Apoklima (이탈) | 3, 6, 9, 12 | 15 |

#### Drekkana Bala

| 도수 범위 | Sun/Mars/Jupiter | Moon/Venus | Mercury/Saturn |
|----------|------------------|-----------|----------------|
| 0°–10° | 15 | 0 | 0 |
| 10°–20° | 0 | 15 | 0 |
| 20°–30° | 0 | 0 | 15 |

### 1.5 Dig Bala (방향 강도)

```
Dig Bala = (행성 위치 - 최소 강도점 사이 각도) / 3
범위: 0~60 Virupa
```

| 행성 | 최대 강도 하우스 | 최소 강도 하우스 |
|------|----------------|----------------|
| Sun, Mars | 10th (Meridian) | 4th (Nadir) |
| Mercury, Jupiter | 1st (Ascendant) | 7th (Descendant) |
| Moon, Venus | 4th (Nadir) | 10th (Meridian) |
| Saturn | 7th (Descendant) | 1st (Ascendant) |

### 1.6 Kala Bala 하위 구성

| 하위 요소 | 내용 |
|-----------|------|
| **Natonnata Bala** | 낮 행성(Sun, Jupiter, Venus) vs 밤 행성(Moon, Mars, Saturn). Mercury는 항상 최대 |
| **Paksha Bala** | 월상 기반. 공식: `(Moon경도 - Sun경도) / 3`. 60 초과 시 120에서 차감 |
| **Tribhaga Bala** | 시간 구간 주인 = 60 Virupa. Jupiter 항상 60 |
| **Varsha-Masa-Dina-Hora Bala** | 연 주인 15, 월 주인 30, 일 주인 45, 시 주인 60 Virupa |
| **Yudhdha Bala** | 두 행성이 1° 이내일 때 전쟁. 승자가 패자의 Kala Bala 차이를 획득 |

### 1.7 개별 구성 요소 최소 요구치 (Virupa)

| 행성 그룹 | Sthana Bala | Dig Bala | Kala Bala | Cheshta Bala | Ayana Bala |
|-----------|-------------|----------|-----------|--------------|------------|
| Sun, Jupiter, Mercury | 165 | 35 | 50 | 112 | 30 |
| Moon, Venus | 133 | 50 | 30 | 100 | 40 |
| Mars, Saturn | 96 | 30 | 40 | 67 | 20 |

---

## 2. Essential Dignity — 서양 전통 체계 (William Lilly)

### 2.1 Essential Dignities 점수표 (Christian Astrology, 1647)

| 배치 | 점수 |
|------|------|
| Domicile (자기 궁) | +5 |
| Exaltation (고양) | +4 |
| Triplicity (삼원소) | +3 |
| Term/Bounds (항) | +2 |
| Face/Decan (면) | +1 |
| Detriment (방해) | -5 |
| Fall (감쇠) | -4 |
| Peregrine (방랑, 아무 dignity 없음) | -5 |

### 2.1b Accidental Dignities 점수표

차트 위치, 행성 상태 등에 따른 추가 점수:

**하우스 배치:**

| 하우스 | 점수 |
|--------|------|
| 1st 또는 10th | +5 |
| 7th, 4th, 또는 11th | +4 |
| 2nd 또는 5th | +3 |
| 9th | +2 |
| 3rd | +1 |

**운동/방향 상태:**

| 조건 | 점수 |
|------|------|
| Direct (순행) | +4 |
| Swift in motion (빠른 이동) | +2 |
| Saturn/Jupiter/Mars oriental (동방) | +2 |
| Mercury/Venus occidental (서방) | +2 |
| Moon 차오르는 중 (waxing) | +2 |
| Combustion/Sun beams에서 자유 | +5 |
| Cazimi (태양 중심 0°17' 이내) | +5 |
| Jupiter 또는 Venus와 partile conjunction | +5 |
| North Node와 partile conjunction | +4 |
| Jupiter 또는 Venus와 partile trine | +4 |
| Jupiter 또는 Venus와 partile sextile | +3 |
| 항성 Regulus와 conjunction | +6 |
| 항성 Spica와 conjunction | +5 |

**Accidental Debilities:**

| 조건 | 점수 |
|------|------|
| 12th 하우스 | -5 |
| 8th 또는 6th 하우스 | -2 |
| Retrograde (역행) | -5 |
| Slow in motion (느린 이동) | -2 |
| Saturn/Jupiter/Mars occidental (서방) | -2 |
| Mercury/Venus oriental (동방) | -2 |
| Moon 이지러지는 중 (waning) | -2 |
| Combust (태양 8°30' 이내) | -5 |
| Under Sun's beams (태양 17° 이내) | -4 |
| Saturn 또는 Mars와 partile conjunction | -5 |
| Saturn과 Mars 사이에 포위 | -5 |
| South Node와 partile conjunction | -4 |
| 항성 Caput Algol과 conjunction | -5 |

Essential + Accidental 합산 범위: 약 **-38 ~ +38**

### 2.2 행성별 Domicile / Exaltation / Detriment / Fall

| 행성 | Domicile | Exaltation (도수) | Detriment | Fall |
|------|----------|------------------|-----------|------|
| Sun | Leo | Aries 19° | Aquarius | Libra |
| Moon | Cancer | Taurus 3° | Capricorn | Scorpio |
| Mercury | Gemini, Virgo | Virgo 15° | Sagittarius, Pisces | Pisces |
| Venus | Taurus, Libra | Pisces 27° | Aries, Scorpio | Virgo |
| Mars | Aries, Scorpio | Capricorn 28° | Taurus, Libra | Cancer |
| Jupiter | Sagittarius, Pisces | Cancer 15° | Gemini, Virgo | Capricorn |
| Saturn | Capricorn, Aquarius | Libra 21° | Cancer, Leo | Aries |

### 2.3 Triplicity Rulers (Dorotheus of Sidon, 1세기 CE)

| 원소 | 별자리 | 낮 지배자 | 밤 지배자 | 참여자 |
|------|--------|----------|----------|--------|
| Fire | Aries, Leo, Sagittarius | Sun | Jupiter | Saturn |
| Earth | Taurus, Virgo, Capricorn | Venus | Moon | Mars |
| Air | Gemini, Libra, Aquarius | Saturn | Mercury | Jupiter |
| Water | Cancer, Scorpio, Pisces | Venus | Mars | Moon |

Sect(낮/밤) 조건에 따라 우선 지배자가 달라진다:
- 낮 차트 → 첫 번째 지배자가 최강
- 밤 차트 → 두 번째 지배자가 최강
- 참여 지배자 → 양쪽 모두에서 약한 영향

### 2.4 Egyptian Terms (Bounds) — 전체 12궁 테이블

각 별자리를 5개 불균등 구간으로 나눠 행성(Sun/Moon 제외한 5행성)을 배정한다.

| 궁 | 1st Bound | 2nd Bound | 3rd Bound | 4th Bound | 5th Bound |
|----|-----------|-----------|-----------|-----------|-----------|
| Aries | Jupiter 0-6 | Venus 6-12 | Mercury 12-20 | Mars 20-25 | Saturn 25-30 |
| Taurus | Venus 0-8 | Mercury 8-14 | Jupiter 14-22 | Saturn 22-27 | Mars 27-30 |
| Gemini | Mercury 0-6 | Jupiter 6-12 | Venus 12-17 | Mars 17-24 | Saturn 24-30 |
| Cancer | Mars 0-7 | Venus 7-13 | Mercury 13-19 | Jupiter 19-26 | Saturn 26-30 |
| Leo | Jupiter 0-6 | Venus 6-11 | Saturn 11-18 | Mercury 18-24 | Mars 24-30 |
| Virgo | Mercury 0-7 | Venus 7-17 | Jupiter 17-21 | Mars 21-28 | Saturn 28-30 |
| Libra | Saturn 0-6 | Mercury 6-14 | Jupiter 14-21 | Venus 21-28 | Mars 28-30 |
| Scorpio | Mars 0-7 | Venus 7-11 | Mercury 11-19 | Jupiter 19-24 | Saturn 24-30 |
| Sagittarius | Jupiter 0-12 | Venus 12-17 | Mercury 17-21 | Saturn 21-26 | Mars 26-30 |
| Capricorn | Mercury 0-7 | Jupiter 7-14 | Venus 14-22 | Saturn 22-26 | Mars 26-30 |
| Aquarius | Mercury 0-7 | Venus 7-13 | Jupiter 13-20 | Mars 20-25 | Saturn 25-30 |
| Pisces | Venus 0-12 | Jupiter 12-16 | Mercury 16-19 | Mars 19-28 | Saturn 28-30 |

**전체 배분** (12궁 합산):
- Venus: 82° / Jupiter: 79° / Mercury: 76° / Mars: 66° / Saturn: 57°
- 합계: 360° (= 각 행성의 "greater years"에 대응)

구조적 특징:
- 각 궁의 마지막 1~2 항은 거의 항상 흉성(Mars/Saturn)에 배정
- 첫 3개 항은 주로 길성(Venus/Jupiter)과 Mercury에 배정

### 2.5 Chaldean Face/Decan Rulers — 전체 테이블

| 궁 | Decan I (0°-10°) | Decan II (10°-20°) | Decan III (20°-30°) |
|----|-----------------|-------------------|---------------------|
| Aries | Mars | Sun | Venus |
| Taurus | Mercury | Moon | Saturn |
| Gemini | Jupiter | Mars | Sun |
| Cancer | Venus | Mercury | Moon |
| Leo | Saturn | Jupiter | Mars |
| Virgo | Sun | Venus | Mercury |
| Libra | Moon | Saturn | Jupiter |
| Scorpio | Mars | Sun | Venus |
| Sagittarius | Mercury | Moon | Saturn |
| Capricorn | Jupiter | Mars | Sun |
| Aquarius | Venus | Mercury | Moon |
| Pisces | Saturn | Jupiter | Mars |

Chaldean Order (Saturn → Jupiter → Mars → Sun → Venus → Mercury → Moon) 순으로
Aries Decan I부터 순환 배정한다.

### 2.6 Sect (Day/Night) 분류

| 분류 | 낮 (Diurnal) 행성 | 밤 (Nocturnal) 행성 |
|------|------------------|-------------------|
| Luminary | Sun | Moon |
| Benefic | Jupiter (day benefic) | Venus (night benefic) |
| Malefic | Saturn (day malefic) | Mars (night malefic) |
| 중립 | Mercury (양쪽 적응) | Mercury (양쪽 적응) |

Sect에 맞는 행성은 더 건설적으로, Sect에 어긋나는 행성은 더 극단적으로 작용한다.

---

## 3. 통합 접근법 — 우리 앱 적용

### 3.1 2단계 전략

**1단계 (현재)**: Naisargika Bala 기반 고정 크기
- 출생차트 없이도 사용 가능
- 현재 3D 뷰의 `influenceSize` 값이 이 순위를 반영

**2단계 (향후)**: 출생차트 입력 시 동적 계산
- Shadbala 전체 6-fold 계산 적용
- Essential Dignity 점수 보정
- 개인별 행성 영향력 점수 산출

### 3.2 기본 영향력 공식 (제안)

```
기본 영향력 = Naisargika Bala (고정) + Essential Dignity 점수 (출생차트 기반)
```

심화:
```
전체 영향력 = Shadbala 총점 (Virupa) + Essential Dignity 보정
```

### 3.3 구현용 TypeScript 의사코드

```typescript
// ─── Approach A: Naisargika Bala (고정, 차트 데이터 불필요) ───
const NAISARGIKA_BALA: Record<string, number> = {
  Sun:     60.00,  // 7/7 of a Rupa
  Moon:    51.43,  // 6/7
  Venus:   42.86,  // 5/7
  Jupiter: 34.29,  // 4/7
  Mercury: 25.71,  // 3/7
  Mars:    17.14,  // 2/7
  Saturn:   8.57,  // 1/7
};

// ─── Approach B: Essential Dignity 점수 (차트 위치 필요) ───
function essentialDignityScore(planet: string, sign: string, degree: number): number {
  let score = 0;
  if (isDomicile(planet, sign)) score += 5;
  if (isExalted(planet, sign)) score += 4;
  if (isTriplicityRuler(planet, sign, isDayChart)) score += 3;
  if (isTermRuler(planet, sign, degree)) score += 2;
  if (isFaceRuler(planet, sign, degree)) score += 1;
  if (isDetriment(planet, sign)) score -= 5;
  if (isFall(planet, sign)) score -= 4;
  if (score === 0 && !isDetriment(planet, sign) && !isFall(planet, sign)) score -= 5; // Peregrine
  return score;  // 범위: -9 ~ +15
}

// ─── Approach C: 혼합 가중 점수 ───
function planetaryInfluence(planet: string, sign: string, degree: number): number {
  const natural = (NAISARGIKA_BALA[planet] / 60) * 100;     // 0-100 정규화
  const dignity = essentialDignityScore(planet, sign, degree);
  const positional = ((dignity + 9) / 24) * 100;            // -9..+15 → 0..100
  return natural * 0.4 + positional * 0.6;
}
```

### 3.4 체계별 점수 범위 요약

| 체계 | 단위 | 행성당 범위 | 단일 점수? |
|------|------|-----------|-----------|
| Shadbala (전체) | Virupa | 0 ~ ~1020 | O |
| Naisargika Bala (하위) | Virupa | 8.57 ~ 60 | O (고정) |
| Lilly Essential Dignity | 점 | -9 ~ +15 | O |
| Lilly 전체 (Essential + Accidental) | 점 | -38 ~ +38 | O |

### 3.5 현재 3D 뷰 크기 매핑

| 행성 | Physical Size | Influence Size | 근거 |
|------|--------------|---------------|------|
| Sun | 0.25 (중앙) | 0.25 (중앙) | Luminary — 중심 고정 |
| Mercury | 0.06 | 0.09 | 가장 작은 행성 / 중립 영향 |
| Venus | 0.09 | 0.11 | 중간 크기 / Lesser Benefic |
| Moon | 0.05 | 0.16 | 물리적 최소 / Luminary 최대 영향 |
| Mars | 0.07 | 0.10 | 작은 행성 / Lesser Malefic |
| Jupiter | 0.18 | 0.14 | 물리적 최대 / Great Benefic |
| Saturn | 0.16 | 0.12 | 물리적 대형 / Great Malefic |

---

## 4. 참고 자료

### GitHub 구현체

**Vedic/Shadbala:**
- [PyJHora](https://github.com/naturalstupid/PyJHora) — Python, 6,800+ 테스트, B.V. Raman/V.P. Jain 검증. 모듈: `jhora.horoscope.chart.strength`
- [jyotishyamitra](https://github.com/VicharaVandana/jyotishyamitra) — Python, 상세 Shadbala 구현
- [Maitreya9](https://github.com/robinrodricks/Maitreya9) — C++, Shadbala + Ashtakavarga 뷰, Swiss Ephemeris 통합
- [Astrosoft](https://github.com/erajasekar/Astrosoft) — Java, Ishta/Kashta/Bhava Bala 포함

**Western/Essential Dignity:**
- [flatlib](https://github.com/flatangle/flatlib) — Python, 가장 완성도 높은 오픈소스 구현. Egyptian/Ptolemaic/Lilly Terms 지원
- [Ptolemy](https://github.com/AlexPizarro7/Ptolemy) — Python, Swiss Ephemeris 기반 Essential Dignity 분석
- [immanuel-python](https://github.com/theriftlab/immanuel-python) — Python, Astro Gold 기반 Dignity 점수

### 웹 참고

**Vedic/Shadbala:**
- [Saravali — Shadbala Summary](https://saravali.github.io/astrology/bala_summary.html)
- [Saravali — Sthana Bala](https://saravali.github.io/astrology/bala_sthana.html)
- [Saravali — Dig Bala](https://saravali.github.io/astrology/bala_dig.html)
- [Saravali — Kala Bala](https://saravali.github.io/astrology/bala_kala.html)
- [Shadbala: The 6 Sources of Strength (Medium)](https://medium.com/thoughts-on-jyotish/shadbala-the-6-sources-of-strength-4c5befc0c59a)
- [Dirah — Vedic Shadbala Analysis](https://www.dirah.org/shadbala.htm)

**Western/Dignity:**
- [Skyscript — Assessing Dignity through Point-Scoring](https://www.skyscript.co.uk/dig5.html)
- [Medieval Astrology Guide — Essential Dignities](https://www.medievalastrologyguide.com/essential-dignities)

**Terms/Bounds & Triplicity:**
- [Seven Stars Astrology — Bounds Tables](https://sevenstarsastrology.com/bounds-tables-origin/)
- [Altair Astrology — Terms or Bounds](https://altairastrology.wordpress.com/2009/03/01/more-on-the-terms-or-bounds/)
- [Kira Ryberg — The Power of the Bounds](https://www.kiraryberg.com/blog/the-bounds)
- [Two Wander — Triplicity Rulership](https://www.twowander.com/blog/triplicity-rulership)
- [Wikipedia — Triplicity](https://en.wikipedia.org/wiki/Triplicity)

### 서적
- B.V. Raman, *Graha and Bhava Balas*
- V.P. Jain, *Predictive Astrology*
- William Lilly, *Christian Astrology* (1647)
- Dorotheus of Sidon, *Carmen Astrologicum* (1세기 CE)
- Vettius Valens, *Anthology*
- Ptolemy, *Tetrabiblos*
