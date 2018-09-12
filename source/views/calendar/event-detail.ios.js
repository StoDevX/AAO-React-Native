// @flow
import * as React from 'react'
import {ScrollView} from 'react-native'
import {
	Section,
	TableView,
	ButtonCell,
	SelectableCell,
} from '@frogpond/tableview'
import type {EventType, PoweredBy} from './types'
import type {TopLevelViewPropsType} from '../types'
import {ShareButton} from '@frogpond/navigation-buttons'
import {ListFooter} from '@frogpond/lists'
import {shareEvent, getTimes} from './calendar-util'
import {AddToCalendar} from '../../components/add-to-calendar'

function MaybeSection({header, content}: {header: string, content: string}) {
	return content.trim() ? (
		<Section header={header}>
			<SelectableCell text={content} />
		</Section>
	) : null
}

type Props = TopLevelViewPropsType & {
	navigation: {
		state: {params: {event: EventType, poweredBy: ?PoweredBy}},
	},
}

export class EventDetail extends React.Component<Props> {
	static navigationOptions = ({navigation}: any) => {
		const {event} = navigation.state.params
		return {
			title: event.title,
			headerRight: <ShareButton onPress={() => shareEvent(event)} />,
		}
	}

	render() {
		const {event, poweredBy} = this.props.navigation.state.params

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

					{poweredBy.title ? (
						<ListFooter href={poweredBy.href} title={poweredBy.title} />
					) : null}
				</TableView>
			</ScrollView>
		)
	}
}
