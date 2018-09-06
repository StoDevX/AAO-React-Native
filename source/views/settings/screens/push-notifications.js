// @flow

import * as React from 'react'
import {ScrollView} from 'glamorous-native'
import {TableView, Section, CellToggle} from '@frogpond/tableview'
import {connect} from 'react-redux'
import type {ReduxState} from '../../../redux'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import flatten from 'lodash/flatten'
import {
	type NotificationChannelName,
	enable,
	disable,
	toggleSubscription,
} from '../../../redux/parts/notifications'

type ReduxStateProps = {|
	+channels: Set<NotificationChannelName>,
	+enabled: boolean,
|}

type ReduxDispatchProps = {|
	+onChangeEnabledToggle: (enabled: boolean) => any,
	+onToggleChannel: (channelName: NotificationChannelName) => any,
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

	render() {
		// TODO: use redux.state.notifications.permissions.hasPrompted to
		// display a message about how to open Settings if
		// hasPrompted is true and enabled is false

		return (
			<ScrollView contentInsetAdjustmentBehavior="automatic">
				<TableView>
					<Section>
						<CellToggle
							label="Allow Notifications"
							onChange={this.props.onChangeEnabledToggle}
							value={this.props.enabled}
						/>
					</Section>

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
	}),
	(dispatch): ReduxDispatchProps => ({
		onChangeEnabledToggle: (s: boolean) =>
			s ? dispatch(enable()) : dispatch(disable()),
		onToggleChannel: (name: NotificationChannelName) =>
			dispatch(toggleSubscription(name)),
	}),
)(PushNotificationsSettingsView)
