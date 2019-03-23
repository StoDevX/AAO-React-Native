// @flow
import * as React from 'react'
import {Cell, Section, PushButtonCell} from '@frogpond/tableview'
import {appVersion, appBuild} from '@frogpond/constants'
import type {ReduxState} from '../../../../redux'
import {connect} from 'react-redux'
import {type NavigationScreenProp} from 'react-navigation'
import {isDevMode} from '@frogpond/constants'

type Props = {
	navigation: NavigationScreenProp<*>,
}

export class OddsAndEndsSection extends React.Component<Props> {
	onDebugButton = () => this.props.navigation.navigate('DebugView')

	onNotificationsButton = () => {
		this.props.navigation.navigate('PushNotificationsSettingsView')
	}

	onBundlePickerButton = () => {
		this.props.navigation.navigate('BundlePickerView')
	}

	render() {
		let version = appVersion()
		let build = appBuild()

		return (
			<Section header="ODDS &amp; ENDS">
				<Cell cellStyle="RightDetail" detail={version} title="Version" />
				{build && (
					<Cell cellStyle="RightDetail" detail={build} title="Build Number" />
				)}

				<ConnectedNotificationsCell onPress={this.onNotificationsButton} />

				{isDevMode() && (
					<>
						<PushButtonCell onPress={this.onDebugButton} title="Debug" />
						<PushButtonCell
							onPress={this.onBundlePickerButton}
							title="Bundle Picker"
						/>
					</>
				)}
			</Section>
		)
	}
}

type NotificationsCellProps = {
	isSubscribed: boolean,
	onPress: () => any,
}

function NotificationsCell(props: NotificationsCellProps) {
	let {isSubscribed} = props

	return (
		<PushButtonCell
			detail={isSubscribed ? 'Subscribed' : 'Disabled'}
			onPress={props.onPress}
			title="Push Notifications (BETA)"
		/>
	)
}

const ConnectedNotificationsCell = connect((state: ReduxState) => ({
	isSubscribed: state.notifications ? state.notifications.enabled : false,
}))(NotificationsCell)
