/**
 * Letters with no accent to drop -- Unicode does not decompose them -- spelled
 * the way a reader who cannot type them would. These are the Latin letters
 * lodash's `deburr` mapped, so search keeps matching what it used to.
 */
const UNDECOMPOSABLE: Record<string, string> = {
	Æ: 'Ae',
	æ: 'ae',
	Ð: 'D',
	ð: 'd',
	Đ: 'D',
	đ: 'd',
	Ħ: 'H',
	ħ: 'h',
	ı: 'i',
	Ĳ: 'IJ',
	ĳ: 'ij',
	ĸ: 'k',
	Ŀ: 'L',
	ŀ: 'l',
	Ł: 'L',
	ł: 'l',
	ŉ: "'n",
	Ŋ: 'N',
	ŋ: 'n',
	Ø: 'O',
	ø: 'o',
	Œ: 'Oe',
	œ: 'oe',
	ß: 'ss',
	Þ: 'Th',
	þ: 'th',
	Ŧ: 'T',
	ŧ: 't',
	ſ: 's',
}

const COMBINING_MARKS = /\p{M}/gu
const UNDECOMPOSABLE_LETTERS = new RegExp(`[${Object.keys(UNDECOMPOSABLE).join('')}]`, 'gu')

/** `text` without its accents, so "Mináǧi Kiŋ" can be found by typing "minagi kin". */
export function deburr(text: string): string {
	return text
		.normalize('NFD')
		.replaceAll(COMBINING_MARKS, '')
		.replaceAll(UNDECOMPOSABLE_LETTERS, (letter) => UNDECOMPOSABLE[letter] ?? letter)
}

/**
 * Runs of letters and runs of digits, as search matches them. An ordinal
 * ("4th") stays one word, and so does a contraction ("it's").
 */
const WORD =
	/\d*(?:1st|2nd|3rd|(?![123])\dth)(?=\b|[A-Z_])|\p{L}+(?:['’](?:d|ll|m|re|s|t|ve))?|\p{N}+/gu

/** The words in lowercase `text`, in order. */
export function words(text: string): string[] {
	return text.match(WORD) ?? []
}
