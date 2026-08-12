import * as React from 'react'
import {ScrollView} from 'react-native'
import {Section, TableView} from '@frogpond/tableview'
import {ButtonCell, SelectableCell} from '@frogpond/tableview/cells'
import {ListFooter} from '@frogpond/lists'
import {getTimes} from './calendar-util'
import {AddToCalendar} from '@frogpond/add-to-device-calendar'
import type {EventType} from '@frogpond/event-type'
import type {PoweredBy} from './types'

function MaybeSection({header, content}: {header: string; content: string}) {
	return content ? (
		<Section header={header}>
			<SelectableCell text={content} />
		</Section>
	) : null
}

type Props = {
	event: EventType
	poweredBy: PoweredBy
}

export function EventDetail({event, poweredBy}: Props): React.ReactNode {
	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic">
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

				{poweredBy.title ? (
					<ListFooter href={poweredBy.href} title={poweredBy.title} />
				) : null}
			</TableView>
		</ScrollView>
	)
}
