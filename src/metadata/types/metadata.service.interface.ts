import type { CreateMetadataInput } from "../schemas/create-metadata.schema";
import type { GetNextStepInput } from "../schemas/get-next-step.schema";
import type { CreateMetadataResult } from "./create-metadata-result.interface";
import type { GetNextStepResult } from "./get-next-step-result.interface";

/**
 * Service layer interface for metadata operations.
 */
export interface MetadataService {
	createMetadata(input: CreateMetadataInput): Promise<CreateMetadataResult>;
	getNextStep(input: GetNextStepInput): Promise<GetNextStepResult>;
}
