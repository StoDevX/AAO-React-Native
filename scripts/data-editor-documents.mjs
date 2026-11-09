import {readFile, rename, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {format} from 'oxfmt'
import {isMap, isScalar, isSeq, parseDocument, visit} from 'yaml'

/** How a document is serialized before formatting: unwrapped, so the formatter decides the wrapping. */
export const TO_STRING_OPTIONS = {lineWidth: 0, flowCollectionPadding: false}

/**
 * The repo's `.oxfmtrc.json` settings, which `mise run format:check` holds the
 * data files to. Copied here because the app's workspace has no repo around
 * it; a test keeps the two the same.
 */
export const FORMAT_OPTIONS = {
	useTabs: true,
	singleQuote: true,
	trailingComma: 'all',
	bracketSpacing: false,
	semi: false,
}

/** `doc` written the way the repo's formatter writes `file`. */
async function written(file, doc) {
	let {code, errors} = await format(file, doc.toString(TO_STRING_OPTIONS), FORMAT_OPTIONS)
	if (errors.length > 0) throw new Error(`${file}: ${errors[0].message}`)
	return code
}

/** A time such as `7:30am`, which the data files always single-quote. */
const TIME = /^(?:[1-9]|1[0-2]):[0-5]\d[ap]m$/u

/** Lists whose items the data files write one per line as flow maps. */
const FLOW_ROWS = new Set(['hours', 'links'])

/** `file` resolved inside `root`, or an error for a path that leaves it. */
export function inside(root, file) {
	let resolved = path.resolve(root, file)
	if (!resolved.startsWith(path.resolve(root) + path.sep)) {
		throw new Error(`${file} is outside the workspace`)
	}
	return resolved
}

/** `text` parsed and written back, which for a file in the repo's style is `text` again. */
export async function roundTrip(file, text) {
	let doc = parseDocument(text)
	if (doc.errors.length > 0) throw new Error(doc.errors[0].message)
	return await written(file, doc)
}

/** A node for `value` styled like the data files: flow rows, quoted times. */
function styled(doc, parentPath, value) {
	let node = doc.createNode(value)
	let parent = doc.getIn(parentPath, true)
	let sibling = isSeq(parent) ? parent.items[0] : undefined
	if (isMap(node) && isMap(sibling) && sibling.flow) node.flow = true
	visit(node, {
		Pair(_, pair) {
			if (isScalar(pair.key) && FLOW_ROWS.has(String(pair.key.value)) && isSeq(pair.value)) {
				for (let row of pair.value.items) if (isMap(row)) row.flow = true
			}
		},
		Scalar(_, scalar) {
			if (typeof scalar.value === 'string' && TIME.test(scalar.value)) scalar.type = 'QUOTE_SINGLE'
		},
	})
	return node
}

/** Applies one edit, keeping an existing scalar's quoting when only its value changes. */
function apply(doc, op) {
	if (!Array.isArray(op.path) || op.path.length === 0) throw new Error('an edit needs a path')
	if (op.delete) {
		doc.deleteIn(op.path)
		return
	}
	let existing = doc.getIn(op.path, true)
	if (isScalar(existing) && (op.value === null || typeof op.value !== 'object')) {
		existing.value = op.value
		return
	}
	doc.setIn(op.path, styled(doc, op.path.slice(0, -1), op.value))
}

/**
 * The data files being edited. Each edit parses the file as it is on disk,
 * so comments survive and a file the app changed underneath (a revert, an
 * update to master) is never overwritten with a stale copy.
 */
export class DocumentStore {
	#root

	constructor(root) {
		this.#root = path.resolve(root)
	}

	async #parse(file) {
		let filename = inside(this.#root, file)
		let doc = parseDocument(await readFile(filename, 'utf8'))
		if (doc.errors.length > 0) throw new Error(`${file}: ${doc.errors[0].message}`)
		return {filename, doc}
	}

	/** `file`'s value. */
	async load(file) {
		return (await this.#parse(file)).doc.toJS()
	}

	/** Applies `ops` in order, writes the file, and returns its new value. */
	async edit(file, ops) {
		let {filename, doc} = await this.#parse(file)
		for (let op of ops) apply(doc, op)
		// a reader never sees half a file
		let next = `${filename}.next`
		await writeFile(next, await written(file, doc))
		await rename(next, filename)
		return doc.toJS()
	}
}
