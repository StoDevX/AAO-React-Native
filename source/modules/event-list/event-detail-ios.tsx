import * as React from 'react'
import {ScrollView} from 'react-native'
import {Section, TableView} from '../tableview'
import {ButtonCell, SelectableCell} from '../tableview/cells'
import {ShareButton} from '../navigation-buttons'
import {ListFooter} from '../lists'
import {getTimes, shareEvent} from './calendar-util'
import {AddToCalendar} from '../add-to-device-calendar'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

function MaybeSection({header, content}: {header: string; content: string}) {
	return content ? (
		<Section header={header}>
			<SelectableCell text={content} />
		</Section>
	) : null
}

export function EventDetail(): React.JSX.Element {
	const {eventId, poweredBy, poweredByUrl} = useLocalSearchParams<{
		eventId: string
		poweredBy?: string
		poweredByUrl?: string
	}>()

	const event = useQuery(getEvents())

	return (
		<ScrollView>
			<Stack.Screen
				options={{
					headerTitle: event.title,
					headerRight: (p) => (
						<ShareButton {...p} onPress={() => shareEvent(event)} />
					),
				}}
			/>
			<TableView>
				<MaybeSection content={event.title.trim()} header="EVENT" />
				<MaybeSection content={getTimes(event).trim()} header="TIME" />
				<MaybeSection content={event.location.trim()} header="LOCATION" />
				<MaybeSection content={event.description.trim()} header="DESCRIPTION" />

				<AddToCalendar
					event={event}
					render={({message, disabled, onPress}) => (
						<Section footer={message}>
							<ButtonCell
								disabled={disabled}
								onPress={onPress}
								title="Add to calendar"
							/>
						</Section>
					)}
				/>

				{poweredBy ? (
					<ListFooter href={poweredByUrl} title={poweredBy} />
				) : null}
			</TableView>
		</ScrollView>
	)
}
