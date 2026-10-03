import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
import {useLocalSearchParams} from 'expo-router'

import DirectoryDetailPage from '../../../../app/directory/[index]'
import {loadBeforeTests} from '../../../testing/load-before-tests'

loadBeforeTests('Image')

jest.mock('expo-router', () => ({
	Stack: {Screen: () => null},
	useLocalSearchParams: jest.fn(),
	useRouter: () => ({navigate: jest.fn()}),
}))

describe('the directory detail page', () => {
	/// A link like `AllAboutOlaf://directory/0` names an index but not the
	/// search it indexes into, so there is no entry to look up.
	it('shows Entry Not Found when the link names no search', async () => {
		jest.mocked(useLocalSearchParams).mockReturnValue({index: '0'})

		await render(<DirectoryDetailPage />)

		expect(screen.getByText('Entry Not Found')).toBeOnTheScreen()
	})
})
