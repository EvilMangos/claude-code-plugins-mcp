import type { CreateMetadataInput } from "../schemas/create-metadata.schema";
import type { GetNextStepInput } from "../schemas/get-next-step.schema";
import type { ICreateMetadataResult } from "./create-metadata-result.interface";
import type { IGetNextStepResult } from "./get-next-step-result.interface";

/**
 * Service layer interface for metadata operations.
 */
export interface IMetadataService {
	createMetadata(input: CreateMetadataInput): Promise<ICreateMetadataResult>;
	getNextStep(input: GetNextStepInput): Promise<IGetNextStepResult>;
}
