// @flow
import * as React from 'react'
import {Alert} from 'react-native'
import {Section, PushButtonCell} from '@frogpond/tableview'
import {type NavigationScreenProp} from 'react-navigation'
import {sendEmail} from '../../../../components/send-email'
import DeviceInfo from 'react-native-device-info'
import {appVersion, appBuild} from '@frogpond/constants'
import {refreshApp} from '../../../../lib/refresh'

type Props = {navigation: NavigationScreenProp<*>}

const getDeviceInfo = async () => `

----- Please do not edit below here -----
${await DeviceInfo.getBrand()} ${await DeviceInfo.getModel()}
${await DeviceInfo.getDeviceId()}
${await DeviceInfo.getSystemName()} ${appVersion()}+${appBuild() || 'unknown'}
${await DeviceInfo.getReadableVersion()}
`

const openEmail = async () => {
	sendEmail({
		to: ['allaboutolaf@stolaf.edu'],
		subject: 'Support: All About Olaf',
		body: await getDeviceInfo(),
	})
}

export class SupportSection extends React.Component<Props> {
	onPressButton = (id: string) => {
		this.props.navigation.navigate(id)
	}

	onFaqButton = () => this.onPressButton('FaqView')

	onResetButton = () => {
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

	render() {
		return (
			<Section header="SUPPORT">
				<PushButtonCell onPress={openEmail} title="Contact Us" />
				<PushButtonCell onPress={this.onFaqButton} title="FAQs" />
				<PushButtonCell onPress={this.onResetButton} title="Reset Everything" />
			</Section>
		)
	}
}
