import type { DebateEvent, DebateSummary } from "./run-debate"

/**
 * 더미 데이터를 사용하는 토론 모의 실행기
 * MOCK_DEBATE=true 환경변수로 활성화
 * 실제 LLM 호출 없이 스트리밍 흐름을 검증합니다.
 */

const MOCK_TURNS = [
  {
    agent: "saju-master" as const,
    turn: 1,
    name: "사주 명리사",
    avatar: "scroll",
    text: `사주를 살펴보겠습니다.

이분의 일주(日柱)를 보면, 일간이 갑목(甲木)으로 강한 생장력과 곧은 기운을 지니고 있습니다. 목(木)의 기운이 충만하여 새로운 시작과 도전에 유리한 시기입니다.

특히 월주의 오행 배치를 보면 화(火) 기운이 받쳐주고 있어, 표현력과 사교성이 빛나는 때입니다. 직장이나 사업에서 자신의 의견을 적극적으로 피력하면 좋은 결과를 얻을 수 있겠습니다.

다만 시주에 금(金) 기운이 있어 저녁 시간대에는 에너지를 아끼고 충분한 휴식을 취하시는 것을 권합니다. 오행의 균형을 맞추는 것이 건강 유지의 핵심이니까요.

십이운성을 보면 현재 '건록(建祿)' 시기에 해당하여 자립과 성취의 기운이 강합니다. 실질적인 행동으로 옮기기 좋은 시기입니다.`,
  },
  {
    agent: "astrologer" as const,
    turn: 2,
    name: "점성술사",
    avatar: "star",
    text: `별의 배치를 살펴보겠습니다.

현재 태양(Sun)이 물고기자리(Pisces) 12도에 위치하며, 직관과 영적 민감성이 고조되는 시기입니다. 물고기자리 에너지는 창의성과 공감 능력을 극대화시킵니다.

특히 주목할 점은 목성(Jupiter)이 사자자리(Leo)에서 높은 에센셜 디그니티(finalScore: 78.3)를 보이고 있다는 것입니다. 목성은 확장과 행운의 행성으로, 사자자리에서의 강한 위치는 자신감과 리더십이 빛나는 시기임을 알려줍니다.

금성(Venus)이 양자리(Aries)에 위치하여 관계에서의 새로운 시작이나 대담한 시도가 좋은 결과를 가져올 수 있습니다. 다만 화성(Mars)과의 긴장 관계가 있으니 충동적인 결정은 피하시는 것이 좋겠습니다.

오늘은 주간 차트(Day Chart)로, 태양의 영향력이 강합니다. 낮 시간을 적극적으로 활용하시되, 달(Moon)이 게자리(Cancer)에 위치하여 감정적 안정이 필요한 때이기도 합니다.`,
  },
  {
    agent: "saju-master" as const,
    turn: 3,
    name: "사주 명리사",
    avatar: "scroll",
    text: `점성술사님의 해석을 흥미롭게 들었습니다.

**동의하는 부분**: 목성의 확장 에너지가 사자자리에서 강하다는 점은, 명리학에서 볼 때 이 분의 월주에 있는 화(火) 기운의 왕성함과 정확히 일맥상통합니다. 동서양 모두 "활동적 에너지의 고조"를 읽고 있는 것이죠. 또한 "낮 시간 활용"이라는 조언은 사주의 시주 분석과도 맞닿아 있습니다.

**보완할 점**: 점성술사님이 "충동적 결정을 피하라"고 하셨는데, 명리학적으로 좀 더 구체적으로 말씀드리면 — 이 분의 사주에 상관(傷官)의 기운이 작용하고 있어, 특히 **말로 인한 실수**를 조심해야 합니다. 단순한 충동이 아니라 "너무 솔직한 표현"이 문제가 될 수 있는 시기입니다.

**교차점**: 흥미로운 것은 금성이 양자리에 있다는 점과, 사주의 정재(正財) 기운이 함께 작용한다는 점입니다. 동서양 모두 **관계와 재물에서의 새로운 기회**를 읽고 있습니다. 다만 명리학에서는 정재의 안정적 재물운을, 점성술에서는 금성의 대담한 시도를 강조하는 것이 흥미로운 차이입니다.`,
  },
  {
    agent: "astrologer" as const,
    turn: 4,
    name: "점성술사",
    avatar: "star",
    text: `명리사님의 깊은 통찰에 감사드립니다.

**동의하는 부분**: "말로 인한 실수를 조심하라"는 상관(傷官) 분석이 매우 정확합니다. 점성학적으로도 수성(Mercury)이 현재 역행(retrograde) 에너지에 영향을 받고 있어, 커뮤니케이션에서의 오해가 발생하기 쉬운 시기입니다. 동서양이 같은 경고를 보내고 있는 셈이죠.

**보완하고 싶은 점**: 명리사님이 화(火) 기운의 왕성함을 말씀하셨는데, 점성학적 관점에서 한 가지 추가하자면 — 현재 토성(Saturn)이 물병자리(Aquarius)에서 책임과 구조화의 에너지를 보내고 있습니다. 이는 "열정적으로 달리되, 체계적으로 달리라"는 메시지입니다. 즉흥적 활력이 아닌 **계획된 열정**이 지금의 우주적 에너지에 부합합니다.

**동서양 교차점**: 가장 흥미로운 합치점은 양 학문 모두 **"자기 표현의 시기"**라고 읽고 있다는 것입니다. 사주의 갑목(甲木) 일간 + 화(火) 기운과 점성술의 태양 + 목성 조합은 모두 "나를 드러내되 절제를 갖추라"는 같은 메시지입니다. 이런 동서양의 합치는 매우 강력한 신호라고 볼 수 있습니다.`,
  },
] as const

const MOCK_SUMMARY: DebateSummary = {
  headline: "자기 표현의 시기, 절제와 함께",
  agreement:
    "동서양 모두 현재가 활동적 에너지가 고조된 시기이며, 자기 표현과 새로운 시도에 유리하다고 분석했습니다. 다만 커뮤니케이션에서의 실수를 경계하고, 체계적 접근이 필요하다는 점에서도 의견이 일치합니다.",
  sajuHighlight:
    "갑목(甲木) 일간의 강한 생장력과 화(火) 기운의 지지로 표현력이 빛나는 시기이나, 상관(傷官)의 영향으로 말 조심이 필요합니다.",
  astroHighlight:
    "목성이 사자자리에서 높은 디그니티를 보여 자신감과 리더십이 고조되며, 토성의 구조화 에너지가 계획된 행동을 요구합니다.",
  advice:
    "오늘은 자신의 의견을 적극적으로 표현하되, '한 박자 쉬고 말하기'를 실천하세요. 관계와 재물에서 새로운 기회가 올 수 있으니 열린 마음으로 임하되, 중요한 결정은 서면으로 정리한 후 내리시길 권합니다.",
  keywords: ["자기표현", "절제", "새로운 기회"],
  overallTone: "positive",
}

/**
 * Mock 토론 실행 — LLM 호출 없이 더미 데이터를 스트리밍합니다
 */
export async function runDebateMock(
  writer: WritableStreamDefaultWriter<Uint8Array>,
): Promise<DebateSummary> {
  const encoder = new TextEncoder()

  function emit(event: DebateEvent) {
    writer.write(encoder.encode(JSON.stringify(event) + "\n"))
  }

  emit({ type: "debate-start", totalTurns: 5 })

  for (const turn of MOCK_TURNS) {
    emit({
      type: "turn-start",
      agent: turn.agent,
      turn: turn.turn,
      name: turn.name,
      avatar: turn.avatar,
    })

    // 글자 단위 스트리밍 시뮬레이션 (10자씩)
    const chars = turn.text
    const chunkSize = 10
    for (let i = 0; i < chars.length; i += chunkSize) {
      const delta = chars.slice(i, i + chunkSize)
      emit({ type: "text-delta", agent: turn.agent, delta })
      // 실제 스트리밍 느낌을 위한 짧은 딜레이
      await new Promise((r) => setTimeout(r, 15))
    }

    emit({ type: "turn-end", agent: turn.agent, turn: turn.turn })
  }

  // 종합 요약
  emit({ type: "synthesis-start" })
  await new Promise((r) => setTimeout(r, 300))
  emit({ type: "synthesis-result", summary: MOCK_SUMMARY })
  emit({ type: "debate-end" })

  return MOCK_SUMMARY
}
