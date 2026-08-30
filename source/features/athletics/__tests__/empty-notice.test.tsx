import * as React from 'react'
import {render} from '@testing-library/react-native'

import {EmptyListNotice} from '../empty-notice'
import {Constants} from '../constants'
import {useFilterStore} from '../store'

describe('EmptyListNotice', () => {
	beforeEach(() => {
		useFilterStore.setState({selectedSports: [], availableSports: []})
	})

	it('shows the yesterday/today phrasing for Yesterday', async () => {
		let {getByText} = await render(<EmptyListNotice selectedSection={Constants.YESTERDAY} />)

		expect(getByText('No games yesterday')).toBeTruthy()
	})

	it('shows the yesterday/today phrasing for Today', async () => {
		let {getByText} = await render(<EmptyListNotice selectedSection={Constants.TODAY} />)

		expect(getByText('No games today')).toBeTruthy()
	})

	it('shows the upcoming phrasing for Upcoming', async () => {
		let {getByText} = await render(<EmptyListNotice selectedSection={Constants.UPCOMING} />)

		expect(getByText('No upcoming games')).toBeTruthy()
	})

	it('omits the filter hint when the selector says not to show it', async () => {
		let {queryByText} = await render(<EmptyListNotice selectedSection={Constants.TODAY} />)

		expect(queryByText(/Try changing the filters/u)).toBeNull()
	})

	it('appends the filter hint when the selector says to show it', async () => {
		useFilterStore.setState({
			selectedSports: ['Baseball'],
			availableSports: ['Baseball', 'Volleyball'],
		})

		let {getByText} = await render(<EmptyListNotice selectedSection={Constants.TODAY} />)

		expect(getByText('No games today. Try changing the filters?')).toBeTruthy()
	})
})
