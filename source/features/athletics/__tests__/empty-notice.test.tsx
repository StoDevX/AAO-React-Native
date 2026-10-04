import * as React from 'react'
import {render} from '@testing-library/react-native'

import {EmptyListNotice} from '../empty-notice'
import {useFilterStore} from '../store'

describe('EmptyListNotice', () => {
	beforeEach(() => {
		useFilterStore.setState({selectedSports: [], availableSports: []})
	})

	it('says there are no games', async () => {
		let {getByText} = await render(<EmptyListNotice />)

		expect(getByText('No Games')).toBeTruthy()
	})

	it('omits the filter hint when the selector says not to show it', async () => {
		let {queryByText} = await render(<EmptyListNotice />)

		expect(queryByText(/Try changing the filters/u)).toBeNull()
	})

	it('appends the filter hint when the selector says to show it', async () => {
		useFilterStore.setState({
			selectedSports: ['Baseball'],
			availableSports: ['Baseball', 'Volleyball'],
		})

		let {getByText} = await render(<EmptyListNotice />)

		expect(getByText('No Games')).toBeTruthy()
		expect(getByText('Try changing the filters.')).toBeTruthy()
	})
})
