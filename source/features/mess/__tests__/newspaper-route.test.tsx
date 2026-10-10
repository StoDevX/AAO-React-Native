import * as React from 'react'
import {Text} from 'react-native'
import {describe, expect, jest, test} from '@jest/globals'
import {render, screen} from '@testing-library/react-native'

import {useCampusStore} from '../../campus/store'
import {newspaperRoute} from '../newspaper-route'
import {usePaper, usePaperCampus} from '../paper-context'

let mockParams: {campus?: string} = {}
jest.mock('expo-router', () => ({
	// oxlint-disable-next-line typescript/no-require-imports
	...(require('../../../testing/expo-router-mock') as object),
	useLocalSearchParams: () => mockParams,
}))

function Probe(): React.ReactNode {
	return <Text>{`${usePaper().title} on ${usePaperCampus()}`}</Text>
}
const Route = newspaperRoute(Probe)

describe('newspaperRoute', () => {
	test("shows the active campus's paper", async () => {
		useCampusStore.setState({campus: 'edu.stolaf'})
		mockParams = {}
		await render(<Route />)
		expect(screen.getByText('The Olaf Messenger on edu.stolaf')).toBeTruthy()
	})

	test("a story opened from another campus's paper keeps that campus", async () => {
		useCampusStore.setState({campus: 'edu.stolaf'})
		mockParams = {campus: 'edu.carleton'}
		await render(<Route />)
		expect(screen.getByText('The Carletonian on edu.carleton')).toBeTruthy()
	})
})
