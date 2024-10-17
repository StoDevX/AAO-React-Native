import * as React from 'react'
import {Button, ScrollView, StyleSheet, Text} from 'react-native'
import {openUrl} from '../open-url'
import {Card} from '../silly-card'
import * as c from '../colors'
import {ButtonCell} from '../tableview/cells'
import {getTimes, shareEvent} from './calendar-util'
import {AddToCalendar} from '../add-to-device-calendar'
import {ListFooter} from '../lists'
import {RouteProp, useRoute} from 'expo-router'
import {NativeStackNavigationOptions} from 'expo-router-stack'
import {RootStackParamList} from '../../navigation/types'
import {NavigationKey} from './event-detail-base'
import {EventType} from '../event-type'
import {captureException} from '@sentry/react-native'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

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

function Links({urls}: {urls: string[]}) {
	return urls.length ? (
		<Card header="Links" style={styles.card}>
			{urls.map((url) => (
				<Text
					key={url}
					onPress={() => {
						openUrl(url).catch((err: unknown) => captureException(err))
					}}
					style={styles.cardBody}
				>
					{url}
				</Text>
			))}
		</Card>
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

			{poweredBy ? <ListFooter href={poweredByUrl} title={poweredBy} /> : null}
		</ScrollView>
	)
}
