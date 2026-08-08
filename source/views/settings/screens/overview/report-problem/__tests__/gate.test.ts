import {Alert} from 'react-native'

describe('openReportProblem', () => {
	afterEach(() => {
		jest.resetModules()
		jest.restoreAllMocks()
	})

	it('calls navigate in production', () => {
		jest.doMock('@frogpond/constants', () => ({IS_PRODUCTION: true}))
		const navigate = jest.fn()
		const alertSpy = jest
			.spyOn(Alert, 'alert')
			.mockImplementation(() => undefined)

		const {openReportProblem} =
			// eslint-disable-next-line @typescript-eslint/no-require-imports -- re-require after jest.doMock to pick up the mocked deps
			require('../gate') as typeof import('../gate')
		openReportProblem(navigate)

		expect(navigate).toHaveBeenCalledTimes(1)
		expect(alertSpy).not.toHaveBeenCalled()
	})

	it('shows a disabled alert and does not navigate outside production', () => {
		jest.doMock('@frogpond/constants', () => ({IS_PRODUCTION: false}))
		const navigate = jest.fn()
		const alertSpy = jest
			.spyOn(Alert, 'alert')
			.mockImplementation(() => undefined)

		const {openReportProblem} =
			// eslint-disable-next-line @typescript-eslint/no-require-imports -- re-require after jest.doMock to pick up the mocked deps
			require('../gate') as typeof import('../gate')
		openReportProblem(navigate)

		expect(navigate).not.toHaveBeenCalled()
		expect(alertSpy).toHaveBeenCalledWith(
			'Sentry is disabled',
			expect.any(String),
		)
	})
})
