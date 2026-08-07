import * as React from 'react'
import {Alert} from 'react-native'
import {Section, Cell} from '@frogpond/tableview'
import {PushButtonCell} from '@frogpond/tableview/cells'
import {sendEmail} from '../../../../components/send-email'
import * as Application from 'expo-application'
import * as Device from 'expo-device'
import {refreshApp} from '../../../../lib/refresh'
import {useNavigation} from '@react-navigation/native'
import {formatVersion} from './version'

const getDeviceInfo = () => `

----- Please do not edit below here -----
${Device.brand} ${Device.modelName}
${Device.modelId}
${Device.osName} ${Device.osVersion}
${Application.nativeApplicationVersion}.${Application.nativeBuildVersion}
`

export const openEmail = (): void => {
	sendEmail({
		to: ['allaboutolaf@frogpond.tech'],
		subject: 'Support: All About Olaf',
		body: getDeviceInfo(),
	})
}

const getVersion = () =>
	formatVersion(
		Application.nativeApplicationVersion,
		Application.nativeBuildVersion,
	)

export const SupportSection = (): React.ReactNode => {
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
