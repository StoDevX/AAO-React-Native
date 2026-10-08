import * as Application from 'expo-application'
import * as Device from 'expo-device'
import {sendEmail} from '../../components/send-email'
import {currentBranding} from '../campus/branding'

const getDeviceInfo = () => `

----- Please do not edit below here -----
${Device.brand} ${Device.modelName}
${Device.modelId}
${Device.osName} ${Device.osVersion}
${Application.nativeApplicationVersion}.${Application.nativeBuildVersion}
`

/** Opens a message to the app's maintainers, with the device's details below the body. */
export const openEmail = (): void => {
	sendEmail({
		to: ['allaboutolaf@frogpond.tech'],
		subject: `Support: ${currentBranding().appName}`,
		body: getDeviceInfo(),
	})
}
