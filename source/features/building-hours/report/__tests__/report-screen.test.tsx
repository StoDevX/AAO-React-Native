import * as React from 'react'
import {act, fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {Alert} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import {usePreventRemove} from 'expo-router/react-navigation'

import ReportPage from '../../../../../app/(home)/Campus/detail/report'
import {BuildingReportProvider} from '../context'
import {keys} from '../../query'
import type {BuildingType} from '../../types'
import {simulateFocus} from '../../../../testing/expo-router-mock'
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

const mockNavigate = jest.fn()

jest.mock('expo-router', () => {
	// oxlint-disable-next-line typescript/no-require-imports
	let mock: typeof ExpoRouterMock = require('../../../../testing/expo-router-mock')
	let {Stack, useFocusEffect} = mock
	return {
		Stack,
		useFocusEffect,
		useRouter: () => ({navigate: mockNavigate}),
		useNavigation: () => ({goBack: jest.fn(), dispatch: jest.fn()}),
		useLocalSearchParams: () => ({name: 'The Cage', campus: 'stolaf'}),
	}
})
jest.mock('expo-router/react-navigation', () => ({usePreventRemove: jest.fn()}))
jest.mock('../../../../components/send-email')

import {composeEmail} from '../../../../components/send-email'

const mockComposeEmail = composeEmail as jest.MockedFunction<typeof composeEmail>

const cage: BuildingType = {
	name: 'The Cage',
	category: 'Food',
	links: [{title: 'Instagram', url: 'https://www.instagram.com/lionspause/'}],
	schedule: [{title: 'Hours', hours: [{days: ['Mo'], from: '8:00am', to: '5:00pm'}]}],
}
const library: BuildingType = {name: 'Rolvaag', category: 'Libraries', schedule: []}

// Every query left without observers gets a garbage-collection timeout, and
// React Query's default is five minutes -- long enough to outlive the run and
// leave the Jest worker to be force-killed rather than exiting on its own.
// Testing Library registers its unmounting afterEach when it is imported, and
// Jest runs afterEach hooks in registration order, so by the time this one
// runs the components are gone and every gc timeout has been armed.
const trackedQueryClients: QueryClient[] = []

afterEach(() => {
	for (let queryClient of trackedQueryClients) {
		queryClient.clear()
	}
	trackedQueryClients.length = 0
})

async function renderReport() {
	let client = new QueryClient({defaultOptions: {queries: {retry: false}}})
	trackedQueryClients.push(client)
	client.setQueryData(keys.all('stolaf'), [cage, library])

	let view = await render(
		<QueryClientProvider client={client}>
			<BuildingReportProvider>
				<ReportPage />
			</BuildingReportProvider>
		</QueryClientProvider>,
	)

	// React Query's notifyManager schedules subscriber notifications with a
	// real setTimeout(0) (see notifyManager.ts's systemSetTimeoutZero), not a
	// microtask, so it lands after render returns and re-renders outside
	// act(). The queries here are seeded, so there is nothing to fetch -- only
	// that timer to flush.
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 0))
	})

	return view
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

		let [args] = mockComposeEmail.mock.calls.at(-1) as [{body: string}]
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

		let [args] = mockComposeEmail.mock.calls.at(-1) as [{body: string}]
		expect(args.body).toContain('category: Libraries')
	})
})

describe('images', () => {
	async function pickImage(uri: string) {
		let picker = ImagePicker.launchImageLibraryAsync as jest.MockedFunction<
			typeof ImagePicker.launchImageLibraryAsync
		>
		picker.mockResolvedValueOnce({
			canceled: false,
			assets: [{uri, width: 100, height: 100}],
		})
		await fireEvent.press(screen.getByLabelText('Add Image'))
	}

	it('sends a picked image with the report', async () => {
		await renderReport()

		await pickImage('file:///tmp/sign.jpg')
		await fireEvent.press(screen.getByLabelText('Submit Report'))

		let [args] = mockComposeEmail.mock.calls.at(-1) as [{attachments: Array<string>}]
		expect(args.attachments).toEqual(['file:///tmp/sign.jpg'])
	})

	it('counts a picked image as an unsaved change', async () => {
		await renderReport()
		let guard = usePreventRemove as jest.MockedFunction<typeof usePreventRemove>
		expect(guard.mock.calls.at(-1)?.[0]).toBe(false)

		await pickImage('file:///tmp/sign.jpg')

		expect(guard.mock.calls.at(-1)?.[0]).toBe(true)
	})

	it('holds Submit Report while picked images are still loading', async () => {
		await renderReport()
		let picker = ImagePicker.launchImageLibraryAsync as jest.MockedFunction<
			typeof ImagePicker.launchImageLibraryAsync
		>
		picker.mockReturnValueOnce(new Promise(() => undefined))

		await fireEvent.press(screen.getByLabelText('Add Image'))

		expect(screen.getByLabelText('Submit Report')).toBeDisabled()
	})

	it('sends nothing while picked images are still loading', async () => {
		await renderReport()
		let picker = ImagePicker.launchImageLibraryAsync as jest.MockedFunction<
			typeof ImagePicker.launchImageLibraryAsync
		>
		picker.mockReturnValueOnce(new Promise(() => undefined))

		await fireEvent.press(screen.getByLabelText('Add Image'))
		await fireEvent.press(screen.getByLabelText('Submit Report'))

		expect(mockComposeEmail).not.toHaveBeenCalled()
	})

	it('opens one email for two quick taps on Submit Report', async () => {
		await renderReport()
		mockComposeEmail.mockReturnValueOnce(new Promise(() => undefined))

		await fireEvent.press(screen.getByLabelText('Submit Report'))
		await fireEvent.press(screen.getByLabelText('Submit Report'))

		expect(mockComposeEmail).toHaveBeenCalledTimes(1)
	})
})

describe('links', () => {
	// DetailRow's tappable rows carry both halves in their accessibility label
	// -- "Email, ole@stolaf.edu" is the same shape asserted in
	// source/components/__tests__/rows.test.tsx -- so a link row reads as
	// "title, host".
	it('shows a row per link, with its host', async () => {
		await renderReport()

		expect(screen.getByLabelText('Instagram, www.instagram.com')).toBeTruthy()
		expect(screen.getByText('www.instagram.com')).toBeTruthy()
	})

	it('names an untitled link rather than showing a blank row', async () => {
		await renderReport()

		await fireEvent.press(screen.getByLabelText('Add Link'))
		expect(screen.getByText('Untitled Link')).toBeTruthy()
	})

	it('opens the editor for the link that was pressed', async () => {
		await renderReport()

		await fireEvent.press(screen.getByLabelText('Instagram, www.instagram.com'))
		expect(mockNavigate).toHaveBeenCalledWith({
			pathname: '/Campus/detail/link-editor',
			params: {linkIndex: '0'},
		})
	})

	// Two presses before React re-renders would otherwise both read the same
	// links.length, opening two editors on one link and stranding a second
	// blank one with no editor pointed at it.
	it('opens one editor when Add Link is pressed twice quickly', async () => {
		await renderReport()

		let addLink = screen.getByLabelText('Add Link')
		await fireEvent.press(addLink)
		await fireEvent.press(addLink)

		expect(mockNavigate).toHaveBeenCalledTimes(1)
	})

	it('lets Add Link work again after coming back from the editor', async () => {
		await renderReport()

		await fireEvent.press(screen.getByLabelText('Add Link'))
		expect(mockNavigate).toHaveBeenCalledTimes(1)

		await act(() => {
			simulateFocus()
		})

		await fireEvent.press(screen.getByLabelText('Add Link'))
		expect(mockNavigate).toHaveBeenCalledTimes(2)
	})
})

describe("the reporter's note", () => {
	it('sends what was typed with the report', async () => {
		await renderReport()

		await fireEvent.changeText(
			screen.getByLabelText('Describe the problem'),
			'It closes at 9 during interim.',
		)
		await fireEvent.press(screen.getByLabelText('Submit Report'))

		let [args] = mockComposeEmail.mock.calls.at(-1) as [{body: string}]
		expect(args.body).toContain('It closes at 9 during interim.')
	})
})

describe('the unsaved-changes guard after Submit Report', () => {
	function guardIsOn(): boolean | undefined {
		let guard = usePreventRemove as jest.MockedFunction<typeof usePreventRemove>
		return guard.mock.calls.at(-1)?.[0]
	}

	async function editAndSubmit() {
		await renderReport()
		await fireEvent.changeText(screen.getByLabelText('Describe the problem'), 'Closed Sundays.')
		expect(guardIsOn()).toBe(true)
		await fireEvent.press(screen.getByLabelText('Submit Report'))
	}

	it('lifts once the report is handed off', async () => {
		mockComposeEmail.mockResolvedValueOnce(true)
		await editAndSubmit()
		expect(guardIsOn()).toBe(false)
	})

	it('stays on when the email is cancelled', async () => {
		mockComposeEmail.mockResolvedValueOnce(false)
		await editAndSubmit()
		expect(guardIsOn()).toBe(true)
	})

	it('stays on when the email cannot be written', async () => {
		mockComposeEmail.mockRejectedValueOnce(new Error('no sheet'))
		jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)
		await editAndSubmit()
		expect(guardIsOn()).toBe(true)
		expect(Alert.alert).toHaveBeenCalledWith(
			'Could not write the email',
			'Please try sending the report again.',
		)
	})
})
