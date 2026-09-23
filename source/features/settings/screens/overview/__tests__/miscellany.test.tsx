import * as React from 'react'
import {render, screen} from '@testing-library/react-native'

import {MiscellanySection} from '../miscellany'

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../../testing/expo-ui-mock') as typeof import('../../../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../../testing/expo-ui-mock') as typeof import('../../../../../testing/expo-ui-mock')
})
jest.mock('expo-router', () => ({useRouter: () => ({navigate: jest.fn()})}))
jest.mock('@frogpond/open-url', () => ({trackedOpenUrl: jest.fn()}))

describe('MiscellanySection', () => {
	/// Contributing opens GitHub, so it must say it leaves the app.
	it('marks Contributing as leaving the app', async () => {
		await render(<MiscellanySection />)

		expect(screen.getByRole('link', {name: 'Contributing'})).toBeOnTheScreen()
	})
})
