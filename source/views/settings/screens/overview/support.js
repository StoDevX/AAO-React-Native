// @flow
import * as React from 'react'
import {Alert} from 'react-native'
import {Section, PushButtonCell} from '@frogpond/tableview'
import type {TopLevelViewPropsType} from '../../types'
import {sendEmail} from '../../../components/send-email'
import DeviceInfo from 'react-native-device-info'
import {version} from '../../../../package.json'
import {refreshApp} from '../../../lib/refresh'
import {sectionBgColor} from '@frogpond/colors'

type Props = TopLevelViewPropsType

const getDeviceInfo = () => `

----- Please do not edit below here -----
${DeviceInfo.getBrand()} ${DeviceInfo.getModel()}
${DeviceInfo.getDeviceId()}
${DeviceInfo.getSystemName()} ${version}
${DeviceInfo.getReadableVersion()}
`

const openEmail = () => {
	sendEmail({
		to: ['allaboutolaf@stolaf.edu'],
		subject: 'Support: All About Olaf',
		body: getDeviceInfo(),
	})
}

export default class SupportSection extends React.Component<Props> {
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
			<Section header="SUPPORT" sectionTintColor={sectionBgColor}>
				<PushButtonCell onPress={openEmail} title="Contact Us" />
				<PushButtonCell onPress={this.onFaqButton} title="FAQs" />
				<PushButtonCell onPress={this.onResetButton} title="Reset Everything" />
			</Section>
		)
	}
}
