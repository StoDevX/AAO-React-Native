/**
 * The rows a credit's names sit in at a font scale: two columns normally, and
 * a name to a row at the accessibility sizes, where two columns break names
 * mid-word.
 */
export function creditRows(names: ReadonlyArray<string>, fontScale: number): Array<Array<string>> {
	return fontScale > 1.5 ? names.map((name) => [name]) : inTwoColumns(names)
}

/**
 * Lays names out in two columns that read down the left, then down the right,
 * as a printed index does. Each row holds a left name and, if there is one,
 * a right. An odd name out sits at the foot of the left column.
 */
export function inTwoColumns(names: ReadonlyArray<string>): Array<Array<string>> {
	let height = Math.ceil(names.length / 2)
	return names
		.slice(0, height)
		.map((left, row) => (row + height < names.length ? [left, names[row + height]] : [left]))
}
