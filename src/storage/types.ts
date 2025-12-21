/**
 * Valid file types for workflow reports.
 * Use this constant as the source of truth for file type values.
 */
export const FILE_TYPES = ["full", "signal", "logs"] as const;

/**
 * Type derived from FILE_TYPES constant.
 */
export type FileType = (typeof FILE_TYPES)[number];
