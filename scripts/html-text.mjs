// Turns fragments of scraped HTML into plain text. Pure, like the parsers
// that use it: scripts/bonapp-schedule.mjs and scripts/student-wages.mjs.

const NAMED = {nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'"}

/** Decodes numeric and the common named character references. */
export function decodeEntities(html) {
	return html.replaceAll(/&(#x[0-9a-f]+|#\d+|[a-z]+);/giu, (entity, body) => {
		if (body.startsWith('#x') || body.startsWith('#X')) {
			return String.fromCodePoint(Number.parseInt(body.slice(2), 16))
		}
		if (body.startsWith('#')) {
			return String.fromCodePoint(Number(body.slice(1)))
		}
		return NAMED[body.toLowerCase()] ?? entity
	})
}

/** The text of an HTML fragment: tags become spaces, runs of whitespace one space. */
export function htmlText(html) {
	return decodeEntities(html.replaceAll(/<[^>]+>/gu, ' '))
		.replaceAll(/\s+/gu, ' ')
		.trim()
}
