import {describeValue} from '../lib'

describe('describeValue', () => {
	it('counts an array rather than printing it', () => {
		expect(describeValue([1, 2, 3])).toEqual({detail: 'Array(3)', isDrillable: true})
	})

	it('counts an empty array too', () => {
		expect(describeValue([]).detail).toBe('Array(0)')
	})

	it('marks an object as worth opening', () => {
		expect(describeValue({a: 1}).isDrillable).toBe(true)
	})

	/// `typeof null` is 'object', so a null that reached the object branch would
	/// claim to be drillable and open an empty screen.
	it('does not offer to drill into null', () => {
		expect(describeValue(null)).toEqual({detail: 'null', isDrillable: false})
	})

	it('quotes a short string', () => {
		expect(describeValue('hello').detail).toBe('"hello"')
	})

	/// Long values are truncated so one row cannot push the value column off
	/// screen. 20 characters plus an ellipsis.
	it('truncates a long string', () => {
		expect(describeValue('a'.repeat(30)).detail).toBe(`"${'a'.repeat(20)}…"`)
	})

	it('leaves a string of exactly the limit alone', () => {
		expect(describeValue('a'.repeat(20)).detail).toBe(`"${'a'.repeat(20)}"`)
	})

	it('prints numbers and booleans as they are', () => {
		expect(describeValue(42).detail).toBe('42')
		expect(describeValue(false).detail).toBe('false')
	})
})
