import {reportFinding} from './findings'

/** React Native's global error handler. */
export type ErrorHandler = (error: unknown, isFatal?: boolean) => void

/** The part of React Native's `ErrorUtils` the probe uses. */
export type ErrorUtilsLike = {
	getGlobalHandler(): ErrorHandler
	setGlobalHandler(handler: ErrorHandler): void
}

/** Hermes's promise rejection tracker options. */
export type RejectionTrackerOptions = {
	allRejections: boolean
	onUnhandled: (id: number, error: unknown) => void
	onHandled: (id: number) => void
}

/** The part of `console` the probe uses; React Native reads `reportErrorsAsExceptions` from it. */
export type ProbeConsole = Pick<Console, 'error'> & {reportErrorsAsExceptions?: boolean}

/** What the probe hooks into. */
export type ProbeHost = {
	errorUtils: ErrorUtilsLike
	console: ProbeConsole
	enableRejectionTracker?: (options: RejectionTrackerOptions) => void
}

/**
 * Reports uncaught errors, unhandled rejections and `console.error` as findings.
 *
 * A fatal is not passed on to React Native's handler: that would red-box a
 * development bundle and crash a release one, taking the beacon with it before
 * the monkey could read what went wrong. The run stops on the finding instead.
 */
export function installProbe(host: ProbeHost): void {
	let previous = host.errorUtils.getGlobalHandler()
	host.errorUtils.setGlobalHandler((error, isFatal) => {
		if (isFatal) {
			reportFinding('fatal', error)
			return
		}
		previous(error, isFatal)
	})

	host.enableRejectionTracker?.({
		allRejections: true,
		onUnhandled: (_id, error) => reportFinding('unhandled-rejection', error),
		// oxlint-disable-next-line no-empty-function
		onHandled: () => {},
	})

	// A production bundle in a debug native build reports each console.error to
	// native, whose red box covers the beacon the run reads. The probe records
	// the error as a finding instead, and the console still prints it.
	host.console.reportErrorsAsExceptions = false

	let originalError = host.console.error.bind(host.console)
	host.console.error = (...args: unknown[]) => {
		reportFinding('console-error', args)
		originalError(...args)
	}
}
