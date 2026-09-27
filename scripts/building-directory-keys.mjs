// What is wrong with the building directories' map keys: a file's building,
// or an entry's point, that names no map feature, or a file named for one
// building while listing another. Kept apart from the network fetch so it can
// be tested with a fixed set of ids.

/**
 * @param {Array<{filename: string, building: string, points: string[]}>} files
 * @param {Set<string>} featureIds
 * @returns {string[]} one line per problem, in file order
 */
export function directoryKeyProblems(files, featureIds) {
	let problems = []
	for (let {filename, building, points} of files) {
		let named = filename.replace(/\.yaml$/u, '')
		if (named !== building) {
			problems.push(`${filename}: named for "${named}" but lists building "${building}"`)
		}
		if (!featureIds.has(building)) {
			problems.push(`${filename}: building "${building}" is not a known feature id`)
		}
		for (let point of points) {
			if (!featureIds.has(point)) {
				problems.push(`${filename}: point "${point}" is not a known feature id`)
			}
		}
	}
	return problems
}
