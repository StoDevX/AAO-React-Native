import {link, mkdir, readFile, rename, rm, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {isDeepStrictEqual} from 'node:util'
import {format} from 'oxfmt'
import {CST, Document, isMap, isScalar, isSeq, parseDocument, Scalar, visit} from 'yaml'

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

/** Each folded paragraph's value as parsed, which tells one an edit left alone. */
const foldedAsParsed = new WeakMap()

/** `text` parsed, each node keeping its source, which `written` copies an unchanged folded paragraph from. */
function parsed(text) {
	let doc = parseDocument(text, {keepSourceTokens: true})
	visit(doc, {
		Scalar(_, node) {
			if (node.type === Scalar.BLOCK_FOLDED && node.srcToken) {
				foldedAsParsed.set(node, node.value)
			}
		},
	})
	return doc
}

/**
 * `doc` as text, each folded paragraph it did not change wrapped where the
 * file wrapped it. Written unwrapped, a folded paragraph would come out on one
 * line, which the formatter leaves as it is.
 */
function unwrappedKeepingFolds(doc) {
	let kept = []
	visit(doc, {
		Scalar(_, node) {
			if (node.type === Scalar.BLOCK_FOLDED && foldedAsParsed.get(node) === node.value) {
				kept.push(node)
			}
		},
	})
	let text = doc.toString(TO_STRING_OPTIONS)
	if (kept.length === 0) return text
	// each paragraph is written as a plain mark, which its source then replaces
	let marks = kept.map((_, index) => `dataEditorFolded${index}x${Date.now()}`)
	let marked
	try {
		kept.forEach((node, index) => Object.assign(node, {value: marks[index], type: Scalar.PLAIN}))
		marked = doc.toString(TO_STRING_OPTIONS)
	} finally {
		kept.forEach((node) =>
			Object.assign(node, {value: foldedAsParsed.get(node), type: Scalar.BLOCK_FOLDED}),
		)
	}
	let spliced = kept.reduce(
		(sofar, node, index) =>
			sofar.replace(marks[index], () => CST.stringify(node.srcToken).replace(/\n$/u, '')),
		marked,
	)
	// a paragraph moved to another depth would be indented wrongly, so it is written unwrapped instead
	return isDeepStrictEqual(parseDocument(spliced).toJS(), doc.toJS()) ? spliced : text
}

/** `doc` written the way the repo's formatter writes `file`. */
async function written(file, doc) {
	let {code, errors} = await format(file, unwrappedKeepingFolds(doc), FORMAT_OPTIONS)
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

/**
 * Where an edit is written before it replaces `filename`: beside it, under a
 * `_` name every data script skips, so one left by a crash is never read as data.
 */
export function tempFileFor(filename) {
	return path.join(path.dirname(filename), `_${path.basename(filename)}.next`)
}

/** `text` parsed and written back, which for a file in the repo's style is `text` again. */
export function roundTrip(file, text) {
	let doc = parsed(text)
	if (doc.errors.length > 0) throw new Error(doc.errors[0].message)
	return written(file, doc)
}

/** A node for `value` styled like the data files: flow rows, quoted times, and the style of the node it `replaced`. */
function styled(doc, parentPath, value, replaced) {
	let node = doc.createNode(value)
	let parent = doc.getIn(parentPath, true)
	let sibling = isSeq(parent) ? parent.items[0] : isMap(parent) ? parent.items[0]?.value : undefined
	let inRows = FLOW_ROWS.has(String(parentPath.at(-1)))
	if (isMap(node) && ((isMap(sibling) && sibling.flow) || inRows)) node.flow = true
	// a list beside lists written on one line, as a timetable's trips or a stop's coordinates, is written so too
	if (isSeq(node) && isSeq(sibling) && sibling.flow) node.flow = true
	// a list or map replacing one keeps its style, as a colour's `[48, 63, 102]` does; an
	// empty one is written `[]` in any style, so says nothing
	let sameKind = (isSeq(node) && isSeq(replaced)) || (isMap(node) && isMap(replaced))
	if (sameKind && replaced.items.length > 0) node.flow = Boolean(replaced.flow)
	// a time is quoted as the times beside it are: an hours file quotes them, a bus timetable doesn't
	let timeStyle = 'QUOTE_SINGLE'
	if (sibling !== undefined) {
		visit(sibling, {
			Scalar(_, scalar) {
				if (typeof scalar.value === 'string' && TIME.test(scalar.value)) {
					timeStyle = scalar.type === 'PLAIN' ? 'PLAIN' : 'QUOTE_SINGLE'
					return visit.BREAK
				}
			},
		})
	}
	visit(node, {
		Pair(_, pair) {
			if (isScalar(pair.key) && FLOW_ROWS.has(String(pair.key.value)) && isSeq(pair.value)) {
				for (let row of pair.value.items) if (isMap(row)) row.flow = true
			}
		},
		Scalar(_, scalar) {
			if (typeof scalar.value === 'string' && TIME.test(scalar.value)) scalar.type = timeStyle
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
	if (!Object.hasOwn(op, 'value')) throw new Error('an edit needs a value or delete')
	let existing = doc.getIn(op.path, true)
	if (isScalar(existing) && (op.value === null || typeof op.value !== 'object')) {
		// a time written bare, as a bus timetable writes them, stays bare; any other is quoted
		let bareTime =
			typeof existing.value === 'string' && TIME.test(existing.value) && existing.type === 'PLAIN'
		existing.value = op.value
		if (typeof op.value === 'string' && TIME.test(op.value) && !bareTime) {
			existing.type = 'QUOTE_SINGLE'
		}
		return
	}
	// an emptied list is written `hours: []`, and a row added to it goes on a line of its own
	let parent = doc.getIn(op.path.slice(0, -1), true)
	if (isSeq(parent) && FLOW_ROWS.has(String(op.path.at(-2)))) parent.flow = false
	doc.setIn(op.path, styled(doc, op.path.slice(0, -1), op.value, existing))
}

/** Why the first of `Promise.allSettled`'s results failed, or undefined if none did. */
const firstFailure = (results) => results.find((result) => result.status === 'rejected')?.reason

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
		let doc = parsed(await readFile(filename, 'utf8'))
		if (doc.errors.length > 0) throw new Error(`${file}: ${doc.errors[0].message}`)
		return {filename, doc}
	}

	/** `file`'s value. */
	async load(file) {
		return (await this.#parse(file)).doc.toJS()
	}

	/** Writes `text` to `filename` whole: a reader never sees half a file. */
	async #replace(filename, text) {
		let next = tempFileFor(filename)
		try {
			await writeFile(next, text)
			await rename(next, filename)
		} finally {
			await rm(next, {force: true})
		}
	}

	/** Applies `ops` in order, writes the file, and returns its new value. */
	async edit(file, ops) {
		let {filename, doc} = await this.#parse(file)
		for (let op of ops) apply(doc, op)
		await this.#replace(filename, await written(file, doc))
		return doc.toJS()
	}

	/** Writes a new file holding `value`. Fails if `file` is already there. */
	async create(file, value) {
		let filename = inside(this.#root, file)
		await mkdir(path.dirname(filename), {recursive: true})
		// written whole beside it, then linked into place: a reader or a crash never
		// meets half a file, and the link, unlike a rename, fails on a name already taken
		let staged = tempFileFor(filename)
		try {
			await writeFile(staged, await written(file, new Document(value)))
			await link(staged, filename)
		} finally {
			await rm(staged, {force: true})
		}
	}

	/** Removes `file`. */
	async remove(file) {
		await rm(inside(this.#root, file))
	}

	/**
	 * Gives each file in `moves` its new name. Every file is first set aside
	 * under a `_` name, so a move onto a name another move frees never
	 * overwrites it; a failure puts back what had moved.
	 */
	async rename(moves) {
		let steps = moves.map(({from, to}) => {
			let source = inside(this.#root, from)
			return {
				source,
				aside: path.join(path.dirname(source), `_${path.basename(source)}.moving`),
				target: inside(this.#root, to),
			}
		})
		// each phase moves distinct names, so its renames can run together
		let setAside = await Promise.allSettled(steps.map((step) => rename(step.source, step.aside)))
		let failed = firstFailure(setAside)
		if (failed === undefined) {
			let placed = await Promise.allSettled(steps.map((step) => rename(step.aside, step.target)))
			failed = firstFailure(placed)
			if (failed === undefined) return
			await Promise.allSettled(
				steps.map((step, index) =>
					placed[index].status === 'fulfilled' ? rename(step.target, step.aside) : undefined,
				),
			)
		}
		await Promise.allSettled(
			steps.map((step, index) =>
				setAside[index].status === 'fulfilled' ? rename(step.aside, step.source) : undefined,
			),
		)
		throw failed
	}

	/**
	 * Puts the items of the list or map at `listPath` in the order of `keys`,
	 * their indexes or names. The nodes themselves move, so a comment above an
	 * item moves with it.
	 */
	async reorderList(file, listPath, keys) {
		let {filename, doc} = await this.#parse(file)
		let list = listPath.length === 0 ? doc.contents : doc.getIn(listPath, true)
		let known = isSeq(list)
			? list.items.map((_, index) => index)
			: isMap(list)
				? list.items.map((pair) => pair.key?.value)
				: []
		// a stale order would drop items, or write one twice
		if (
			keys.length !== known.length ||
			new Set(keys).size !== keys.length ||
			!keys.every((key) => known.includes(key))
		) {
			throw new Error(`An order of ${file} must hold every item once`)
		}
		if (isSeq(list)) {
			list.items = keys.map((index) => list.items[index])
		} else if (isMap(list)) {
			list.items = keys.map((key) => list.items.find((pair) => pair.key?.value === key))
		} else {
			throw new Error(`${file} has no list at ${listPath.join('.')}`)
		}
		await this.#replace(filename, await written(file, doc))
	}

	/** `file` as text, for a document edited as prose. */
	readText(file) {
		return readFile(inside(this.#root, file), 'utf8')
	}

	/**
	 * Replaces `file` with `text`, unless it no longer holds `expected`, the
	 * text the editor began from: an update or a revert since then is not
	 * written over.
	 */
	async writeText(file, text, expected) {
		let filename = inside(this.#root, file)
		if (expected !== undefined && (await readFile(filename, 'utf8')) !== expected) {
			throw new Error(`${file} changed since it was opened`)
		}
		await this.#replace(filename, text)
	}
}
