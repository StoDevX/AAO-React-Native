export function filterValue(...arr: string[]) {
	return arr.map((item) => ({title: item}))
}
