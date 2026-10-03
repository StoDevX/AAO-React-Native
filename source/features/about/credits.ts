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

/** People who wrote the app. */
export const contributors = [
	'Anna Linden',
	'Drew Turnblad',
	'Drew Volz',
	'Elijah Verdoorn',
	'Erich Kauffman',
	'Hannes Carlsen',
	'Hawken Rives',
	'Kris Rye',
	'Margaret Zimmermann',
	'Matt Kilens',
]

/** People who helped without writing code. */
export const acknowledgements = [
	'Brandon Cash',
	'Catherine Paro',
	'Dan Beach',
	'Derek Hanson',
	'Emma Lind',
	'Kris Vatter',
	'Laura Mascotti',
	'Myron Engle',
	'Nick Nooney',
	'Sarah Bresnahan',
	'William Seabrook',
]
