// @flow
import * as React from 'react'
import {Text, ScrollView, StyleSheet} from 'react-native'
import type {EventType, PoweredBy} from './types'
import type {TopLevelViewPropsType} from '../types'
import {ShareButton} from '../components/nav-buttons'
import openUrl from '../components/open-url'
import {Card} from '../components/card'
import * as c from '../components/colors'
import {ButtonCell} from '../components/cells/button'
import {
	getLinksFromEvent,
	addToCalendar,
	shareEvent,
	getTimes,
} from './calendar-util'
import delay from 'delay'
import {ListFooter} from '../components/list'

const styles = StyleSheet.create({
	name: {
		textAlign: 'center',
		marginTop: 20,
		marginBottom: 15,
		paddingHorizontal: 5,
		color: c.black,
		fontSize: 32,
		fontWeight: '300',
	},
	card: {
		marginBottom: 20,
	},
	cardBody: {
		color: c.black,
		paddingTop: 13,
		paddingBottom: 13,
		paddingLeft: 16,
		paddingRight: 16,
		fontSize: 16,
	},
})

function MaybeCard({header, content}: {header: string, content: string}) {
	return content.trim() ? (
		<Card header={header} style={styles.card}>
			<Text style={styles.cardBody}>{content}</Text>
		</Card>
	) : null
}

function Title({title}: {title: EventType}) {
	return title ? <Text style={styles.name}>{title}</Text> : null
}

function Links({urls}: {urls: Array<string>}) {
	return urls.length ? (
		<Card header="Links" style={styles.card}>
			{urls.map(url => (
				<Text key={url} onPress={() => openUrl(url)} style={styles.cardBody}>
					{url}
				</Text>
			))}
		</Card>
	) : null
}

const CalendarButton = ({message, disabled, onPress}) => {
	return (
		<Card footer={message} style={styles.card}>
			<ButtonCell
				disabled={disabled}
				onPress={onPress}
				title="Add to calendar"
			/>
		</Card>
	)
}

type Props = TopLevelViewPropsType & {
	navigation: {
		state: {params: {event: EventType, poweredBy: ?PoweredBy}},
	},
}

type State = {
	message: string,
	disabled: boolean,
}

export class EventDetail extends React.PureComponent<Props, State> {
	static navigationOptions = ({navigation}: any) => {
		const {event} = navigation.state.params
		return {
			title: event.title,
			headerRight: <ShareButton onPress={() => shareEvent(event)} />,
		}
	}

	state = {
		message: '',
		disabled: false,
	}

	addEvent = async (event: EventType) => {
		const start = Date.now()
		this.setState(() => ({message: 'Adding event to calendar…'}))

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		const elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		const result = await addToCalendar(event)

		if (result) {
			this.setState(() => ({
				message: 'Event has been added to your calendar',
				disabled: true,
			}))
		} else {
			this.setState(() => ({
				message: 'Could not add event to your calendar',
				disabled: false,
			}))
		}
	}

	onPressButton = () => this.addEvent(this.props.navigation.state.params.event)

	render() {
		const {event, poweredBy} = this.props.navigation.state.params

		return (
			<ScrollView>
				<Title title={event.title} />
				<MaybeCard content={getTimes(event)} header="When" />
				<MaybeCard content={event.location} header="Location" />
				<MaybeCard content={event.description} header="Description" />

				<Links urls={getLinksFromEvent(event)} />

				<CalendarButton
					disabled={this.state.disabled}
					message={this.state.message}
					onPress={this.onPressButton}
				/>

				{poweredBy.title ? (
					<ListFooter href={poweredBy.href} title={poweredBy.title} />
				) : null}
			</ScrollView>
		)
	}
}
