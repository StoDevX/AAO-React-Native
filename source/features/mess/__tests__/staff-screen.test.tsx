import * as React from 'react'
import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {fetchManifest, fetchSourceBody, type Jrd} from '@frogpond/data-sources'

import staff from './fixtures/staff-2026-2027.json'
import {queryClient as appQueryClient} from '../../../init/tanstack-query'
import {waitForQueriesToSettle} from '../../../testing/query-notifications'
import {StaffMemberScreen, StaffScreen} from '../staff-screen'
import {messKeys} from '../lib/keys'
import {parseStaffProfiles} from '../lib/profiles'

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
	return render(<QueryClientProvider client={queryClient}>{node}</QueryClientProvider>)
}

/** Answers every Mess fetch with nothing to list, as a paper with no staff years would. */
function serveNoYears(): void {
	mockManifest.mockResolvedValue({links: []} as unknown as Jrd)
	mockBody.mockResolvedValue([])
}

describe('StaffScreen', () => {
	test('lists the staff in groups, each person by name and role', async () => {
		queryClient.setQueryData(messKeys.staff, people)
		await renderWithClient(<StaffScreen />)

		expect(screen.getByText('Leadership')).toBeTruthy()
		expect(screen.getByText('Copy Desk')).toBeTruthy()
		expect(screen.getByRole('button', {name: /Soren Gjesfjeld, Senior Reporter/u})).toBeTruthy()
	})

	test("opens a person's page by their profile's id", async () => {
		queryClient.setQueryData(messKeys.staff, people)
		await renderWithClient(<StaffScreen />)

		await fireEvent.press(screen.getByRole('button', {name: /Soren Gjesfjeld/u}))

		expect(mockNavigate).toHaveBeenCalledWith({
			pathname: '/messenger/staff/[id]',
			params: {id: String(SOREN?.id)},
		})
	})

	test('says the staff failed to load, and offers to try again', async () => {
		serveNoYears()
		await renderWithClient(<StaffScreen />)
		await waitForQueriesToSettle(queryClient)

		expect(screen.getByText(/The Olaf Messenger lists no staff years/u)).toBeTruthy()
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

	test('says so when nobody on the staff has that id', async () => {
		queryClient.setQueryData(messKeys.staff, people)
		await renderWithClient(<StaffMemberScreen id="1" />)

		expect(screen.getByText('Staff Member Not Found')).toBeTruthy()
	})

	test('says the staff failed to load, and offers to try again', async () => {
		serveNoYears()
		await renderWithClient(<StaffMemberScreen id={String(SOREN?.id)} />)
		await waitForQueriesToSettle(queryClient)

		expect(screen.getByText(/The Olaf Messenger lists no staff years/u)).toBeTruthy()
		expect(screen.getByRole('button', {name: 'Try Again'})).toBeTruthy()
	})
})
