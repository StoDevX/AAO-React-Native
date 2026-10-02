import {OLECARD_AUTH_URL} from '../../lib/financials/urls'
import {PAPERCUT_API} from '../../lib/stoprint/urls'
import {isBlockedUrl} from '../blocked'

describe('isBlockedUrl', () => {
	test('blocks the OleCard sign-in', () => {
		expect(isBlockedUrl(OLECARD_AUTH_URL)).toBe(true)
	})

	test('blocks all of PaperCut', () => {
		expect(isBlockedUrl(`${PAPERCUT_API}webclient/users/x/jobs`)).toBe(true)
		expect(isBlockedUrl('https://PAPERCUT.stolaf.edu/')).toBe(true)
	})

	test('lets everything else through', () => {
		expect(isBlockedUrl('https://stolaf.api.frogpond.tech/v1/menus')).toBe(false)
	})
})
