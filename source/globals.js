// @flow

const root = 'https://stolaf.api.frogpond.tech/v1'
export const API = pth => {
	if (process.env.NODE_ENV !== 'production') {
		if (!pth.startsWith('/')) {
			throw new Error('invalid path requested from the api!')
		}
	}
	return root + pth
}

export const GH_NEW_ISSUE_URL =
	'https://github.com/StoDevX/AAO-React-Native/issues/new'
