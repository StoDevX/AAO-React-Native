import {OLECARD_AUTH_URL} from '../../lib/financials/urls'
import {PAPERCUT_API} from '../../lib/stoprint/urls'
import {isBlockedUrl} from '../blocked'

describe('isBlockedUrl', () => {
	test('blocks the OleCard sign-in', () => {
		expect(isBlockedUrl(OLECARD_AUTH_URL)).toBe(true)
	})

	test('blocks the OleCard sign-in with a query string, a fragment or an uppercase host', () => {
		expect(isBlockedUrl(`${OLECARD_AUTH_URL}?user=x`)).toBe(true)
		expect(isBlockedUrl(`${OLECARD_AUTH_URL}#top`)).toBe(true)
		expect(isBlockedUrl(OLECARD_AUTH_URL.replace('www.stolaf.edu', 'WWW.STOLAF.EDU'))).toBe(true)
	})

	test('lets another page on the OleCard sign-in host through', () => {
		expect(isBlockedUrl('https://www.stolaf.edu/apps/olecard/')).toBe(false)
	})

	test('blocks all of PaperCut', () => {
		expect(isBlockedUrl(`${PAPERCUT_API}webclient/users/x/jobs`)).toBe(true)
		expect(isBlockedUrl('https://PAPERCUT.stolaf.edu/')).toBe(true)
	})

	test('lets everything else through', () => {
		expect(isBlockedUrl('https://stolaf.frogpond.tech/v1/menus')).toBe(false)
	})
})
