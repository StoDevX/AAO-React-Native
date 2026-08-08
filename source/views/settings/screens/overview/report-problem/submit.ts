import * as Sentry from '@sentry/react-native'
import * as Application from 'expo-application'
import * as Device from 'expo-device'

type SubmitReportArgs = {
	message: string
	name?: string
	email?: string
}

export function submitReport(args: SubmitReportArgs): void {
	let {message, name, email} = args

	Sentry.captureFeedback({
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
	})
}
