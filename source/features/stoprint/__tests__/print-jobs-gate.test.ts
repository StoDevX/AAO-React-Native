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

	/// A mocked run prints as the stand-in account whatever the keychain holds,
	/// so there is nothing to wait for. Waiting anyway hung the printer screen
	/// on the simulator, where that read did not always come back.
	it('does not wait on the credentials read when mocked', () => {
		expect(printJobsGate({isLoadingCredentials: true, hasCredentials: false, isMocked: true})).toBe(
			'jobs',
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

	/// A keychain with nothing in it leaves the credentials query with no data
	/// at all, not a null. React Query skips `select` entirely in that case, so
	/// this has to be applied to the query's result rather than inside it --
	/// undefined is the input that actually reaches it on a mocked run.
	it('stands in an account when the credentials read yielded nothing', () => {
		expect(stoprintUsername(undefined, true)).toBe(MOCK_STOPRINT_USERNAME)
	})
})
