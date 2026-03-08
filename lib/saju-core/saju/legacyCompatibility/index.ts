/**
 * Legacy compatibility barrel export.
 * Re-exports all types and functions from family modules.
 * Consolidates all exports directly from family modules (no _legacy.ts bridge).
 */

// ============================================================================
// Spouse/Intimacy Family (legacySpouseInsights.ts)
// ============================================================================

export type {
  LegacyCompatibilityBirthInfo,
  LegacyCompatibilityCalculationInput,
  LegacyIntimacyInsight,
  LegacyLoveStyleInsight,
  LegacyBedroomInsight,
  LegacySpouseCoreInsight,
  LegacyDestinyCoreInsight,
  LegacyPartnerPersonalityInsight,
  LegacyPartnerRoleInsight,
} from "./legacySpouseInsights"

export {
  buildLegacyIntimacyInsight,
  buildLegacyLoveStyleInsight,
  buildLegacyBedroomInsight,
  buildLegacySpouseCoreInsight,
  buildLegacyDestinyCoreInsight,
  buildLegacyPartnerPersonalityInsight,
  buildLegacyPartnerRoleInsight,
} from "./legacySpouseInsights"

// ============================================================================
// Timing Family (legacyTimingInsights.ts)
// ============================================================================

export type {
  LegacyMarriageFlowInsight,
  LegacyMarriageTimingTableInsight,
  LegacyFutureSpouseInsight,
  LegacyRelationshipTimingInsight,
  LegacyYearlyLoveCycleInsight,
  LegacyLoveWeakPointInsight,
} from "./legacyTimingInsights"

export {
  buildLegacyMarriageFlowInsight,
  buildLegacyMarriageTimingTableInsight,
  buildLegacyFutureSpouseInsight,
  buildLegacyRelationshipTimingInsight,
  buildLegacyYearlyLoveCycleInsight,
  buildLegacyLoveWeakPointInsight,
} from "./legacyTimingInsights"

// ============================================================================
// Zodiac Family (legacyZodiacInsights.ts)
// ============================================================================

export type {
  LegacyZodiacCompatibilityInsight,
  LegacyAnimalCompatibilityInsight,
  LegacySasangCompatibilityInsight,
  SasangConstitution,
} from "./legacyZodiacInsights"

export {
  buildLegacyZodiacCompatibilityInsight,
  buildLegacyAnimalCompatibilityInsight,
  buildLegacySasangCompatibilityInsight,
} from "./legacyZodiacInsights"

// ============================================================================
// Basic/Detail/Type/Outer/Traditional Family (legacyBasicCompatibility.ts)
// ============================================================================

export type {
  LegacyTypeProfileInsight,
  LegacyOuterCompatibilityInsight,
  LegacyTraditionalCompatibilityInsight,
  LegacyBasicCompatibilityInsight,
  LegacyDetailedCompatibilityInsight,
} from "./legacyBasicCompatibility"

export {
  buildLegacyTypeProfileInsight,
  buildLegacyOuterCompatibilityInsight,
  buildLegacyTraditionalCompatibilityInsight,
  buildLegacyBasicCompatibilityInsight,
  buildLegacyDetailedCompatibilityInsight,
} from "./legacyBasicCompatibility"
