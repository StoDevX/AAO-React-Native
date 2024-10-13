export function filterValue(...arr: string[]): {title: string}[] {
	return arr.map((item) => ({title: item}))
}
