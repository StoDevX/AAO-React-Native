// Ajv's errors in the words the data editor shows: each field named by its
// schema `title`, so a contributor never sees a key or a JSON pointer.

const keysOfPointer = (pointer) =>
	pointer
		.split('/')
		.filter(Boolean)
		.map((key) => key.replaceAll('~1', '/').replaceAll('~0', '~'))

/** The schema of the value at `keys` inside a value `schema` describes, or null. */
function schemaAt(schema, keys) {
	let node = schema
	for (let key of keys) {
		if (node === null) return null
		if (node.properties?.[key] !== undefined) node = node.properties[key]
		else if (/^\d+$/u.test(key) && node.items !== undefined) node = node.items
		else if (typeof node.additionalProperties === 'object') node = node.additionalProperties
		else return null
	}
	return node
}

/** The schema node a JSON pointer such as `#/oneOf/0` names. */
const schemaNode = (schema, pointer) =>
	keysOfPointer(pointer.replace(/^#/u, '')).reduce((node, key) => node?.[key], schema)

/** The field at `keys` as a contributor knows it: its title, or else its key. */
function titleAt(schema, keys) {
	let node = schemaAt(schema, keys)
	if (typeof node?.title === 'string') return node.title
	return keys.length === 0 ? 'This record' : String(keys.at(-1))
}

/** One Ajv error in plain words. `schema` is the file's, with its references inlined. */
export function wordProblem(error, schema) {
	let keys = keysOfPointer(error.instancePath)
	let field = titleAt(schema, keys)
	switch (error.keyword) {
		case 'required':
			return `${titleAt(schema, [...keys, error.params.missingProperty])} is missing`
		case 'pattern':
			if (schemaAt(schema, keys)?.editor === 'phone') {
				return `${field} should be a 10-digit phone number`
			}
			return `${field} is not in the expected form`
		case 'enum':
			return `${field} must be one of ${error.params.allowedValues.join(', ')}`
		case 'additionalProperties':
			return `${field} has a field the app doesn't use: ${error.params.additionalProperty}`
		default:
			return `${field}: ${error.message}`
	}
}

/**
 * Every error in plain words, once each. A `oneOf` whose choices are each one
 * required field ("a phone number or a link") is said as one problem, and the
 * errors Ajv gave for its choices are left out.
 */
export function wordProblems(errors, schema) {
	let choices = errors.filter((error) => error.keyword === 'oneOf' || error.keyword === 'anyOf')
	let insideChoice = (error) =>
		choices.some(
			(choice) =>
				choice !== error &&
				choice.instancePath === error.instancePath &&
				error.schemaPath?.startsWith(`${choice.schemaPath}/`),
		)
	let worded = []
	for (let error of errors) {
		if (insideChoice(error)) continue
		let message = wordProblem(error, schema)
		if (error.keyword === 'oneOf' || error.keyword === 'anyOf') {
			let branches = schemaNode(schema, error.schemaPath)
			let keys = keysOfPointer(error.instancePath)
			let fields = Array.isArray(branches)
				? branches.map((branch) =>
						branch.required?.length === 1 && Object.keys(branch).length === 1
							? branch.required[0]
							: undefined,
					)
				: []
			if (fields.length > 0 && fields.every((field) => field !== undefined)) {
				message = `${fields.map((field) => titleAt(schema, [...keys, field])).join(' or ')} is missing`
			}
		}
		if (
			!worded.some((seen) => seen.message === message && seen.instancePath === error.instancePath)
		) {
			worded.push({message, instancePath: error.instancePath})
		}
	}
	return worded
}
