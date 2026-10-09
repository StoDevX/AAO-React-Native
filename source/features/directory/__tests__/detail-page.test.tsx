import * as React from 'react'
import {render, screen} from '@testing-library/react-native'
import {useLocalSearchParams} from 'expo-router'

import DirectoryDetailPage from '../../../../app/directory/[index]'
import {loadBeforeTests} from '../../../testing/load-before-tests'
import {useCampusStore} from '../../campus/store'

loadBeforeTests('Image')

jest.mock('expo-router', () => ({
	Stack: {Screen: () => null, Title: () => null},
	useLocalSearchParams: jest.fn(),
	useRouter: () => ({navigate: jest.fn()}),
}))

describe('the directory detail page', () => {
	beforeEach(() => {
		useCampusStore.setState({campus: 'edu.stolaf'})
	})

	/// A link like `AllAboutOlaf://directory/0` names an index but not the
	/// search it indexes into, so there is no entry to look up.
	it('shows Entry Not Found when the link names no search', async () => {
		jest.mocked(useLocalSearchParams).mockReturnValue({index: '0'})

		await render(<DirectoryDetailPage />)

		expect(screen.getByText('Entry Not Found')).toBeOnTheScreen()
	})
	// A URL can reach the page on a campus without one.
	it('says a campus without a directory has none', async () => {
		useCampusStore.setState({campus: 'edu.carleton'})
		jest.mocked(useLocalSearchParams).mockReturnValue({index: '0'})

		await render(<DirectoryDetailPage />)

		expect(screen.getByText('No Directory')).toBeOnTheScreen()
	})
})
