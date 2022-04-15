import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import * as c from '@frogpond/colors'
import toPairs from 'lodash/toPairs'
import type {EventType} from '@frogpond/event-type'
import groupBy from 'lodash/groupBy'
import type {Moment} from 'moment-timezone'
import {FullWidthSeparator, ListSectionHeader} from '@frogpond/lists'
import {NoticeView} from '@frogpond/notice'
import EventRow from './event-row'
import {useNavigation} from '@react-navigation/native'
import {PoweredBy} from './types'

type Props = {
	detailView?: string
	events: EventType[]
	message?: string
	refreshing: boolean
	onRefresh: () => unknown
	now: Moment
	poweredBy: PoweredBy
}

type EventSection = {readonly title: string; readonly data: EventType[]}

function groupEvents(
	events: readonly EventType[],
	now: Moment,
): Array<EventSection> {
	let grouped = groupBy(events, (event) => {
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

export function EventList(props: Props): JSX.Element {
	let navigation = useNavigation()

	let onPressEvent = React.useCallback(
		(event: EventType) => {
			navigation.navigate('EventDetail', {
				event,
				poweredBy: props.poweredBy,
			})
		},
		[navigation, props.poweredBy],
	)

	if (props.message) {
		return <NoticeView text={props.message} />
	}

	return (
		<SectionList<EventType, EventSection>
			ItemSeparatorComponent={FullWidthSeparator}
			ListEmptyComponent={<NoticeView text="No events." />}
			contentContainerStyle={styles.contentContainer}
			keyExtractor={(item: EventType, index: number) => index.toString()}
			onRefresh={props.onRefresh}
			refreshing={props.refreshing}
			renderItem={({item}) => <EventRow event={item} onPress={onPressEvent} />}
			renderSectionHeader={({section}) => (
				<ListSectionHeader spacing={{left: 10}} title={section.title} />
			)}
			sections={groupEvents(props.events, props.now)}
			showsVerticalScrollIndicator={false}
			style={styles.container}
		/>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: c.white,
	},
	contentContainer: {
		flexGrow: 1,
	},
})
