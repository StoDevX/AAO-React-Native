import {innerTextWithSpaces, parseHtml} from '@frogpond/html-lib'

/// Zero-width characters the posting editor leaves around values.
const INVISIBLE = /[\u200B-\u200D\uFEFF]/gu

/// A St. Olaf unit: five digits, sometimes behind a two- or three-digit fund
/// ("10-13001", "010-11725") or a five-digit unit of another office, as in
/// the account strings "41066-11300" and "41203-11184-53000-00512". Neither
/// prefix is part of the unit, and data/student-work-areas.yaml lists units
/// without one. When a posting names two units, the first is the one it is
/// filed under.
///
/// ccc-server's `/student-work/units` reads units by the same rule, in
/// `source/student-work/unit-number.ts`; the two must agree.
const UNIT = /^(?:\d{2,3}-|\d{5}-)?(\d{5})(?!\d)/u

/// The unit a "Unit Number" value names, or null when it names none.
export function unitNumber(value: string): string | null {
	let match = UNIT.exec(value.replace(INVISIBLE, '').trim())
	return match?.[1] ?? null
}

/// The template's label, with or without its "(5 digits)" hint.
const LABEL = /unit number(?:\s*\(5 digits\))?\s*:/iu

/// The unit a posting's description names.
///
/// Read from the description's text rather than its labelled runs: some
/// postings wrap the bold label in another element, which `parseDescription`
/// does not recognise as a label. The value is read up to its fifth digit,
/// since the next paragraph's text follows it directly.
export function unitNumberOfDescription(html: string): string | null {
	let text = parseHtml(html)
		.children.map((node) => innerTextWithSpaces(node))
		.join(' ')
	let label = LABEL.exec(text)
	if (!label) return null
	return unitNumber(text.slice(label.index + label[0].length))
}
