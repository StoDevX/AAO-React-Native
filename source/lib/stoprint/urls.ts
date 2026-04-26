import ky from 'ky'

export const PAPERCUT = 'https://papercut.stolaf.edu'
export const PAPERCUT_API = 'https://papercut.stolaf.edu/rpc/api/rest/internal/'
export const PAPERCUT_MOBILE_RELEASE_API = `${PAPERCUT_API}mobilerelease/api/`

export const STOPRINT_HELP_PAGE = 'https://wp.stolaf.edu/it/stoprint/'

export const papercutApi = ky.create({
	baseUrl: PAPERCUT_API,
	headers: new Headers({
		'Content-Type': 'application/x-www-form-urlencoded',
		Origin: PAPERCUT,
	}),
})

export const mobileReleaseApi = papercutApi.extend({
	baseUrl: PAPERCUT_MOBILE_RELEASE_API,
})
