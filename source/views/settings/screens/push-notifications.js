// @flow

import * as React from 'react'
import {AppState, Platform, Linking} from 'react-native'
import {ScrollView} from 'glamorous-native'
import {
	TableView,
	Section,
	CellToggle,
	PushButtonCell,
} from '@frogpond/tableview'
import {connect} from 'react-redux'
import type {ReduxState} from '../../../redux'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import flatten from 'lodash/flatten'
import {
	type NotificationChannelName,
	hydrate,
	prompt,
	toggleSubscription,
} from '../../../redux/parts/notifications'

type ReduxStateProps = {|
	+channels: Set<NotificationChannelName>,
	+enabled: boolean,
	+hasPrompted: boolean,
|}

type ReduxDispatchProps = {|
	+onChangeEnabledToggle: () => any,
	+onToggleChannel: (channelName: NotificationChannelName) => any,
	+rehydrate: () => any,
|}

type Props = ReduxStateProps & ReduxDispatchProps

const notificationTypes = [
	{
		key: 'channel:campus/emergency',
		label: 'Emergency Notices',
		group: 'Campus',
		forced: true,
	},
	{
		key: 'channel:cage/late-night-specials',
		label: 'Late Night Specials',
		group: 'The Cage',
	},
	{
		key: 'channel:pause/monthly-special',
		label: 'Monthly Specials',
		group: "Lion's Pause",
	},
	{
		key: 'channel:multimedia/weekly-movie',
		label: 'Weekly Movie',
		group: 'Multimedia',
	},
	{
		key: 'channel:post-office/packages',
		label: 'Packages',
		group: 'Post Office',
	},
	{
		key: 'channel:sga/announcements',
		label: 'Announcements',
		group: 'Student Government Association',
	},
]

class PushNotificationsSettingsView extends React.Component<Props> {
	static navigationOptions = {
		title: 'Notifications',
	}

	state = {
		appState: AppState.currentState,
	}

	componentDidMount() {
		AppState.addEventListener('change', this._handleAppStateChange)
	}

	componentWillUnmount() {
		AppState.removeEventListener('change', this._handleAppStateChange)
	}

	_handleAppStateChange = nextAppState => {
		if (
			this.state.appState.match(/inactive|background/) &&
			nextAppState === 'active'
		) {
			this.props.rehydrate()
		}

		this.setState({appState: nextAppState})
	}

	render() {
		let titleText
		let footerText
		let onPress

		const showSettingsEnableButton =
			Platform.OS === 'ios' && !this.props.enabled && !this.props.hasPrompted
		const showSettingsDeclinedButton =
			Platform.OS === 'ios' && !this.props.enabled && this.props.hasPrompted
		const showSettingsDisableButton =
			Platform.OS === 'ios' && this.props.enabled

		// we haye not been prompted before -- let onesignal prompt for permissions
		if (showSettingsEnableButton) {
			titleText = 'Turn On Notifications'
			footerText =
				'Notifications are turned off for "All About Olaf". You can turn notifications on for this app by pushing the button above.'
			onPress = this.props.onChangeEnabledToggle
			// we declined the initial prompt -- give an option to open settings to turn on notifications
		} else if (showSettingsDeclinedButton) {
			titleText = 'Open Settings'
			footerText =
				'Notifications are turned off for "All About Olaf". You can turn notifications on for this app in Settings.'
			onPress = () => Linking.openURL('app-settings:')
			// we have seen the prompt and given permission -- given an option to open settings to turn off notifications
		} else if (showSettingsDisableButton) {
			titleText = 'Turn Off Notifications'
			footerText =
				'Notifications are turned on for "All About Olaf". You can turn notifications off for this app in Settings.'
			onPress = () => Linking.openURL('app-settings:')
		}

		return (
			<ScrollView contentInsetAdjustmentBehavior="automatic">
				<TableView>
					{Platform.OS === 'ios' ? (
						<Section footer={footerText} header="NOTIFICATION SETTINGS">
							<PushButtonCell onPress={onPress} title={titleText} />
						</Section>
					) : null}

					<Section header="CHANNELS">
						{flatten(
							toPairs(groupBy(notificationTypes, c => c.group)).map(
								([groupName, channels]) =>
									channels.map(chan => {
										// if the channel is forced, then we want to show the switch
										// as being "on", unless notifications are disabled, in which
										// case we can't send the forced notification, so we want to
										// show it as being "off".
										let forcedOn = chan.forced
											? this.props.enabled
												? true
												: false
											: false

										return (
											<CellToggle
												key={chan.key}
												detail={groupName}
												disabled={this.props.enabled === false || chan.forced}
												label={chan.label}
												onChange={() => this.props.onToggleChannel(chan.key)}
												value={forcedOn || this.props.channels.has(chan.key)}
											/>
										)
									}),
							),
						)}
					</Section>
				</TableView>
			</ScrollView>
		)
	}
}

export const ConnectedPushNotificationsSettingsView = connect(
	(state: ReduxState): ReduxStateProps => ({
		channels: state.notifications ? state.notifications.channels : new Set(),
		enabled: state.notifications ? state.notifications.enabled : false,
		hasPrompted: state.notifications ? state.notifications.hasPrompted : false,
	}),
	(dispatch): ReduxDispatchProps => ({
		onChangeEnabledToggle: () => dispatch(prompt()),
		onToggleChannel: (name: NotificationChannelName) =>
			dispatch(toggleSubscription(name)),
		rehydrate: () => dispatch(hydrate()),
	}),
)(PushNotificationsSettingsView)
