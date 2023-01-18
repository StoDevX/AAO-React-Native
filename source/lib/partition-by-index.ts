function* enumerate<T>(iter: Array<T>): Generator<[number, T]> {
	let i = 0;
	for (let item of iter) {
		yield [i, item]
		i += 1
	}
}

export function partitionByIndex<T>(arr: T[]): [T[], T[]] {
	let evens = [];
	let odds = [];
	for (let [i, item] of enumerate(arr)) {
		if (i % 2 === 0) {
			evens.push(item)
		} else {
			odds.push(item)
		}
	}
	return [evens, odds]
}
