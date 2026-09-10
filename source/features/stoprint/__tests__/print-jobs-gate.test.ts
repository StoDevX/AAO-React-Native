import {MOCK_STOPRINT_USERNAME, printJobsGate, stoprintUsername} from '../lib'

describe('printJobsGate', () => {
	it('waits while the credentials are still being read', () => {
		expect(
			printJobsGate({isLoadingCredentials: true, hasCredentials: false, isMocked: false}),
		).toBe('loading')
	})

	it('asks an unauthenticated reader to sign in', () => {
		expect(
			printJobsGate({isLoadingCredentials: false, hasCredentials: false, isMocked: false}),
		).toBe('signed-out')
	})

	it('shows the jobs once there are credentials', () => {
		expect(
			printJobsGate({isLoadingCredentials: false, hasCredentials: true, isMocked: false}),
		).toBe('jobs')
	})

	/// Under UI testing stoPrint is served from `__mocks__`, which needs no
	/// account -- so the sign-in gate has to stand aside or the job screens are
	/// unreachable to a test.
	it('skips the sign-in gate when stoPrint is mocked', () => {
		expect(
			printJobsGate({isLoadingCredentials: false, hasCredentials: false, isMocked: true}),
		).toBe('jobs')
	})

	/// The mock does not make the credentials read instant; a gate that ignored
	/// that would flash the job list before the screen knew who it was for.
	it('still waits for the credentials read even when mocked', () => {
		expect(printJobsGate({isLoadingCredentials: true, hasCredentials: false, isMocked: true})).toBe(
			'loading',
		)
	})
})

describe('stoprintUsername', () => {
	it('uses the signed-in account when there is one', () => {
		expect(stoprintUsername({username: 'ole'}, false)).toBe('ole')
	})

	it('has no account to offer when signed out', () => {
		expect(stoprintUsername(null, false)).toBe('')
	})

	/// The job and printer queries are `enabled: Boolean(username)`, so a mocked
	/// run with no account would leave them disabled and the screen spinning --
	/// mocking the API is not on its own enough to reach the list.
	it('stands in an account when stoPrint is mocked', () => {
		expect(stoprintUsername(null, true)).toBe(MOCK_STOPRINT_USERNAME)
	})

	it('still prefers a real account over the stand-in', () => {
		expect(stoprintUsername({username: 'ole'}, true)).toBe('ole')
	})
})
