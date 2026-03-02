import * as React from 'react'
import {ScrollView} from 'react-native'
import {Section, TableView} from '@frogpond/tableview'
import {ButtonCell, SelectableCell} from '@frogpond/tableview/cells'
import {ShareButton} from '@frogpond/navigation-buttons'
import {ListFooter} from '@frogpond/lists'
import {getTimes, shareEvent} from './calendar-util'
import {AddToCalendar} from '@frogpond/add-to-device-calendar'
import {Stack, useLocalSearchParams} from 'expo-router'
import type {EventType} from '@frogpond/event-type'
import type {PoweredBy} from './types'

function MaybeSection({header, content}: {header: string; content: string}) {
	return content ? (
		<Section header={header}>
			<SelectableCell text={content} />
		</Section>
	) : null
}

export function EventDetail(): React.JSX.Element {
	let params = useLocalSearchParams<{event: string; poweredBy: string}>()
	let event = JSON.parse(params.event) as EventType
	let poweredBy = JSON.parse(params.poweredBy) as PoweredBy

	return (
		<>
			<Stack.Screen
				options={{
					title: event.title,
					headerRight: () => <ShareButton onPress={() => shareEvent(event)} />,
				}}
			/>
			<ScrollView>
				<TableView>
					<MaybeSection content={event.title.trim()} header="EVENT" />
					<MaybeSection content={getTimes(event).trim()} header="TIME" />
					<MaybeSection content={event.location.trim()} header="LOCATION" />
					<MaybeSection
						content={event.description.trim()}
						header="DESCRIPTION"
					/>

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

					{poweredBy.title ? (
						<ListFooter href={poweredBy.href} title={poweredBy.title} />
					) : null}
				</TableView>
			</ScrollView>
		</>
	)
}
