import qs from 'query-string'

import {IS_PRODUCTION} from '@frogpond/constants'

let root: string

export function setApiRoot(url: string): void {
	root = url
}

export const API = (path: string, query: unknown = null): string => {
	if (!IS_PRODUCTION) {
		if (!path.startsWith('/')) {
			throw new Error('invalid path requested from the api!')
		}
	}

	let url = root + path

	if (query) {
		url += `?${qs.stringify(query)}`
	}

	return url
}
