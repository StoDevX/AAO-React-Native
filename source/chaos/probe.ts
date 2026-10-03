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

/** The part of React Native's `ExceptionsManager` the probe replaces. */
export type ExceptionsManagerLike = {
	handleException(error: unknown, isFatal: boolean): void
}

/** The part of `console` the probe uses; React Native reads `reportErrorsAsExceptions` from it. */
export type ProbeConsole = Pick<Console, 'error'> & {reportErrorsAsExceptions?: boolean}

/** What the probe hooks into. */
export type ProbeHost = {
	errorUtils: ErrorUtilsLike
	exceptionsManager: ExceptionsManagerLike
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

	// React Native sends each console.error to native in a production bundle,
	// whose red box in a debug build covers the beacon. The console still prints.
	host.console.reportErrorsAsExceptions = false

	let originalError = host.console.error.bind(host.console)
	host.console.error = (...args: unknown[]) => {
		reportFinding('console-error', args)
		originalError(...args)
	}

	// React reports a render error straight to `ExceptionsManager`, past
	// `ErrorUtils`. A production bundle then sends it to native, whose red box in
	// a debug build covers the beacon. The probe takes it instead.
	host.exceptionsManager.handleException = (error, isFatal) => {
		if (isFatal) {
			reportFinding('fatal', error)
			return
		}
		host.console.error(error)
	}
}
