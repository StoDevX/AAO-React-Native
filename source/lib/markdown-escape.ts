/** Characters CommonMark can read as syntax. */
const SYNTAX = /[\\`*_[\]()#+\-.!~<&]/gu

/** `text` with each character CommonMark could read as syntax escaped, so it stays literal. */
export function escapeMarkdownText(text: string): string {
	return text.replaceAll(SYNTAX, (char) => `\\${char}`)
}

/** A link target with the characters that would end or break the `(…)` encoded. */
export function escapeMarkdownHref(href: string): string {
	return href.replaceAll(' ', '%20').replaceAll('(', '%28').replaceAll(')', '%29')
}
