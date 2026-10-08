import * as Sentry from '@sentry/react-native'
import * as Application from 'expo-application'
import * as Device from 'expo-device'

import {IS_REPORTING_BUILD} from '../../../init/reporting-build'
import {SUPPORT_EMAIL} from '../../../lib/constants'
import {currentBranding} from '../../campus/branding'
import {useTelemetryStore} from '../../telemetry/store'

/** An image to send alongside a report, already read into memory. */
export type ReportAttachment = {
	filename: string
	data: Uint8Array
	contentType?: string
}

type SubmitReportArgs = {
	message: string
	name?: string
	email?: string
	attachments?: Array<ReportAttachment>
}

/**
 * How a report went: `sent` through Sentry; `disabled` in a build that sends
 * nothing; `opted-out` when sharing is off, so the report must go by email.
 */
export type SubmitResult = 'sent' | 'disabled' | 'opted-out'

export function submitReport(args: SubmitReportArgs): SubmitResult {
	if (!IS_REPORTING_BUILD) {
		return 'disabled'
	}
	// Sentry is closed once sharing is off, so a report sent now would vanish.
	if (!useTelemetryStore.getState().enabled) {
		return 'opted-out'
	}

	let {message, name, email, attachments = []} = args

	// A report carries a name and email, so nothing may tie it to the device.
	// A scope of its own gives it a trace no screen.view metric shares, and
	// its processor, which runs after the SDK's own, removes the device ID,
	// the device's breadcrumbs and the device app hash. Feedback skips
	// `beforeSend`, so this is the only place to do it.
	let scope = new Sentry.Scope()
	scope.addEventProcessor(({user: _user, breadcrumbs: _breadcrumbs, ...event}) => {
		let app = event.contexts?.app
		if (!app) {
			return event
		}
		let {device_app_hash: _hash, ...rest} = app
		return {...event, contexts: {...event.contexts, app: rest}}
	})
	Sentry.captureFeedback(
		{
			message,
			name,
			email,
			tags: {
				deviceBrand: Device.brand,
				deviceModel: Device.modelName,
				deviceModelId: Device.modelId as string | null,
				osName: Device.osName,
				osVersion: Device.osVersion,
				appVersion: Application.nativeApplicationVersion,
				buildNumber: Application.nativeBuildVersion,
			},
		},
		{attachments},
		scope,
	)

	return 'sent'
}

/** The same report as an email to support, for when sharing is off. */
export function reportEmail({message, name, email}: SubmitReportArgs): {
	to: Array<string>
	subject: string
	body: string
} {
	let contact = [name && `Name: ${name}`, email && `Email: ${email}`].filter(Boolean).join('\n')
	return {
		to: [SUPPORT_EMAIL],
		subject: `${currentBranding().appName} problem report`,
		body: contact ? `${message}\n\n${contact}` : message,
	}
}
