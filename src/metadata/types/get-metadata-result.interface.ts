import type { IStoredMetadata } from "./stored-metadata.interface.js";

/**
 * Result of getting metadata.
 */
export interface IGetMetadataResult {
	success: boolean;
	metadata?: IStoredMetadata | null;
	error?: string;
}
