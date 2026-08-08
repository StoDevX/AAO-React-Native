import {Alert} from 'react-native'

describe('openReportProblem', () => {
	afterEach(() => {
		jest.resetModules()
		jest.restoreAllMocks()
	})

	it('opens the Sentry feedback widget in production', () => {
		jest.doMock('@frogpond/constants', () => ({IS_PRODUCTION: true}))
		const showFeedbackWidget = jest.fn()
		jest.doMock('@sentry/react-native', () => ({showFeedbackWidget}))
		const alertSpy = jest
			.spyOn(Alert, 'alert')
			.mockImplementation(() => undefined)

		const {openReportProblem} =
			// eslint-disable-next-line @typescript-eslint/no-require-imports -- re-require after jest.doMock to pick up the mocked deps
			require('../report-problem') as typeof import('../report-problem')
		openReportProblem()

		expect(showFeedbackWidget).toHaveBeenCalledTimes(1)
		expect(alertSpy).not.toHaveBeenCalled()
	})

	it('shows a disabled alert outside production', () => {
		jest.doMock('@frogpond/constants', () => ({IS_PRODUCTION: false}))
		const showFeedbackWidget = jest.fn()
		jest.doMock('@sentry/react-native', () => ({showFeedbackWidget}))
		const alertSpy = jest
			.spyOn(Alert, 'alert')
			.mockImplementation(() => undefined)

		const {openReportProblem} =
			// eslint-disable-next-line @typescript-eslint/no-require-imports -- re-require after jest.doMock to pick up the mocked deps
			require('../report-problem') as typeof import('../report-problem')
		openReportProblem()

		expect(showFeedbackWidget).not.toHaveBeenCalled()
		expect(alertSpy).toHaveBeenCalledWith(
			'Sentry is disabled',
			expect.any(String),
		)
	})
})
