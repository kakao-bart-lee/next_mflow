# 초개인화 동서양 융합 운명 컨설팅: 데이터 인벤토리 활용 및 Mastra 아키텍처 설계

사주, 서양 점성술, 자미두수를 아우르며 크로스 매핑과 복합 융합까지 고려된 32개의 명리학/점성술 데이터 파이프라인(Inventory)을 200% 활용하기 위한 전략 문서입니다. 

방대한 데이터를 LLM에 단순 주입할 때 발생하는 토큰 낭비와 환각(Hallucination)을 방지하고, 내담자(유저)의 질문에 가장 날카롭고 공감 가는 답변을 제공하기 위해 **질문 기반 데이터 조합(Context Bundling)**과 **Mastra.ai 기반의 백엔드 아키텍처**를 결합하여 설계합니다.

---

## 1. 내담자 질문 의도 기반 데이터 모듈화 (Context Bundling Strategy)

LLM에게 30개가 넘는 지표를 한 번에 전부 주입하는 대신, 사용자가 자주 묻는 질문을 4가지 카테고리로 나누고 필요한 데이터만 '모듈'로 묶어 LLM에 주입합니다.

### 💼 A. 커리어 / 재물 / 진로 (Career & Wealth)
*   **대표 질문:** “이직해도 될까요?”, “제 적성에 맞는 직업은?”, “언제쯤 돈이 모일까요?”
*   **조합할 데이터 (Ambition Bundle):**
    *   **사주:** 십신(재성/관성 상태), 신살(역마, 화개 등 직업적 강점)
    *   **점성술:** MC(천정점), 2/6/10 하우스(재물/노동/커리어), 낙샤트라(타고난 강점)
    *   **자미두수:** 관록궁, 재백궁
    *   **타이밍:** 사주 세운, 점성술 Profection (현재 활성화된 분야)
*   **LLM 페르소나:** 현실적이고 전략적인 커리어 코치 및 재무 컨설턴트.

### ❤️ B. 연애 / 파트너십 / 인간관계 (Love & Relationship)
*   **대표 질문:** “올해 연애운이 있나요?”, “이 사람과 잘 맞을까요?”, “나에게 맞는 사람은 어떤 사람일까요?”
*   **조합할 데이터 (Connection Bundle):**
    *   **사주:** 일지(배우자궁), 십신(관성/재성), 궁합 데이터, 일지/월지 형충파해
    *   **점성술:** 7하우스, 금성(사랑의 방식) 및 달(감정적 안정), 어스펙트 충돌/시너지
    *   **융합:** 10가지 테마 해설 중 '관계/사랑' 데이터
*   **LLM 페르소나:** 공감 능력이 뛰어나며 객관적 피드백을 제공하는 관계 심리 상담사.

### ⏳ C. 타이밍 / 운의 흐름 / 중대 결정 (Timing & Decision)
*   **대표 질문:** “올해 삼재라는데 사업을 시작해도 될까요?”, “이사하기 좋은 시기는 언제인가요?”
*   **조합할 데이터 (Momentum Bundle):**
    *   **사주:** 대운(10년 흐름) + 세운 + 월운, 형충파해(변동성, 사건사고)
    *   **점성술:** Dasha(인생 챕터), 트랜짓(Transit) 어스펙트
    *   **자미두수:** 대한, 시운
*   **LLM 페르소나:** 명확한 시기를 짚어주고 리스크 매니지먼트를 돕는 전략적 타임키퍼.

### 🪞 D. 자아 탐구 / 멘탈 케어 (Self-Discovery & Mental Health)
*   **대표 질문:** “요즘 너무 우울하고 무기력해요”, “나는 왜 이러는 걸까요?”, “나의 진짜 본모습은?”
*   **조합할 데이터 (Inner Self Bundle):**
    *   **사주:** 일간(본질), 월지(환경), 12운성(에너지 패턴), 오행 불균형 (예: '수기운 과다'로 인한 우울감)
    *   **점성술:** ASC(페르소나), 달(내면의 아이), Essential Dignity, 결핍 요소
*   **LLM 페르소나:** 명리학을 도구로 삼아 깊은 내면을 다독이는 심리 치료사.

---

## 2. 창의적 프론트엔드 & LLM 시너지 기능 제안

단순 텍스트 기반의 '채팅 운세'를 넘어, Moonlit 아키텍처에서만 가능한 차별화된 기능 아이디어입니다.

### 🎯 2-1. "크로스체크(Cross-Check) 운명 보증" 시스템
*   **개념:** 사주, 서양 점성술, 자미두수 3개 시스템이 **공통적으로 지목하는 테마**를 감지(충돌/시너지 감지)하여 UI에 시각적 하이라이트(예: 🌟)를 주고, LLM이 이를 강력하게 어필합니다.
*   **답변 예시:** "사주의 '관성 세운'과 점성술의 '10하우스 Profection', 자미두수 '관록궁'이 모두 강력하게 당신의 '직업적 변화'를 가리키고 있습니다. 이 세 가지 지표가 겹치는 해는 흔치 않습니다. 두려워하지 말고 도전을 시작하세요!"

### 📖 2-2. 내 인생의 넷플릭스, '라이프 챕터 뷰 (Life Chapter Timeline)'
*   **개념:** 사주 대운(10년)과 점성술 Dasha 시스템을 결합하여, 유저의 인생을 드라마 시즌처럼 분류해주는 타임라인 UI를 제공합니다.
*   **구현 방법:** 특정 챕터(예: 시즌 3. 2024~2028년)를 클릭하면, LLM이 해당 시기의 메인 테마, 잡아야 할 기회, 조심해야 할 함정을 서사적으로 풀어냅니다.

### 🧭 2-3. '마이크로 행동 지침'과 부적(Lucky) 위젯
*   **개념:** '오늘은 운이 좋다/나쁘다'를 넘어 즉각적인 행동을 제안합니다. 매일 아침 프론트 대시보드에 팝업이나 위젯 형태로 제공합니다.
*   **답변 예시:** "오늘 화(Fire) 기운이 과도하게 충돌(형충)하고 욱하기 쉬운 날입니다. 오늘 오후 중요한 이메일을 보내기 전 딱 3분만 심호흡하세요. 럭키 컬러인 '네이비' 아이템으로 물(Water)의 기운을 보충하면 좋습니다."

### ⚖️ 2-4. 'Debate & Decision' 보조관 (의사결정 보드)
*   **개념:** 유저가 두 가지 선택지(예: A회사 이직 vs B회사 잔류)를 입력하면, LLM이 유저의 운의 흐름과 본성을 기반으로 토론을 벌여 결정을 돕습니다.
*   **답변 예시:** "안정감(달 4하우스)을 중시하는 당신의 본성에는 B회사가 맞지만, 현재 강력한 변화의 운(역마살, 9하우스 트랜짓)이 들어와 있습니다. 이번 타이밍에는 성장을 위해 A회사를 선택하는 것이 명리학적으로 유리합니다."

---

## 3. Mastra 기반 아키텍처 설계 (Mastra-Driven Architecture)

현재 프로젝트에 도입된 `sajuAgent`, `astrologerAgent`, `fortuneOrchestrator` 등의 에이전트 구조를 바탕으로, Mastra.ai 프레임워크의 강력한 기능(Workflows, Tools, Memory/RAG, Structured Output)을 활용한 백엔드 아키텍처 설계입니다.

### 🛠️ 3-1. 도구(Tools) 계층: 연산 로직의 모듈화
복잡한 명리/점성술 계산을 LLM이 직접 수행하게 두지 않고, 백엔드 엔진에서 연산한 결과를 Mastra의 `createTool`을 통해 AI SDK 도구로 노출합니다.
```typescript
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'

export const checkCrossSystemSynergyTool = createTool({
  id: 'check-cross-system-synergy',
  description: '사주와 점성술 데이터를 비교하여 공통된 흐름(충돌/시너지)을 찾습니다.',
  inputSchema: z.object({ userId: z.string() }),
  outputSchema: z.object({
    synergies: z.array(z.string()),
    conflicts: z.array(z.string())
  }),
  execute: async ({ inputData }) => {
    // 백엔드 엔진에서 실제 데이터 연산 후 리턴
  }
});
```

### 🔄 3-2. 워크플로우(Workflows): 의도 파악 및 컨텍스트 번들링
유저의 질문에 따라 필요한 데이터(Career, Love, Timing, Mental)만 조립하는 파이프라인을 Mastra의 **Workflow Graph**로 구축합니다.
1. **Intent Router:** 유저의 질문("이직할까요?")을 분석하여 'Ambition Bundle'이 필요함을 판별합니다.
2. **Data Fetching:** 해당 번들에 필요한 Mastra Tools(예: `getCareerAstrologyTool`, `getSaju10GodsTool`)만 병렬로 호출하여 JSON 데이터를 수집합니다.
3. **Context Assembling:** 수집된 데이터를 하나로 모아 다음 에이전트 스텝으로 전달합니다.

### 🧠 3-3. 메모리 및 RAG (Memory & LibSQLVector): 고전 DB 및 유저 히스토리
방대한 고전 DB 해설(적천수 등)을 한 번에 주입하는 대신 Mastra의 Vector Memory 시스템을 활용합니다.
*   **사용자 프로필 (Working Memory):** Mastra의 `workingMemory`를 활성화하여 유저의 핵심 명식(일간, ASC, 주요 신살 등)을 템플릿 형태로 세션 내내 유지합니다.
*   **고전 문헌 RAG (Semantic Recall):** LibSQLVector와 OpenAI Embedding을 연결해 두고, 추출된 유저의 명식 특징(예: "금수상관희견관")을 쿼리로 던져 가장 적합한 고전 해석 문구만 RAG로 가져와 컨텍스트에 동적으로 추가합니다.

### 🧩 3-4. 에이전트 및 구조화된 출력 (Agents & Structured Output)
프론트엔드에서 시각적 위젯(크로스체크 하이라이트, 라이프 챕터 등)을 렌더링하려면 LLM 응답이 JSON 포맷이어야 합니다. `fortuneOrchestrator` 에이전트에서 Mastra의 `structuredOutput` (Zod 연동) 기능을 사용합니다.
```typescript
import { z } from 'zod';

// 프론트엔드가 요구하는 응답 스키마
const ConsultingResponseSchema = z.object({
  consulting_text: z.string().describe("사용자에게 보여줄 따뜻하고 통찰력 있는 상담 텍스트"),
  cross_check_alerts: z.array(z.object({
    type: z.enum(["conflict", "synergy"]),
    message: z.string()
  })),
  actionable_widgets: z.object({
    lucky_colors: z.array(z.string()),
    timing_highlight: z.string().nullable()
  })
});

// Orchestrator Agent 실행
const response = await fortuneOrchestrator.generate(
  "올해 이직해도 될까요? 너무 불안합니다.",
  {
    structuredOutput: {
      schema: ConsultingResponseSchema,
      model: 'openai/gpt-4o'
    }
  }
);
// response.object 에 완벽한 타이핑이 적용된 JSON 리턴됨
```

---

## 4. 전체 데이터 흐름도 (Data Flow Architecture)

1.  **Client Request:** `POST /api/chat` ("올해 사업 시작해도 될까요?")
2.  **Mastra Workflow 진입:**
    *   **Step A (Router):** 질문 분석 -> `Intent: Timing & Decision` 카테고리 분류
    *   **Step B (Tool Calling):** 엔진 계층에 사주(대운/세운), 점성술(Dasha/Transit) 데이터 요청
    *   **Step C (RAG):** 현재 운의 특징과 유사한 고전 DB 해설을 Vector DB에서 검색하여 추출
3.  **Context Injection:** 수집된 JSON 데이터와 검색된 고전문헌을 `sajuAgent`와 `astrologerAgent`에 주입하여 각각의 의견 생성 (내부 토론/생성)
4.  **Orchestration:** `fortuneOrchestrator`가 두 에이전트의 의견을 취합
5.  **Structured Output:** Zod 스키마를 통해 `ConsultingResponseSchema` 형태로 정제된 JSON 응답 생성
6.  **Client Response:** 프론트엔드는 `consulting_text`를 채팅창에 출력하고, `actionable_widgets` 데이터를 파싱하여 화면에 **"행운의 컬러: 레드"**, **"크로스체크 경고: 변동성 겹침"** 등의 위젯 컴포넌트를 렌더링
