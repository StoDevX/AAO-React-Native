import AsyncStorage from '@react-native-async-storage/async-storage'
import {beforeEach, describe, expect, test} from '@jest/globals'

import {CAPTION_DISPLAY_DELAY_MS} from '../../captions/caption-delay'
import {useRadioDevStore} from '../store'

describe('useRadioDevStore', () => {
	beforeEach(async () => {
		await AsyncStorage.clear()
		useRadioDevStore.setState(useRadioDevStore.getInitialState(), true)
	})

	test('starts as the app behaves without it: live captions, the standard delay', () => {
		expect(useRadioDevStore.getInitialState()).toMatchObject({
			captionPresentation: 'live',
			heldBackWords: 1,
			captionDelayMs: CAPTION_DISPLAY_DELAY_MS,
		})
	})

	test('keeps held-back words a whole number from 0 to 3', () => {
		let {setHeldBackWords} = useRadioDevStore.getState()

		setHeldBackWords(2.6)
		expect(useRadioDevStore.getState().heldBackWords).toBe(3)
		setHeldBackWords(9)
		expect(useRadioDevStore.getState().heldBackWords).toBe(3)
		setHeldBackWords(-4)
		expect(useRadioDevStore.getState().heldBackWords).toBe(0)
	})

	test('keeps the delay a multiple of half a second from 0 to 15 seconds', () => {
		let {setCaptionDelayMs} = useRadioDevStore.getState()

		setCaptionDelayMs(5200)
		expect(useRadioDevStore.getState().captionDelayMs).toBe(5000)
		setCaptionDelayMs(5300)
		expect(useRadioDevStore.getState().captionDelayMs).toBe(5500)
		setCaptionDelayMs(99_000)
		expect(useRadioDevStore.getState().captionDelayMs).toBe(15_000)
		setCaptionDelayMs(-1)
		expect(useRadioDevStore.getState().captionDelayMs).toBe(0)
	})

	test('resets every setting to its default', () => {
		let state = useRadioDevStore.getState()
		state.setCaptionPresentation('two-tone')
		state.setHeldBackWords(3)
		state.setCaptionDelayMs(1500)

		useRadioDevStore.getState().reset()

		expect(useRadioDevStore.getState()).toMatchObject({
			captionPresentation: 'live',
			heldBackWords: 1,
			captionDelayMs: CAPTION_DISPLAY_DELAY_MS,
		})
	})

	test('takes defaults for settings an older or partial save lacks', async () => {
		await AsyncStorage.setItem(
			'radio-dev-settings',
			JSON.stringify({state: {captionPresentation: 'hold-back'}, version: 1}),
		)

		await useRadioDevStore.persist.rehydrate()

		expect(useRadioDevStore.getState()).toMatchObject({
			captionPresentation: 'hold-back',
			heldBackWords: 1,
			captionDelayMs: CAPTION_DISPLAY_DELAY_MS,
		})
	})
})
