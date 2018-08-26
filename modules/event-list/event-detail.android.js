// @flow
import * as React from 'react'
import {Text, ScrollView, StyleSheet} from 'react-native'
import type {EventType, PoweredBy} from './types'
import {NavigationScreenProp} from 'react-navigation'
import {ShareButton} from '@frogpond/navigation-buttons'
import {openUrl} from '@frogpond/open'
import {Card} from '../../source/components/card'
import * as c from '@frogpond/colors'
import {ButtonCell} from '@frogpond/tableview'
import {getLinksFromEvent, shareEvent, getTimes} from './calendar-util'
import {AddToCalendar} from '@frogpond/add-to-device-calendar'
import {ListFooter} from '@frogpond/lists'

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

type Navigation = NavigationScreenProp<{
	params: {event: EventType, poweredBy: ?PoweredBy},
}>

type Props = {
	navigation: Navigation,
}

export class EventDetail extends React.PureComponent<Props> {
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
				<Title title={event.title} />
				<MaybeCard content={getTimes(event)} header="When" />
				<MaybeCard content={event.location} header="Location" />
				<MaybeCard content={event.description} header="Description" />

				<Links urls={getLinksFromEvent(event)} />

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
}
