// @flow

import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import * as c from '../components/colors'
import toPairs from 'lodash/toPairs'
import type {TopLevelViewPropsType} from '../types'
import type {EventType, PoweredBy} from './types'
import groupBy from 'lodash/groupBy'
import moment from 'moment-timezone'
import {ListSeparator, ListSectionHeader} from '../components/list'
import {NoticeView} from '../components/notice'
import EventRow from './event-row'
import {cleanEvent} from './clean-event'

const FullWidthSeparator = props => (
	<ListSeparator fullWidth={true} {...props} />
)

type Props = TopLevelViewPropsType & {
	events: EventType[],
	message: ?string,
	refreshing: boolean,
	onRefresh: () => any,
	now: moment,
	poweredBy: ?PoweredBy,
}

export class EventList extends React.PureComponent<Props> {
	groupEvents = (events: EventType[], now: moment): any => {
		// the proper return type is $ReadOnlyArray<{title: string, data: $ReadOnlyArray<EventType>}>
		const grouped = groupBy(events, event => {
			if (event.isOngoing) {
				return 'Ongoing'
			}
			if (event.startTime.isSame(now, 'day')) {
				return 'Today'
			}
			return event.startTime.format('ddd  MMM Do') // google returns events in CST
		})

		return toPairs(grouped).map(([key, value]) => ({
			title: key,
			data: value,
		}))
	}

	onPressEvent = (event: EventType) => {
		event = cleanEvent(event)
		this.props.navigation.navigate('EventDetailView', {
			event,
			poweredBy: this.props.poweredBy,
		})
	}

	renderSectionHeader = ({section: {title}}: any) => (
		// the proper type is ({section: {title}}: {section: {title: string}})
		<ListSectionHeader spacing={{left: 10}} title={title} />
	)

	renderItem = ({item}: {item: EventType}) => (
		<EventRow event={item} onPress={this.onPressEvent} />
	)

	keyExtractor = (item: EventType, index: number) => index.toString()

	render() {
		if (this.props.message) {
			return <NoticeView text={this.props.message} />
		}

		return (
			<SectionList
				ItemSeparatorComponent={FullWidthSeparator}
				ListEmptyComponent={<NoticeView text="No events." />}
				keyExtractor={this.keyExtractor}
				onRefresh={this.props.onRefresh}
				refreshing={this.props.refreshing}
				renderItem={this.renderItem}
				renderSectionHeader={this.renderSectionHeader}
				sections={this.groupEvents(this.props.events, this.props.now)}
				style={styles.container}
			/>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: c.white,
	},
})
