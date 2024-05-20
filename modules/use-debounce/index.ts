import {debounce} from 'lodash'
import {useState, useEffect} from 'react'

export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState(value)

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => {
			clearTimeout(handler)
		}
	}, [value, delay])

	return debouncedValue
}

export const debounceSearch = debounce(
	(query: string, callback: () => void) => {
		if (query.length >= 2) {
			callback()
		}
	},
	1500,
)
