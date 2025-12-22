import type { CreateMetadataInput } from "../schemas/create-metadata.schema.js";
import type { GetNextStepInput } from "../schemas/get-next-step.schema.js";
import type { ICreateMetadataResult } from "./create-metadata-result.interface.js";
import type { IGetNextStepResult } from "./get-next-step-result.interface.js";

/**
 * Service layer interface for metadata operations.
 */
export interface IMetadataService {
	createMetadata(input: CreateMetadataInput): Promise<ICreateMetadataResult>;
	getNextStep(input: GetNextStepInput): Promise<IGetNextStepResult>;
	taskExists(taskId: string): boolean;
}
