import type {ReactNativeOptions} from '@sentry/react-native'

import {ANONYMOUS_MARKER} from '../features/telemetry/catalog'
import {scrubBreadcrumb, scrubEvent, scrubSpan} from './scrub'

/** What ties a log to a device or a trace. Removed from anonymous logs, with the marker. */
const LINKING_ATTRIBUTES = [
	'user.id',
	'user.email',
	'user.name',
	'sentry.trace.parent_span_id',
	ANONYMOUS_MARKER,
]

/** Strips the device ID and span link from a log `track()` marked anonymous; passes others through. */
function stripAnonymous<T extends {attributes?: Record<string, unknown>}>(log: T): T {
	if (log.attributes?.[ANONYMOUS_MARKER] !== true) {
		return log
	}
	let attributes = {...log.attributes}
	for (let key of LINKING_ATTRIBUTES) {
		delete attributes[key]
	}
	return {...log, attributes}
}

type Gates = {
	/** A release bundle. Debug builds never send. */
	isProduction: boolean
	/** The person's saved choice when Sentry starts. */
	consented: boolean
	/** A prerelease version, which only TestFlight gets; testers agreed to share more. */
	isPrerelease: boolean
	/** Reads the choice when something is sent, so anything queued before an opt-out is dropped. */
	isConsented: () => boolean
}

/** The Sentry options that decide what may be sent, and whether anything is. */
export function privacyOptions({
	isProduction,
	consented,
	isPrerelease,
	isConsented,
}: Gates): ReactNativeOptions {
	function unlessOptedOut<T>(item: T): T | null {
		return isConsented() ? item : null
	}

	return {
		enabled: isProduction && consented,
		// @sentry/core deprecates this for `dataCollection`, but the React Native
		// SDK omits that option from its types and still reads this one: off, it
		// tells Sentry not to record the IP address (client.js `infer_ip`),
		// attaches no request headers or cookies, and strips deep-link queries.
		// oxlint-disable-next-line typescript/no-deprecated
		sendDefaultPii: false,
		attachScreenshot: isPrerelease,
		attachViewHierarchy: isPrerelease,
		enableMetrics: true,
		enableLogs: true,
		logsOrigin: 'js',
		enableAutoConsoleLogs: false,
		// URLs carry StoPrint usernames and Directory search text; console
		// breadcrumbs carry whatever the app logged. See scrub.ts.
		beforeBreadcrumb: scrubBreadcrumb,
		beforeSendSpan: scrubSpan,
		beforeSend: (event) => {
			let kept = unlessOptedOut(event)
			return kept && scrubEvent(kept)
		},
		beforeSendTransaction: unlessOptedOut,
		beforeSendMetric: unlessOptedOut,
		beforeSendLog: (log) => {
			let kept = unlessOptedOut(log)
			return kept && stripAnonymous(kept)
		},
	}
}
