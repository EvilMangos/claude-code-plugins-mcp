/**
 * Enum-like object for report types corresponding to workflow steps.
 */
export const ReportType = {
	REQUIREMENTS: "requirements",
	PLAN: "plan",
	TESTS_DESIGN: "tests-design",
	TESTS_REVIEW: "tests-review",
	IMPLEMENTATION: "implementation",
	STABILIZATION: "stabilization",
	ACCEPTANCE: "acceptance",
	PERFORMANCE: "performance",
	SECURITY: "security",
	REFACTORING: "refactoring",
	CODE_REVIEW: "code-review",
	DOCUMENTATION: "documentation",
} as const;

/**
 * Type derived from ReportType object values.
 */
// eslint-disable-next-line no-redeclare
export type ReportType = (typeof ReportType)[keyof typeof ReportType];

/**
 * Array of valid report types (derived from ReportType object).
 */
export const REPORT_TYPES = Object.values(ReportType);
