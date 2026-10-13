import * as Application from 'expo-application'
import * as Device from 'expo-device'
import {sendEmail} from '../../components/send-email'
import {currentCampus} from '../campus/store'

const getDeviceInfo = () => `

----- Please do not edit below here -----
${Device.brand} ${Device.modelName}
${Device.modelId}
${Device.osName} ${Device.osVersion}
${Application.nativeApplicationVersion}.${Application.nativeBuildVersion}
`

/** Opens a message to the app's maintainers, with the device's details below the body. */
export const openEmail = (): void => {
	let {appName, supportEmail} = currentCampus().branding
	sendEmail({
		to: [supportEmail],
		subject: `Support: ${appName}`,
		body: getDeviceInfo(),
	})
}
