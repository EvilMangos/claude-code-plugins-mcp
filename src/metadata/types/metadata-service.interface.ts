import type { GetMetadataInput } from "../schemas/get-metadata.schema.js";
import type { SaveMetadataInput } from "../schemas/save-metadata.schema.js";
import type { IGetMetadataResult } from "./get-metadata-result.interface.js";
import type { ISaveMetadataResult } from "./save-metadata-result.interface.js";

/**
 * Service layer interface for metadata operations.
 */
export interface IMetadataService {
	saveMetadata(input: SaveMetadataInput): Promise<ISaveMetadataResult>;
	getMetadata(input: GetMetadataInput): Promise<IGetMetadataResult>;
	taskExists(taskId: string): boolean;
}
