import * as React from 'react'
import {ScrollView, StyleSheet, Text} from 'react-native'

import {RouteProp, useRoute} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

import {AddToCalendar} from '@frogpond/add-to-device-calendar'
import * as c from '@frogpond/colors'
import {EventType} from '@frogpond/event-type'
import {ListFooter} from '@frogpond/lists'
import {openUrl} from '@frogpond/open-url'
import {Card} from '@frogpond/silly-card'
import {ButtonCell} from '@frogpond/tableview/cells'

import {RootStackParamList} from '../../source/navigation/types'
import {getTimes} from './calendar-util'
import {NavigationKey} from './event-detail-base'

const styles = StyleSheet.create({
	name: {
		textAlign: 'center',
		marginTop: 20,
		marginBottom: 15,
		paddingHorizontal: 5,
		color: c.label,
		fontSize: 32,
		fontWeight: '300',
	},
	card: {
		marginBottom: 20,
	},
	cardBody: {
		color: c.label,
		paddingTop: 13,
		paddingBottom: 13,
		paddingLeft: 16,
		paddingRight: 16,
		fontSize: 16,
	},
})

function MaybeCard({header, content}: {header: string; content: string}) {
	return content.trim() ? (
		<Card header={header} style={styles.card}>
			<Text style={styles.cardBody}>{content}</Text>
		</Card>
	) : null
}

function Title({event}: {event: EventType}) {
	return event.title ? <Text style={styles.name}>{event.title}</Text> : null
}

function Links({urls}: {urls: Array<string>}) {
	return urls.length ? (
		<Card header="Links" style={styles.card}>
			{urls.map((url) => (
				<Text key={url} onPress={() => openUrl(url)} style={styles.cardBody}>
					{url}
				</Text>
			))}
		</Card>
	) : null
}

export const NavigationOptions = (props: {
	route: RouteProp<RootStackParamList, typeof NavigationKey>
}): NativeStackNavigationOptions => {
	let {event} = props.route.params
	return {
		title: event.title,
	}
}

export function EventDetail(): JSX.Element {
	let route = useRoute<RouteProp<RootStackParamList, typeof NavigationKey>>()
	let {event, poweredBy} = route.params

	return (
		<ScrollView>
			<Title event={event} />
			<MaybeCard content={getTimes(event)} header="When" />
			<MaybeCard content={event.location} header="Location" />
			<MaybeCard content={event.description} header="Description" />

			<Links urls={event.links} />

			<AddToCalendar
				event={event}
				render={({message, disabled, onPress}) => (
					<Card footer={message} style={styles.card}>
						<ButtonCell
							disabled={disabled}
							onPress={onPress}
							title="Add to calendar"
						/>
					</Card>
				)}
			/>

			{poweredBy.title ? (
				<ListFooter href={poweredBy.href} title={poweredBy.title} />
			) : null}
		</ScrollView>
	)
}
