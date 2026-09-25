import type {Run} from '../types'

/** Characters CommonMark can read as syntax, escaped so a story's own asterisks and brackets stay literal. */
const SYNTAX = /[\\`*_[\]()#+\-.!~<&]/gu

/** What CommonMark counts as punctuation when deciding whether an emphasis marker can open or close. */
const PUNCTUATION = /[\p{P}\p{S}]/u

const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u

const ZERO_WIDTH_SPACE = '\u200B'

/** A run's Markdown, and whether its emphasis markers sit against punctuation at either edge. */
type Piece = {markdown: string; opensOnPunctuation: boolean; closesOnPunctuation: boolean}

function escapeText(text: string): string {
	return text.replaceAll(SYNTAX, (char) => `\\${char}`)
}

/** A link target with the characters that would end or break the `(…)` encoded. */
function escapeHref(href: string): string {
	return href.replaceAll(' ', '%20').replaceAll('(', '%28').replaceAll(')', '%29')
}

function runToPiece(run: Run): Piece {
	let text = escapeText(run.text)
	// Emphasis cannot open or close on a space, so the markers wrap only the words.
	let match = /^(\s*)(.*?)(\s*)$/su.exec(text)
	let [lead, core, trail] = [match?.[1] ?? '', match?.[2] ?? '', match?.[3] ?? '']
	if (core === '') return {markdown: text, opensOnPunctuation: false, closesOnPunctuation: false}
	// A link's brackets shield its emphasis markers from the neighbouring runs.
	let bareEmphasis = (run.bold || run.italic) && !run.href
	let opensOnPunctuation = Boolean(bareEmphasis) && lead === '' && PUNCTUATION.test(core.charAt(0))
	let closesOnPunctuation =
		Boolean(bareEmphasis) && trail === '' && PUNCTUATION.test(core.at(-1) ?? '')
	if (run.italic) core = `*${core}*`
	if (run.bold) core = `**${core}**`
	if (run.href) core = `[${core}](${escapeHref(run.href)})`
	return {markdown: lead + core + trail, opensOnPunctuation, closesOnPunctuation}
}

/** Runs as inline Markdown for a `markdownEnabled` `Text`. */
export function runsToMarkdown(runs: Run[]): string {
	let result = ''
	let previous: Piece | undefined
	for (let piece of runs.map(runToPiece)) {
		// CommonMark will not open a marker that follows a letter and precedes punctuation, nor close
		// one that follows punctuation and precedes a letter, so `word**(note)**` shows its asterisks.
		// A zero-width space between the two runs lets the marker open or close without a visible gap.
		let opensAgainstWord = piece.opensOnPunctuation && LETTER_OR_DIGIT.test(result.at(-1) ?? '')
		let closesAgainstWord =
			previous?.closesOnPunctuation && LETTER_OR_DIGIT.test(piece.markdown.charAt(0))
		if (opensAgainstWord || closesAgainstWord) result += ZERO_WIDTH_SPACE
		result += piece.markdown
		previous = piece
	}
	return result
}
