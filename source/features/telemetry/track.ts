import * as Sentry from '@sentry/react-native'

import {ANONYMOUS_MARKER, DESTINATIONS, type TelemetryEvent} from './catalog'

/**
 * Records one telemetry event in Sentry, as a metric or a log according to
 * the catalog. Never throws: telemetry must not break the screen reporting
 * it. When the person has opted out, Sentry is closed and this does nothing.
 */
export function track(event: TelemetryEvent): void {
	try {
		if ('anonymous' in event) {
			// A fresh scope has its own trace ID and no active span, so this log
			// can't be joined to a trace that carries the device ID. The SDK still
			// adds the device ID from the app-wide scope; `beforeSendLog` in
			// source/init/sentry-options.ts strips it, keyed on the marker.
			Sentry.logger.info(
				event.name,
				{...event.attributes, [ANONYMOUS_MARKER]: true},
				{scope: new Sentry.Scope()},
			)
		} else if (DESTINATIONS[event.name] === 'metric') {
			Sentry.metrics.count(event.name, 1, {attributes: event.attributes})
		} else {
			Sentry.logger.warn(event.name, event.attributes)
		}
	} catch {
		// A lost event costs less than a broken screen, and there is nowhere
		// better to report a failure to report.
	}
}
