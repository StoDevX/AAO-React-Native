import * as React from 'react'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'

import ReportPage from '../../../../../app/(home)/Campus/detail/report'
import {BuildingReportProvider} from '../context'
import {keys} from '../../query'
import type {BuildingType} from '../../types'
import type * as ExpoRouterMock from '../../../../testing/expo-router-mock'

// report.tsx pulls in the redux barrel through query.ts, for
// useGroupedBuildings' favorites selector elsewhere in that module. That
// barrel eagerly configures the store, which wires up the Sentry enhancer --
// and Sentry's React Native SDK reaches for the native fetch module on
// import, which doesn't exist under Jest. None of that is exercised by the
// tests below, so stub it out rather than pull in a real store.
jest.mock('../../../../redux', () => ({
	selectFavoriteBuildings: jest.fn(),
	useAppSelector: jest.fn(),
}))

jest.mock('@expo/ui/swift-ui', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../testing/expo-ui-mock') as typeof import('../../../../testing/expo-ui-mock')
})
jest.mock('@expo/ui/swift-ui/modifiers', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	return require('../../../../testing/expo-ui-mock') as typeof import('../../../../testing/expo-ui-mock')
})

const mockPush = jest.fn()

jest.mock('expo-router', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	let {Stack}: typeof ExpoRouterMock = require('../../../../testing/expo-router-mock')
	return {
		Stack,
		useRouter: () => ({push: mockPush}),
		useNavigation: () => ({goBack: jest.fn(), dispatch: jest.fn()}),
		useLocalSearchParams: () => ({name: 'The Cage', campus: 'stolaf'}),
	}
})
jest.mock('expo-router/react-navigation', () => ({usePreventRemove: jest.fn()}))
jest.mock('../../../../components/send-email')

import {sendEmail} from '../../../../components/send-email'

const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>

const cage: BuildingType = {
	name: 'The Cage',
	category: 'Food',
	schedule: [{title: 'Hours', hours: [{days: ['Mo'], from: '8:00am', to: '5:00pm'}]}],
}
const library: BuildingType = {name: 'Rolvaag', category: 'Libraries', schedule: []}

function renderReport() {
	let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
	client.setQueryData(keys.all('stolaf'), [cage, library])

	return render(
		<QueryClientProvider client={client}>
			<BuildingReportProvider>
				<ReportPage />
			</BuildingReportProvider>
		</QueryClientProvider>,
	)
}

beforeEach(() => {
	jest.clearAllMocks()
})

describe('the report form', () => {
	// `render` and `fireEvent` are both async in this version of
	// @testing-library/react-native -- each wraps its work in `act`, which
	// itself awaits React's effects. Not awaiting them races the assertions
	// below against a `screen` that has nothing bound yet.
	it('sends an edited formal name in the report', async () => {
		await renderReport()

		await fireEvent.changeText(screen.getByLabelText('Formal Name'), 'The Cage at Buntrock')
		await fireEvent.press(screen.getByLabelText('Submit Report'))

		let [args] = mockSendEmail.mock.calls.at(-1) as [{body: string}]
		expect(args.body).toContain('The Cage at Buntrock')
	})

	it('offers every category the loaded venues use', async () => {
		await renderReport()

		expect(screen.getByText('Libraries')).toBeTruthy()
		expect(screen.getByText('Category')).toBeTruthy()
	})

	it('sends a chosen category in the report', async () => {
		await renderReport()

		await fireEvent.press(screen.getByText('Libraries'))
		await fireEvent.press(screen.getByLabelText('Submit Report'))

		let [args] = mockSendEmail.mock.calls.at(-1) as [{body: string}]
		expect(args.body).toContain('category: Libraries')
	})
})
