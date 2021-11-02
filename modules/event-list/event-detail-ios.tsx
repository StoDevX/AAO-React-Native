import * as React from 'react'
import {ScrollView} from 'react-native'
import {
	Section,
	TableView,
	ButtonCell,
	SelectableCell,
} from '@frogpond/tableview'
import {ShareButton} from '@frogpond/navigation-buttons'
import {ListFooter} from '@frogpond/lists'
import {shareEvent, getTimes} from './calendar-util'
import {AddToCalendar} from '@frogpond/add-to-device-calendar'
import { RouteProp, useRoute } from '@react-navigation/native'
import { RootStackParamList } from '../../source/navigation/types'
import { NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { NavigationKey } from './event-detail-base'

function MaybeSection({header, content}: {header: string; content: string}) {
	return content ? (
		<Section header={header}>
			<SelectableCell text={content} />
		</Section>
	) : null
}

export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, typeof NavigationKey>
}): NativeStackNavigationOptions => {
	let {event} = props.route.params;
	return {
		title: event.title, 
		headerRight: (p) => <ShareButton {...p} onPress={() => shareEvent(event)} />,
	}
}

export function EventDetail(): JSX.Element {
	let route = useRoute<RouteProp<RootStackParamList, typeof NavigationKey>>();
	let {event, poweredBy} = route.params;

	return (
		<ScrollView>
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
