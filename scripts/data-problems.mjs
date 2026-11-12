// Data checks that report every problem they find, not only the first. A
// problem is an Error whose message is one line, beginning with the file it
// is in.

/**
 * The problems `error` holds: each of an AggregateError's, or else the error itself.
 * @param {unknown} error
 * @returns {Error[]}
 */
export function problemsIn(error) {
	if (error instanceof AggregateError) return error.errors.flatMap(problemsIn)
	return [error instanceof Error ? error : new Error(String(error))]
}

/**
 * Runs `check`, adding what it throws to `problems` instead of stopping there.
 * @template T
 * @param {Error[]} problems
 * @param {() => T} check
 * @returns {T | undefined}
 */
export function collecting(problems, check) {
	try {
		return check()
	} catch (error) {
		problems.push(...problemsIn(error))
		return
	}
}

/**
 * Throws `problems` as one error, whose message lists them as each alone would have read.
 * @param {Error[]} problems
 */
export function raise(problems) {
	if (problems.length > 0) {
		throw new AggregateError(problems, problems.map((problem) => problem.message).join('; '))
	}
}

/**
 * A YAML error as one line naming its file: js-yaml's message runs on into a
 * picture of the lines around the mistake. Anything else comes back as it was.
 * @param {string} filename
 * @param {unknown} error
 * @returns {unknown}
 */
export function yamlProblem(filename, error) {
	if (!(error instanceof Error) || error.name !== 'YAMLException' || !('mark' in error)) {
		return error
	}
	let {reason, mark} = /** @type {{reason: string, mark: {line: number, column: number}}} */ (
		/** @type {unknown} */ (error)
	)
	return new Error(`${filename}: ${reason} (${mark.line + 1}:${mark.column + 1})`, {cause: error})
}
