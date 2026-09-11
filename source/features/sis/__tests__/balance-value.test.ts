import {balanceValue} from '../lib'

describe('balanceValue', () => {
	it('shows a balance the server sent', () => {
		expect(balanceValue('12.34', false)).toBe('12.34')
	})

	/// A balance of zero is a real answer and must not read as missing.
	it('shows a zero balance rather than treating it as absent', () => {
		expect(balanceValue('0.00', false)).toBe('0.00')
	})

	it('says N/A when the server sent nothing', () => {
		expect(balanceValue(undefined, false)).toBe('N/A')
	})

	/// While loading there is no answer yet, which is different from not having
	/// one -- an ellipsis rather than N/A.
	it('waits rather than claiming N/A while loading', () => {
		expect(balanceValue(undefined, true)).toBe('…')
		expect(balanceValue('12.34', true)).toBe('…')
	})
})
