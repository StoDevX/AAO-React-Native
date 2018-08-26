// @flow
import * as React from 'react'
import {Text, ScrollView, StyleSheet} from 'react-native'
import {Cell, Section, TableView, ButtonCell} from '@frogpond/tableview'
import type {EventType, PoweredBy} from './types'
import type {NavigationScreenProp} from 'react-navigation'
import {ShareButton} from '@frogpond/navigation-buttons'
import {openUrl} from '@frogpond/open-url'
import {ListFooter} from '@frogpond/lists'
import {getLinksFromEvent, shareEvent, getTimes} from './calendar-util'
import {AddToCalendar} from '@frogpond/add-to-device-calendar'

const styles = StyleSheet.create({
	chunk: {
		paddingVertical: 10,
	},
})

function MaybeSection({header, content}: {header: string, content: string}) {
	return content.trim() ? (
		<Section header={header}>
			<Cell
				cellContentView={
					<Text selectable={true} style={styles.chunk}>
						{content}
					</Text>
				}
			/>
		</Section>
	) : null
}

function Links({header, event}: {header: string, event: EventType}) {
	const links = getLinksFromEvent(event)

	return links.length ? (
		<Section header={header}>
			{links.map(url => (
				<Cell
					key={url}
					accessory="DisclosureIndicator"
					onPress={() => openUrl(url)}
					title={url}
				/>
			))}
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
					<Links event={event} header="LINKS" />

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
