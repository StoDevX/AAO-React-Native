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
 * A bare URL as Apple's parser finds one: a scheme not run on from a letter, up to whitespace or `<`.
 * The parser reads such a span without its escapes, so they would show as backslashes.
 */
const BARE_URL = /(?<!\p{L})(?:https?|ftp):\/\/[^\s<]+/giu

/**
 * Punctuation that closes the sentence or quote around a URL rather than ending the URL: GFM's
 * autolink list, plus the `>` of a `<url>` and closing quotes of any kind, straight or curly.
 */
const TRAILING_PUNCTUATION = /[?!.,:*_~'">\p{Pf}]$/u

/** Each closing bracket a URL can end in, with the bracket that opens it. */
const OPENERS: Record<string, string> = {')': '(', ']': '['}

/** The URL within a bare-URL match, without the punctuation or unmatched bracket that follows it. */
function trimUrl(match: string): string {
	let url = match
	while (TRAILING_PUNCTUATION.test(url) || hasUnmatchedCloser(url)) url = url.slice(0, -1)
	return url
}

/** Whether `url` ends in a `)` or `]` that no opening bracket in it opened. */
function hasUnmatchedCloser(url: string): boolean {
	let closer = url.at(-1) ?? ''
	let opener = OPENERS[closer]
	return opener !== undefined && url.split(closer).length > url.split(opener).length
}

/**
 * Text outside any link, escaped, with each bare URL made an explicit link: a link's text is
 * read with its escapes, where a bare URL's is not.
 *
 * This sees one run at a time, so a URL split across styled runs, such as one whose path is in
 * italics, links only as far as the first run goes, and the rest shows unlinked.
 */
function escapeProse(text: string): string {
	let out = ''
	let from = 0
	for (let match of text.matchAll(BARE_URL)) {
		let url = trimUrl(match[0])
		out += escapeText(text.slice(from, match.index))
		out += `[${escapeText(url)}](${escapeHref(url)})`
		from = match.index + url.length
	}
	return out + escapeText(text.slice(from))
}

/**
 * One run's Markdown. `before` and `after` are the neighbouring runs' edge characters, from `edgeOf`,
 * or '' at either end of the paragraph.
 */
function runToMarkdown(run: Run, before: string, after: string): string {
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
	// A link's own text is already inside a link, so only text outside one has bare URLs to link.
	let escape = run.href ? escapeText : escapeProse
	if (core === '') return escape(run.text)
	core = escape(core)
	if (run.italic) core = `*${core}*`
	if (run.bold) core = `**${core}**`
	if (run.href) core = `[${core}](${escapeHref(run.href)})`
	return escape(lead) + core + escape(trail)
}

/**
 * The character a neighbouring run sets against a run's markers. A styled neighbour's own markers
 * merge with this run's into one delimiter run, so what counts is the text inside them. A link
 * always begins with `[` and ends in `)`, or with whitespace outside them, so it offers no letter.
 */
function edgeOf(run: Run | undefined, index: 0 | -1): string {
	if (!run || run.href) return ''
	return run.text.at(index) ?? ''
}

/** Runs as inline Markdown for a `markdownEnabled` `Text`. */
export function runsToMarkdown(runs: Run[]): string {
	return runs
		.map((run, index) =>
			runToMarkdown(run, edgeOf(runs[index - 1], -1), edgeOf(runs[index + 1], 0)),
		)
		.join('')
}
