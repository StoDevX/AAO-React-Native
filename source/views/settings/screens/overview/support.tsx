import * as React from 'react'
import {Alert} from 'react-native'
import {LabeledContent, Section, Text} from '@expo/ui/swift-ui'
import {sendEmail} from '../../../../components/send-email'
import * as Application from 'expo-application'
import * as Device from 'expo-device'
import {refreshApp} from '../../../../lib/refresh'
import {useNavigation} from '@react-navigation/native'
import {formatVersion} from './version'
import {ActionRow, NavigationRow} from '../../components/rows'

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
		<Section title="Support">
			<NavigationRow onPress={() => navigation.navigate('Faq')} title="FAQs" />
			<ActionRow onPress={openEmail} title="Contact Us" />
			<ActionRow onPress={onResetButton} title="Reset Everything" />
			<LabeledContent label="Version">
				<Text>{getVersion()}</Text>
			</LabeledContent>
		</Section>
	)
}
