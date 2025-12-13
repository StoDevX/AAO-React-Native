import {act} from '@testing-library/react-native'

import {fallbackFaqs} from '../../faqs/local-faqs'
import {getFaqVersion, useFaqBannerStore} from '../store'

describe('FAQ banner store', () => {
	beforeEach(() => {
		useFaqBannerStore.getState().resetAll()
	})

	it('produces stable versions for identical FAQ content', () => {
		let faq = fallbackFaqs[0]
		let v1 = getFaqVersion(faq)
		let v2 = getFaqVersion({...faq})
		expect(v1).toEqual(v2)
	})

	it('dismisses and restores a banner version', () => {
		let faq = fallbackFaqs[0]
		let version = getFaqVersion(faq)

		act(() => {
			useFaqBannerStore.getState().dismissFaq(faq.id, version)
		})

		expect(useFaqBannerStore.getState().dismissed[faq.id]).toEqual(
			expect.objectContaining({version}),
		)

		act(() => {
			useFaqBannerStore.getState().resetFaq(faq.id)
		})

		expect(useFaqBannerStore.getState().dismissed[faq.id]).toBeUndefined()
	})

	it('resets all banners', () => {
		act(() => {
			useFaqBannerStore.getState().dismissFaq('a', '1')
			useFaqBannerStore.getState().dismissFaq('b', '2')
		})

		expect(useFaqBannerStore.getState().dismissed.a?.version).toEqual('1')
		expect(useFaqBannerStore.getState().dismissed.b?.version).toEqual('2')

		act(() => {
			useFaqBannerStore.getState().resetAll()
		})

		expect(useFaqBannerStore.getState().dismissed).toEqual({})
	})
})
