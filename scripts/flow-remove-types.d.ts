declare module 'flow-remove-types' {
	interface Options {
		all?: boolean
		pretty?: boolean
		ignoreUninitializedFields?: boolean
	}

	interface Result {
		toString(): string
	}

	function removeTypes(code: string, options?: Options): Result
	export default removeTypes
}
