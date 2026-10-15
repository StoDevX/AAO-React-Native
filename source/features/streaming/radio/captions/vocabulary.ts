/**
 * One correction to what the recognizer heard. `replace` is given what matched
 * and the text after it, which lets a call sign that is part of a web address
 * stay lower case.
 */
type Rule = {
	name: string
	/** Matched globally. It has no capture groups, so `replace`'s arguments stay as documented. */
	pattern: RegExp
	replace: (match: string, after: string) => string
}

/** A call sign as written in prose, or as the start of a web address. */
function callSign(name: string): (match: string, after: string) => string {
	return (_match, after) => (/^\.[a-z]{2,}\b/iu.test(after) ? name.toLowerCase() : name)
}

/** The same fixed text whatever matched. */
function always(text: string): (match: string, after: string) => string {
	return () => text
}

/**
 * The recognizer's mishearings of the stations' own names, which it gets wrong
 * the same few ways on every station ID. Order matters only where rules could
 * overlap; they do not now. This edits what was recognized, so a wrong rule
 * makes wrong captions: keep it to forms that are unmistakable, and say which
 * were seen. "Seen" means in the real transcripts kept while building this
 * (five hearings of KRLX's station ID, none of KSTO's); "unverified" means
 * reported by hand or a plausible guess, and should be confirmed or dropped.
 */
const RULES: readonly Rule[] = [
	{
		// Seen: "Carolex", "carolax", "Cara X", "Kerallax", "Carallax" (also in "carolax.org").
		// Unverified: the spaced "Carol X", "Keralyx", "Cara lex" and the other prefix and
		// ending combinations.
		name: 'KRLX, heard as a name',
		pattern: /\b(?:cara|carol|carrol|kara|karol|kera)(?:x|ex|ax|lex|lax|llax|lyx)\b/giu,
		replace: callSign('KRLX'),
	},
	{
		// Seen: "Cara X". Capital X on its own, not "Carol Xu" or "Cara X-ray".
		name: 'KRLX, heard as a first name and X',
		pattern: /\b(?:Cara|Carol|Carrol|Kara|Kera)[ -]X(?![\w-])/gu,
		replace: callSign('KRLX'),
	},
	{
		// Unverified: the ending heard as a word.
		name: 'KRLX, heard as a first name and a word',
		pattern: /\b(?:cara|carol|kera)[ -](?:lex|lyx|lax)\b/giu,
		replace: callSign('KRLX'),
	},
	{
		// Seen: "Car X 88.1" while the line was still being heard. "Car X" alone could be
		// a car, so only before the frequency.
		name: 'KRLX, heard as "Car X" before its frequency',
		pattern: /\bCar X(?=,?\s+(?:88|eighty[- ]eight)\b)/gu,
		replace: callSign('KRLX'),
	},
	{
		// Unverified: reported by hand.
		name: 'KRLX, heard as "K or Lex"',
		pattern: /\bK\.? or lex\b/giu,
		replace: callSign('KRLX'),
	},
	{
		// Unverified: reported by hand.
		name: 'KRLX, spelled out',
		pattern: /\bK\.?[ -]R\.?[ -]L\.?[ -]X\b/giu,
		replace: callSign('KRLX'),
	},
	{
		// Unverified: no KSTO station ID was in the transcripts. Only the spelled-out
		// letters, which the recognizer is reported to produce for KRLX.
		name: 'KSTO, spelled out',
		pattern: /\bK\.?[ -]S\.?[ -]T\.?[ -]O\b/giu,
		replace: callSign('KSTO'),
	},
	{
		// Seen: "88.one FM". Unverified: "88 point 1", "eighty-eight point one". A bare
		// "88 one" is left alone, as it could be anything.
		name: '88.1 FM, written out',
		pattern: /\b(?:88|eighty[- ]eight)(?:\.one| point (?:1|one))\b/giu,
		replace: always('88.1'),
	},
	{
		// Seen: "8.one FM", the first 8 dropped. Only before "FM", as "8.one" alone could be
		// a version number.
		name: '88.1 FM, heard with one 8',
		pattern: /\b8\.one(?=\s+FM\b)/giu,
		replace: always('88.1'),
	},
	{
		// Unverified, as the 88.1 forms are not heard for 93.1 in any transcript.
		name: '93.1 FM, written out',
		pattern: /\b(?:93|ninety[- ]three)(?:\.one| point (?:1|one))\b/giu,
		replace: always('93.1'),
	},
	{
		// Seen: "Carlton College". Only with "College": "Carlton" alone is a real name.
		name: 'Carleton College',
		pattern: /\bCarlton College\b/giu,
		replace: always('Carleton College'),
	},
	{
		// Unverified: a phonetic guess at how the name may be heard. A following "'s" is
		// not part of the match, so it stays.
		name: 'St. Olaf',
		pattern: /\b(?:St\.?|Saint)\s+(?:Olive|Olof|Olav|Olaf)\b/giu,
		replace: always('St. Olaf'),
	},
]

/**
 * Corrects the recognizer's mishearings of the stations' names in a caption
 * line, heard or half-heard: a half-heard "Cara" is left, and "Cara X" becomes
 * "KRLX". Normalizing a line twice gives what normalizing it once does.
 */
export function normalizeCaption(text: string): string {
	return RULES.reduce(
		(line, {pattern, replace}) =>
			line.replace(pattern, (match: string, ...rest: unknown[]) => {
				let offset = rest.at(-2) as number
				return replace(match, line.slice(offset + match.length))
			}),
		text,
	)
}
