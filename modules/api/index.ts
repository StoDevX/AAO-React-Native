import qs from 'query-string'

import {IS_PRODUCTION} from '@frogpond/constants'

let root: string

export function setApiRoot(url: string): void {
	root = url
}

export const API = (
	path: `/${string}`,
	query?: Record<string, any>,
): string => {
	let url = root + path

	if (query) {
		url += `?${qs.stringify(query)}`
	}

	return url
}
