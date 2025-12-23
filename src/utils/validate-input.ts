import type { z } from "zod";
import { formatZodError } from "./format-zod.error";

/**
 * Result of input validation.
 */
export type ValidationResult<T> =
	| { success: true; data: T }
	| { success: false; error: string };

/**
 * Validate input against a Zod schema.
 *
 * @param schema - The Zod schema to validate against
 * @param input - The input to validate
 * @returns A result object with either validated data or an error message
 */
export function validateInput<T>(
	schema: z.ZodType<T>,
	input: unknown
): ValidationResult<T> {
	const parseResult = schema.safeParse(input);

	if (!parseResult.success) {
		return {
			success: false,
			error: formatZodError(parseResult.error),
		};
	}

	return {
		success: true,
		data: parseResult.data,
	};
}
