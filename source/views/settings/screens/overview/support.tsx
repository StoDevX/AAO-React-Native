import * as React from 'react'
import {Alert} from 'react-native'
import {Section, PushButtonCell} from '@frogpond/tableview'
import {sendEmail} from '../../../../components/send-email'
import deviceInfo from 'react-native-device-info'
import {appVersion, appBuild} from '@frogpond/constants'
import {refreshApp} from '../../../../lib/refresh'
import {useNavigation} from '@react-navigation/native'

const getDeviceInfo = () => `

----- Please do not edit below here -----
${deviceInfo.getBrand()} ${deviceInfo.getModel()}
${deviceInfo.getDeviceId()}
${deviceInfo.getSystemName()} ${appVersion()}+${appBuild() || 'unknown'}
${deviceInfo.getReadableVersion()}
`

const openEmail = () => {
	sendEmail({
		to: ['allaboutolaf@frogpond.tech'],
		subject: 'Support: All About Olaf',
		body: getDeviceInfo(),
	})
}

export const SupportSection = (): JSX.Element => {
	let navigation = useNavigation()

	let onResetButton = () => {
		Alert.alert(
			'Reset Everything',
			'Are you sure you want to clear everything?',
			[
				{text: 'Nope!', style: 'cancel'},
				{
					text: 'Reset it!',
					style: 'destructive',
					onPress: () => refreshApp(),
				},
			],
		)
	}

	return (
		<Section header="SUPPORT">
			<PushButtonCell onPress={openEmail} title="Contact Us" />
			<PushButtonCell onPress={() => navigation.navigate('Faq')} title="FAQs" />
			<PushButtonCell onPress={onResetButton} title="Reset Everything" />
		</Section>
	)
}
