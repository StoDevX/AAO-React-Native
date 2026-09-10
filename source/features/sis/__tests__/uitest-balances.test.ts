import {UITEST_BALANCES} from '../../../lib/financials/__fixtures__/balances'
import {balanceValue} from '../lib'

/// The fixtures exist so the balances layout can be photographed with figures
/// in it. That only holds if every tile has something to show, and if the
/// awkward ones survive the formatting the screen puts them through.
describe('the UI test balances', () => {
	it('fills every tile', () => {
		let {flex, ole, print, daily, weekly} = UITEST_BALANCES

		for (let value of [flex, ole, print, daily, weekly]) {
			expect(balanceValue(value, false)).not.toBe('N/A')
		}
	})

	it('names a meal plan, so that row is drawn at all', () => {
		expect(UITEST_BALANCES.plan).toBeTruthy()
	})

	/// A zero balance is the case most likely to be mistaken for a missing one,
	/// which is why one of the fixtures is zero.
	it('keeps a zero balance rather than showing it as missing', () => {
		expect(UITEST_BALANCES.ole).toBe('$0.00')
		expect(balanceValue(UITEST_BALANCES.ole, false)).toBe('$0.00')
	})
})
