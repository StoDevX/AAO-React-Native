import {beforeEach, expect, test} from '@jest/globals'
import {useMessStore} from '../store'

beforeEach(() => {
	useMessStore.setState({lastSign: null})
})

test('remembers no sign at first', () => {
	expect(useMessStore.getState().lastSign).toBeNull()
})

test('setSign remembers the sign the reader chose', () => {
	useMessStore.getState().setSign('taurus')
	expect(useMessStore.getState().lastSign).toBe('taurus')
})

test('setSign replaces the sign remembered before', () => {
	useMessStore.getState().setSign('taurus')
	useMessStore.getState().setSign('gemini')
	expect(useMessStore.getState().lastSign).toBe('gemini')
})
