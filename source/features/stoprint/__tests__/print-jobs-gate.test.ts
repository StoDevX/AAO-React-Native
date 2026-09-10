import {printJobsGate} from '../lib'

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
