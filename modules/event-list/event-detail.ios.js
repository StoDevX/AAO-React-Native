// @flow
import * as React from 'react'
import {ScrollView} from 'react-native'
import {
	Section,
	TableView,
	ButtonCell,
	SelectableCell,
} from '@frogpond/tableview'
import type {EventType} from '@frogpond/event-type'
import type {PoweredBy} from './types'
import type {NavigationScreenProp} from 'react-navigation'
import {ShareButton} from '@frogpond/navigation-buttons'
import {ListFooter} from '@frogpond/lists'
import {shareEvent, getTimes} from './calendar-util'
import {AddToCalendar} from '@frogpond/add-to-device-calendar'

function MaybeSection({header, content}: {header: string, content: string}) {
	return content.trim() ? (
		<Section header={header}>
			<SelectableCell text={content} />
		</Section>
	) : null
}

type Navigation = NavigationScreenProp<{
	params: {event: EventType, poweredBy: ?PoweredBy},
}>

type Props = {
	navigation: Navigation,
}

export class EventDetail extends React.Component<Props> {
	static navigationOptions = ({navigation}: {navigation: Navigation}) => {
		let {event} = navigation.state.params

		return {
			title: event.title,
			headerRight: <ShareButton onPress={() => shareEvent(event)} />,
		}
	}

	render() {
		let {event, poweredBy} = this.props.navigation.state.params

		return (
			<ScrollView>
				<TableView>
					<MaybeSection content={event.title} header="EVENT" />
					<MaybeSection content={getTimes(event)} header="TIME" />
					<MaybeSection content={event.location} header="LOCATION" />
					<MaybeSection content={event.description} header="DESCRIPTION" />

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

					{poweredBy && poweredBy.title ? (
						<ListFooter href={poweredBy.href} title={poweredBy.title} />
					) : null}
				</TableView>
			</ScrollView>
		)
	}
}
