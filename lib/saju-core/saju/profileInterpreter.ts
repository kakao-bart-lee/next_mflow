import type {
  FortuneProfileEntry,
  FortuneProfileResult,
  FortuneProfileSection,
  FortuneRequest,
  FortuneResponse,
  ThemeInterpretationSummary,
} from '../models/fortuneTeller';
import type { CalculationInput } from './fortuneCalculatorBase';
import { CALCULATOR_CONFIGS, CalculatorFactory } from './calculatorFactory';
import { DatabaseResultRetriever } from './fortuneInterpreter';
import type { FortuneProfileDefinition } from './fortuneProfiles';
import { buildTenYearFortuneCycleSections } from './greatFortuneProfiles';
import { ThemeInterpreterManager } from './interpreters';
import { getTableCatalogEntry } from './tableCatalog';
import { buildTextVariants, resolveTextVariants } from './textVariants';

export class FortuneProfileInterpreter {
  private readonly factory: CalculatorFactory;
  private readonly themeInterpreterManager: ThemeInterpreterManager;

  constructor(sData: Record<string, unknown>) {
    this.factory = new CalculatorFactory(new DatabaseResultRetriever(sData));
    this.themeInterpreterManager = new ThemeInterpreterManager();
  }

  buildProfileResult(
    request: FortuneRequest,
    fortuneResponse: FortuneResponse,
    profileDefinition: FortuneProfileDefinition
  ): FortuneProfileResult {
    const calculationInput = this.buildCalculationInput(request, fortuneResponse);
    return {
      profile: {
        id: profileDefinition.id,
        title: profileDefinition.titleKo,
        description: profileDefinition.description,
      },
      sections:
        profileDefinition.id === 'ten_year_fortune_cycle'
          ? buildTenYearFortuneCycleSections(request, fortuneResponse, profileDefinition.sections)
          : profileDefinition.sections.map((section) =>
              this.buildSection(section.id, section.title, section.tableCodes, calculationInput)
            ),
      theme: this.buildThemeSummary(fortuneResponse, profileDefinition),
    };
  }

  private buildSection(
    sectionId: string,
    title: string,
    tableCodes: readonly string[],
    calculationInput: CalculationInput
  ): FortuneProfileSection {
    return {
      id: sectionId,
      title,
      entries: tableCodes.map((tableCode) => this.buildEntry(tableCode, calculationInput)),
    };
  }

  private buildEntry(tableCode: string, calculationInput: CalculationInput): FortuneProfileEntry {
    const catalogEntry = getTableCatalogEntry(tableCode);
    if (!(tableCode in CALCULATOR_CONFIGS)) {
      return this.buildEmptyEntry(tableCode, catalogEntry.entryId, catalogEntry.title, {
        status: 'unsupported_table',
        missingReason: `Calculator config is missing for ${tableCode}`,
      });
    }

    try {
      const calculator = this.factory.createCalculator(tableCode);
      const result = calculator.calculate(calculationInput);
      const textVariants = resolveTextVariants({
        rawText: result.text ?? '',
        tableCode: result.tableName,
        rowKey: result.expression,
      });

      const hasContent = Boolean(
        textVariants.fullText || textVariants.briefText || textVariants.oneLineSummary
      );

      return {
        id: catalogEntry.entryId,
        tableCode,
        title: catalogEntry.title,
        fullText: textVariants.fullText,
        briefText: textVariants.briefText,
        oneLineSummary: textVariants.oneLineSummary,
        score: catalogEntry.showScore ? this.parseScoreValue(result.numerical) : null,
        status: hasContent ? 'resolved' : 'missing_data',
        lookupKey: result.expression,
        missingReason: hasContent
          ? null
          : `No matching interpretation text found for ${tableCode}:${result.expression}`,
      };
    } catch (error) {
      return this.buildEmptyEntry(tableCode, catalogEntry.entryId, catalogEntry.title, {
        status: 'error',
        missingReason:
          error instanceof Error
            ? error.message
            : `Interpretation build failed for ${tableCode}`,
      });
    }
  }

  private buildThemeSummary(
    fortuneResponse: FortuneResponse,
    profileDefinition: FortuneProfileDefinition
  ): ThemeInterpretationSummary {
    const pillars = fortuneResponse.sajuData.pillars;
    const sajuDict = {
      four_pillars: {
        년주: { 천간: pillars.년.천간, 지지: pillars.년.지지 },
        월주: { 천간: pillars.월.천간, 지지: pillars.월.지지 },
        일주: { 천간: pillars.일.천간, 지지: pillars.일.지지 },
        시주: { 천간: pillars.시.천간, 지지: pillars.시.지지 },
      },
    };

    const interpretation = this.themeInterpreterManager.getInterpretation(
      sajuDict,
      profileDefinition.themeType
    );
    const summaryVariants = buildTextVariants(interpretation.summary);
    const analysisVariants = buildTextVariants(interpretation.detailed_analysis);

    return {
      id: profileDefinition.themeType,
      title: interpretation.title,
      summary: interpretation.summary,
      oneLineSummary: summaryVariants.oneLineSummary,
      briefAnalysis: analysisVariants.briefText,
      detailedAnalysis: interpretation.detailed_analysis,
      strengths: interpretation.strengths,
      weaknesses: interpretation.weaknesses,
      advice: interpretation.advice,
      luckyElements: interpretation.lucky_elements,
      unluckyElements: interpretation.unlucky_elements,
      score: interpretation.score,
      grade: interpretation.grade,
    };
  }

  private buildEmptyEntry(
    tableCode: string,
    id: string,
    title: string,
    overrides?: Partial<FortuneProfileEntry>
  ): FortuneProfileEntry {
    return {
      id,
      tableCode,
      title,
      fullText: '',
      briefText: '',
      oneLineSummary: '',
      score: null,
      status: 'missing_data',
      lookupKey: null,
      missingReason: null,
      ...overrides,
    };
  }

  private parseScoreValue(scoreText: string | null): number | null {
    if (scoreText === null || scoreText === undefined) {
      return null;
    }

    const rawText = String(scoreText).trim();
    if (!rawText) {
      return null;
    }

    const numericValue = Number(rawText);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  private buildCalculationInput(
    request: FortuneRequest,
    fortuneResponse: FortuneResponse
  ): CalculationInput {
    const pillars = fortuneResponse.sajuData.pillars;
    return {
      yearStem: pillars.년.천간,
      yearBranch: pillars.년.지지,
      monthStem: pillars.월.천간,
      monthBranch: pillars.월.지지,
      dayStem: pillars.일.천간,
      dayBranch: pillars.일.지지,
      hourStem: pillars.시.천간,
      hourBranch: pillars.시.지지,
      gender: request.gender,
      additionalData: {
        birth_date: request.birthDate,
        birth_time: request.birthTime,
        timezone: request.timezone,
        jumno: fortuneResponse.inputData['jumno'] ?? null,
      },
    };
  }
}
