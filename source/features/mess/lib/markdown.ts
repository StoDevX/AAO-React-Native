import type {Run} from '../types'

/** Characters CommonMark can read as syntax, escaped so a story's own asterisks and brackets stay literal. */
const SYNTAX = /[\\`*_[\]()#+\-.!]/gu

function escapeText(text: string): string {
	return text.replaceAll(SYNTAX, (char) => `\\${char}`)
}

/** A link target with the characters that would end or break the `(…)` encoded. */
function escapeHref(href: string): string {
	return href.replaceAll(' ', '%20').replaceAll('(', '%28').replaceAll(')', '%29')
}

function runToMarkdown(run: Run): string {
	let text = escapeText(run.text)
	// Emphasis cannot open or close on a space, so the markers wrap only the words.
	let match = /^(\s*)(.*?)(\s*)$/su.exec(text)
	let [lead, core, trail] = [match?.[1] ?? '', match?.[2] ?? '', match?.[3] ?? '']
	if (core === '') return text
	if (run.italic) core = `*${core}*`
	if (run.bold) core = `**${core}**`
	if (run.href) core = `[${core}](${escapeHref(run.href)})`
	return lead + core + trail
}

/** Runs as inline Markdown for a `markdownEnabled` `Text`. */
export function runsToMarkdown(runs: Run[]): string {
	return runs.map(runToMarkdown).join('')
}
