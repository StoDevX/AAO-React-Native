// @flow

import {useState, useEffect} from 'react'

export function useDebounce<T>(value: T, delay: number): T {
	let [debouncedValue, setDebouncedValue] = useState(value)

	useEffect(() => {
		let handler = setTimeout(() => {
			setDebouncedValue(value)
		}, delay)

		return () => {
			clearTimeout(handler)
		}
	}, [value, delay])

	return debouncedValue
}
