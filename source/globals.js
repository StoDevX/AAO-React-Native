// @flow

import qs from 'querystring'

const root = 'https://stolaf.api.frogpond.tech/v1'
export const API = (pth: string, query: ?Object = null) => {
	if (process.env.NODE_ENV !== 'production') {
		if (!pth.startsWith('/')) {
			throw new Error('invalid path requested from the api!')
		}
	}
	let url = root + pth
	if (query) {
		url += `?${qs.stringify(query)}`
	}
	return url
}

export const GH_NEW_ISSUE_URL =
	'https://github.com/StoDevX/AAO-React-Native/issues/new'
