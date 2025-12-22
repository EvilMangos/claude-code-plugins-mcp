/**
 * Valid report types corresponding to workflow steps.
 */
export const REPORT_TYPES = [
	"requirements",
	"plan",
	"tests-design",
	"tests-review",
	"implementation",
	"stabilization",
	"acceptance",
	"performance",
	"security",
	"refactoring",
	"code-review",
	"documentation",
] as const;

/**
 * Type derived from REPORT_TYPES constant.
 */
export type ReportType = (typeof REPORT_TYPES)[number];
