import type {Run} from '../types'

/** Characters CommonMark can read as syntax, escaped so a story's own asterisks and brackets stay literal. */
const SYNTAX = /[\\`*_[\]()#+\-.!~<&]/gu

const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u

function escapeText(text: string): string {
	return text.replaceAll(SYNTAX, (char) => `\\${char}`)
}

/** A link target with the characters that would end or break the `(…)` encoded. */
function escapeHref(href: string): string {
	return href.replaceAll(' ', '%20').replaceAll('(', '%28').replaceAll(')', '%29')
}

/**
 * One run's Markdown. `before` and `after` are the characters the neighbouring runs put next to it,
 * or '' at either end of the paragraph.
 */
function runToMarkdown(run: Run, before = '', after = ''): string {
	// Emphasis cannot open or close on a space, so the markers wrap only the words.
	let match = /^(\s*)(.*?)(\s*)$/su.exec(run.text)
	let [lead, core, trail] = [match?.[1] ?? '', match?.[2] ?? '', match?.[3] ?? '']
	// Nor will CommonMark open a marker that follows a letter and precedes punctuation, or close one
	// that follows punctuation and precedes a letter: `word**(note)**` shows its asterisks. Where a
	// word touches the run, its edge punctuation moves outside the markers. A link needs no move,
	// because its brackets already stand between the markers and the word.
	if ((run.bold || run.italic) && !run.href) {
		if (lead === '' && LETTER_OR_DIGIT.test(before)) {
			let edge = /^[\p{P}\p{S}\s]*/u.exec(core)?.[0] ?? ''
			lead = edge
			core = core.slice(edge.length)
		}
		if (trail === '' && LETTER_OR_DIGIT.test(after)) {
			let edge = /[\p{P}\p{S}\s]*$/u.exec(core)?.[0] ?? ''
			trail = edge
			core = core.slice(0, core.length - edge.length)
		}
	}
	if (core === '') return escapeText(run.text)
	core = escapeText(core)
	if (run.italic) core = `*${core}*`
	if (run.bold) core = `**${core}**`
	if (run.href) core = `[${core}](${escapeHref(run.href)})`
	return escapeText(lead) + core + escapeText(trail)
}

/** Runs as inline Markdown for a `markdownEnabled` `Text`. */
export function runsToMarkdown(runs: Run[]): string {
	// Moving punctuation never changes whether a run begins or ends with a letter, so each run's
	// plain rendering tells its neighbours what they will touch.
	let plain = runs.map((run) => runToMarkdown(run))
	return runs
		.map((run, index) => runToMarkdown(run, plain[index - 1]?.at(-1), plain[index + 1]?.at(0)))
		.join('')
}
