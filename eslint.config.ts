import { ESLint, Linter } from "eslint";
import js from "@eslint/js";
import tsparser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettierPlugin from "eslint-plugin-prettier/recommended";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";

const sanitizeGlobals = (globalsObj: Record<string, unknown>) =>
	Object.fromEntries(
		Object.entries(globalsObj).map(([key, value]) => [key.trim(), value])
	);

const config: Linter.Config[] = [
	js.configs.recommended,
	prettierPlugin,
	eslintConfigPrettier,
	{
		files: ["**/*.ts"],
		languageOptions: {
			parser: tsparser,
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...sanitizeGlobals(globals.builtin),
				...sanitizeGlobals(globals.node),
				...sanitizeGlobals(globals.jest),
				React: "readonly",
			},
		},
		plugins: {
			"@typescript-eslint": tsPlugin as unknown as ESLint.Plugin,
		},
		rules: {
			"array-callback-return": "error",
			"no-await-in-loop": "warn",
			"no-constructor-return": "error",
			"no-new-native-nonconstructor": "error",
			"no-self-compare": "error",
			"no-template-curly-in-string": "warn",
			"no-unused-private-class-members": "warn",
			"no-use-before-define": "error",
			"@typescript-eslint/ban-ts-comment": "off",
			"no-mixed-spaces-and-tabs": "off",
			"sort-imports": [
				"warn",
				{
					ignoreCase: false,
					ignoreDeclarationSort: true,
					ignoreMemberSort: false,
					memberSyntaxSortOrder: ["none", "all", "multiple", "single"],
					allowSeparatedGroups: true,
				},
			],
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ varsIgnorePattern: "^ApiTagEnum$", ignoreRestSiblings: true },
			],
		},
		settings: {
			node: "detect",
		},
	},
	{
		files: ["**/*.js", "migrate-mongo-config.js", "migrations/**/*.js"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "commonjs",
			globals: {
				...sanitizeGlobals(globals.builtin),
				...sanitizeGlobals(globals.node),
				...sanitizeGlobals(globals.commonjs),
			},
		},
		rules: {
			"no-unused-vars": "error",
			"no-mixed-spaces-and-tabs": "off",
		},
	},
];

export default config;
