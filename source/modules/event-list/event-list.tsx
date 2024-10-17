import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import * as c from '../colors'
import toPairs from 'lodash/toPairs'
import type {EventType} from '../event-type'
import groupBy from 'lodash/groupBy'
import type {Moment} from 'moment-timezone'
import {FullWidthSeparator, ListSectionHeader} from '../lists'
import {NoticeView} from '../notice'
import EventRow from './event-row'
import {useNavigation} from 'expo-router'

interface Props {
	detailView?: string
	events: EventType[]
	message?: string
	refreshing: boolean
	onRefresh: () => unknown
	now: Moment
	poweredBy: string
	poweredByUrl: string
}

interface EventSection {
	readonly title: string
	readonly data: EventType[]
}

function groupEvents(
	events: readonly EventType[],
	now: Moment,
): EventSection[] {
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

export function EventList(props: Props): React.JSX.Element {
	let navigation = useNavigation()

	let onPressEvent = React.useCallback(
		(event: EventType) => {
			navigation.navigate('./[eventId]', {
				event,
				poweredBy: props.poweredBy,
				poweredByUrl: props.poweredByUrl,
			})
		},
		[navigation, props.poweredBy, props.poweredByUrl],
	)

	if (props.message) {
		return <NoticeView text={props.message} />
	}

	return (
		<SectionList<EventType, EventSection>
			ItemSeparatorComponent={FullWidthSeparator}
			ListEmptyComponent={<NoticeView text="No events." />}
			contentContainerStyle={styles.contentContainer}
			keyExtractor={(item, index) => index.toString()}
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
		backgroundColor: c.secondarySystemBackground,
	},
	contentContainer: {
		flexGrow: 1,
	},
})
