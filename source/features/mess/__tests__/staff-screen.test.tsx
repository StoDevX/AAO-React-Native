import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {act, fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'

import staff from './fixtures/staff-2026-2027.json'
import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {navigationTitleLines} from '../../../testing/navigation-title'
import {waitForQueriesToSettle} from '../../../testing/query-notifications'
import {StaffMemberScreen, StaffScreen} from '../staff-screen'
import {messKeys} from '../lib/keys'
import {parseStaffProfiles} from '../lib/profiles'
import {InMessenger} from './in-messenger'

jest.mock(
	'react-native-safe-area-context',
	() =>
		// oxlint-disable-next-line typescript/no-require-imports
		require('react-native-safe-area-context/jest/mock').default,
)
jest.mock('@frogpond/data-sources', () => ({
	...(jest.requireActual('@frogpond/data-sources') as object),
	fetchManifest: jest.fn(),
	fetchSourceBody: jest.fn(),
}))
const mockNavigate = jest.fn()
jest.mock('expo-router', () => ({
	// oxlint-disable-next-line typescript/no-require-imports
	...(require('../../../testing/expo-router-mock') as object),
	useRouter: () => ({navigate: mockNavigate}),
}))

const mockManifest = fetchManifest as jest.Mock<() => Promise<Jrd>>
const mockBody = fetchSourceBody as jest.Mock<(href: string) => Promise<unknown>>

const people = parseStaffProfiles(staff)
const SOREN = people.find((p) => p.name === 'Soren Gjesfjeld')

let queryClient: QueryClient

beforeEach(() => {
	queryClient = new QueryClient({defaultOptions: {queries: {staleTime: Infinity, retry: false}}})
})

afterEach(() => {
	queryClient.clear()
	appQueryClient.clear()
	jest.clearAllMocks()
})

function renderWithClient(node: React.ReactNode) {
	return render(
		<QueryClientProvider client={queryClient}>
			<InMessenger>{node}</InMessenger>
		</QueryClientProvider>,
	)
}

/** Answers every Mess fetch with nothing to list, as a paper with no staff years would. */
function serveNoYears(): void {
	mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
	mockBody.mockResolvedValue([])
}

/** Fails every Mess fetch, as the paper's site does when it is down. */
function serveFailure(): void {
	mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
	mockBody.mockRejectedValue(new Error('The paper is down'))
}

describe('StaffScreen', () => {
	test('is titled Staff, over the year it lists', async () => {
		queryClient.setQueryData(messKeys.staff, people)
		await renderWithClient(<StaffScreen />)

		expect(navigationTitleLines()).toStrictEqual(['Staff', '2026-2027'])
	})

	test('lists the staff as tiles in groups, each by name, keeping roles for their pages', async () => {
		queryClient.setQueryData(messKeys.staff, people)
		await renderWithClient(<StaffScreen />)

		// Headings, so VoiceOver's rotor can move between the groups.
		expect(screen.getByRole('header', {name: 'Leadership'})).toBeTruthy()
		expect(screen.getByRole('header', {name: 'Copy Desk'})).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Soren Gjesfjeld'})).toBeTruthy()
		expect(screen.queryByText('Senior Reporter')).toBeNull()
	})

	test("opens a person's page by their profile's id", async () => {
		queryClient.setQueryData(messKeys.staff, people)
		await renderWithClient(<StaffScreen />)

		await fireEvent.press(screen.getByRole('button', {name: 'Soren Gjesfjeld'}))

		expect(mockNavigate).toHaveBeenCalledWith({
			pathname: '/messenger/staff/[id]',
			params: {id: String(SOREN?.id)},
		})
	})

	test('says so when the paper lists nobody, rather than drawing an empty page', async () => {
		serveNoYears()
		await renderWithClient(<StaffScreen />)
		await waitForQueriesToSettle(queryClient)

		expect(screen.getByText('The Mess has listed no staff yet.')).toBeTruthy()
	})

	test('says the staff failed to load, and offers to try again', async () => {
		serveFailure()
		await renderWithClient(<StaffScreen />)
		await waitForQueriesToSettle(queryClient)

		expect(screen.getByText(/The paper is down/u)).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Try Again'})).toBeTruthy()
	})
})

describe('StaffMemberScreen', () => {
	test("shows the person's name, role and bio", async () => {
		queryClient.setQueryData(messKeys.staff, people)
		await renderWithClient(<StaffMemberScreen id={String(SOREN?.id)} />)

		expect(screen.getByText('Soren Gjesfjeld')).toBeTruthy()
		expect(screen.getByText('Senior Reporter')).toBeTruthy()
		expect(screen.getByText(/^Soren Gjesfjeld is a political science/u)).toBeTruthy()
	})

	test('keeps showing the person when a refetch moves the list on to a year without them', async () => {
		queryClient.setQueryData(messKeys.staff, people)
		await renderWithClient(<StaffMemberScreen id={String(SOREN?.id)} />)

		await act(() => {
			queryClient.setQueryData(
				messKeys.staff,
				people.filter((p) => p.id !== SOREN?.id),
			)
		})

		expect(screen.getByText('Senior Reporter')).toBeTruthy()
		expect(screen.queryByText('Staff Member Not Found')).toBeNull()
	})

	test('says so when nobody on the staff has that id', async () => {
		queryClient.setQueryData(messKeys.staff, people)
		await renderWithClient(<StaffMemberScreen id="1" />)

		expect(screen.getByText('Staff Member Not Found')).toBeTruthy()
	})

	test('says the staff failed to load, and offers to try again', async () => {
		serveFailure()
		await renderWithClient(<StaffMemberScreen id={String(SOREN?.id)} />)
		await waitForQueriesToSettle(queryClient)

		expect(screen.getByText(/The paper is down/u)).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Try Again'})).toBeTruthy()
	})
})
