import AsyncStorage from '@react-native-async-storage/async-storage'
import {beforeEach, describe, expect, test} from '@jest/globals'

import {useRadioStore} from '../store'

describe('hydration', () => {
	beforeEach(async () => {
		await AsyncStorage.clear()
		useRadioStore.setState({showOnHome: true, hydrated: false})
	})

	test('is done once the saved switch has loaded', async () => {
		await AsyncStorage.setItem(
			'radio-preferences',
			JSON.stringify({state: {showOnHome: false}, version: 1}),
		)

		await useRadioStore.persist.rehydrate()

		expect(useRadioStore.getState()).toMatchObject({hydrated: true, showOnHome: false})
	})

	test('is done when the saved switch is corrupt, keeping the default', async () => {
		await AsyncStorage.setItem('radio-preferences', '{not json')

		await useRadioStore.persist.rehydrate()

		expect(useRadioStore.getState()).toMatchObject({hydrated: true, showOnHome: true})
	})
})
