import * as React from 'react'
import {Alert} from 'react-native'

import deviceInfo from 'react-native-device-info'

import {useNavigation} from '@react-navigation/native'

import {appBuild, appVersion} from '@frogpond/constants'
import {Cell, Section} from '@frogpond/tableview'
import {PushButtonCell} from '@frogpond/tableview/cells'

import {sendEmail} from '../../../../components/send-email'
import {refreshApp} from '../../../../lib/refresh'

const getDeviceInfo = () => `

----- Please do not edit below here -----
${deviceInfo.getBrand()} ${deviceInfo.getModel()}
${deviceInfo.getDeviceId()}
${deviceInfo.getSystemName()} ${getVersion()}
${deviceInfo.getReadableVersion()}
`

export const openEmail = (): void => {
	sendEmail({
		to: ['allaboutolaf@frogpond.tech'],
		subject: 'Support: All About Olaf',
		body: getDeviceInfo(),
	})
}

const getVersion = () => {
	let version = appVersion()
	let build = appBuild()

	if (build) {
		return `${version}+${build}`
	} else {
		return version
	}
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
			<PushButtonCell onPress={() => navigation.navigate('Faq')} title="FAQs" />
			<PushButtonCell
				onPress={openEmail}
				showLinkStyle={true}
				title="Contact Us"
			/>
			<PushButtonCell
				onPress={onResetButton}
				showLinkStyle={true}
				title="Reset Everything"
			/>
			<Cell cellStyle="RightDetail" detail={getVersion()} title="Version" />
		</Section>
	)
}
