import {beforeEach, expect, test} from '@jest/globals'
import {migrate, useMessStore} from '../store'

beforeEach(() => {
	useMessStore.setState({
		lastSign: null,
		openedStories: [],
		stainKind: 'coffee',
		photoTone: 'auto',
		keepPhotoStoriesDark: true,
	})
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

test('recordOpened remembers each story once', () => {
	useMessStore.getState().recordOpened(5)
	useMessStore.getState().recordOpened(7)
	useMessStore.getState().recordOpened(5)
	expect(useMessStore.getState().openedStories).toStrictEqual([5, 7])
})

test('stains are coffee until the reader picks another kind', () => {
	expect(useMessStore.getState().stainKind).toBe('coffee')
	useMessStore.getState().setStainKind('tea')
	expect(useMessStore.getState().stainKind).toBe('tea')
})

test('photos follow the appearance until the reader picks a tone', () => {
	expect(useMessStore.getState().photoTone).toBe('auto')
	useMessStore.getState().setPhotoTone('sepia')
	expect(useMessStore.getState().photoTone).toBe('sepia')
})

test('photo stories stay dark until the reader turns that off', () => {
	expect(useMessStore.getState().keepPhotoStoriesDark).toBe(true)
	useMessStore.getState().setKeepPhotoStoriesDark(false)
	expect(useMessStore.getState().keepPhotoStoriesDark).toBe(false)
})

test('a saved sign from before reading was remembered survives, with no reading and coffee stains', () => {
	expect(migrate({lastSign: 'leo'}, 1)).toStrictEqual({
		lastSign: 'leo',
		openedStories: [],
		stainKind: 'coffee',
		photoTone: 'auto',
		keepPhotoStoriesDark: true,
	})
})

test('a saved state that is not an object starts over', () => {
	expect(migrate(null, 1)).toStrictEqual({
		lastSign: null,
		openedStories: [],
		stainKind: 'coffee',
		photoTone: 'auto',
		keepPhotoStoriesDark: true,
	})
})
