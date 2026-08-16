import {
	innerTextWithSpaces,
	isTag,
	nodesToMarkdown,
	parseHtml,
	type ChildNode,
} from '@frogpond/html-lib'
import type {JobField} from '../types'

/// The labels worth a row of their own, keyed by their normalised form.
const PROMOTED = new Map<string, string>([
	['department name', 'Department'],
	['wage range', 'Wage'],
	['length of position', 'Length'],
	['contact person/supervisor', 'Contact'],
	['classification', 'Classification'],
])

/// Reliable, but no use to a student: the title duplicates the requisition's
/// own, the unit number is HR accounting, and the employer address is the
/// college's, on every posting.
const DROPPED = new Set([
	'job title',
	'unit number',
	'unit number (5 digits)',
	'name and address of employer',
])

/// Some postings number their headings ("I. Description of the Position"), so
/// the numeral comes off before matching.
const LEADING_NUMERAL = /^[ivx]+\.\s*/iu

function normaliseLabel(label: string): string {
	return label.trim().replace(LEADING_NUMERAL, '').trim().toLowerCase()
}

const BOLD_STYLE = /font-weight:\s*(?:700|800|900|bold)/iu

function isBoldElement(node: ChildNode): boolean {
	if (!isTag(node)) return false

	let tag = node.name.toLowerCase()
	if (tag === 'b' || tag === 'strong') return true
	return BOLD_STYLE.test(node.attribs['style'] ?? '')
}

const LIST_TAGS = new Set(['ul', 'ol'])

/// The nodes a label would live among. A run that is one wrapping element --
/// the usual `<p>` -- is labelled by what is inside it, while a list is not
/// labelled at all, so it stays whole.
function contentOf(run: ChildNode[]): ChildNode[] {
	let only = run.length === 1 ? run[0] : undefined
	if (!only || !isTag(only) || LIST_TAGS.has(only.name.toLowerCase())) return run
	return only.children
}

function textOf(nodes: ChildNode[]): string {
	return nodes
		.map((node) => innerTextWithSpaces(node))
		.filter((text) => text !== '')
		.join(' ')
}

/// A run is labelled when its first content is bold text carrying a colon,
/// which is how this college's posting template marks every heading.
///
/// The colon has to fall inside the bold text, but not necessarily at its end:
/// most runs bold only the label ("**Wage Range:** $12.00"), while some bold
/// the value along with it ("**Unit Number (5 digits): 11725**"). A colon
/// appearing later in the run's prose is not a heading and must not split it.
function labelOf(run: ChildNode[]): {label: string; value: string} | undefined {
	let content = contentOf(run)
	let first = content.find((node) => isTag(node) || innerTextWithSpaces(node) !== '')
	if (!first || !isBoldElement(first)) return undefined

	let heading = innerTextWithSpaces(first)
	let whole = textOf(content)

	let colon = whole.indexOf(':')
	if (colon === -1 || colon >= heading.length) return undefined

	return {label: whole.slice(0, colon), value: whole.slice(colon + 1).trim()}
}

const LINE_BREAK = 'br'

/// A line break, however the editor wrapped it. These descriptions do not
/// write `<br>` bare -- they write `<span><br></span>` -- so a tag holding
/// nothing but breaks counts as one.
function isLineBreak(node: ChildNode): boolean {
	if (!isTag(node)) return false
	if (node.name.toLowerCase() === LINE_BREAK) return true
	if (innerTextWithSpaces(node) !== '') return false
	return node.children.some(isLineBreak)
}

/// The template's own unit of meaning: one label and its value.
///
/// Most postings give each label its own paragraph, but some run them all
/// together in one paragraph separated by `<br>`. Read whole, such a paragraph
/// lets the first label swallow every other label's text, so a run of siblings
/// between line breaks -- not the paragraph -- is what gets labelled.
///
/// A block with no line break in it stays intact, because splitting a list into
/// loose `<li>` nodes would lose its bullets.
function runsOf(html: string): ChildNode[][] {
	let doc = parseHtml(html)
	let runs: ChildNode[][] = []

	let visit = (nodes: ChildNode[]): void => {
		for (let node of nodes) {
			if (!isTag(node)) continue

			// A wrapping div is not itself a block; its children are.
			if (node.name.toLowerCase() === 'div') {
				visit(node.children)
				continue
			}

			if (!node.children.some(isLineBreak)) {
				runs.push([node])
				continue
			}

			let current: ChildNode[] = []
			for (let child of node.children) {
				if (isLineBreak(child)) {
					if (current.length > 0) runs.push(current)
					current = []
					continue
				}
				current.push(child)
			}
			if (current.length > 0) runs.push(current)
		}
	}

	visit(doc.children)
	return runs
}

export function parseDescription(html: string): {fields: JobField[]; body: string} {
	let fields: JobField[] = []
	let kept: ChildNode[][] = []

	for (let run of runsOf(html)) {
		let labelled = labelOf(run)

		if (labelled) {
			let normalised = normaliseLabel(labelled.label)

			if (DROPPED.has(normalised)) continue

			let promoted = PROMOTED.get(normalised)
			if (promoted) {
				// An empty value is the template's blank line, not a fact worth a
				// row -- and not worth repeating in the body either.
				if (labelled.value) fields.push({label: promoted, value: labelled.value})
				continue
			}
		}

		kept.push(run)
	}

	let body = kept
		.map((run) => nodesToMarkdown(run))
		.filter((markdown) => markdown !== '')
		.join('\n\n')

	return {fields, body}
}
