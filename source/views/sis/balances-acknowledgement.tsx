import * as React from 'react'
import {Platform, ScrollView, StyleSheet, View} from 'react-native'

import {Avatar, Button, Card, Paragraph as AndroidP} from 'react-native-paper'
import Icon from 'react-native-vector-icons/Ionicons'

import {Button as IosButton} from '@frogpond/button'
import * as c from '@frogpond/colors'
import {Paragraph as IosP} from '@frogpond/markdown'
import {Card as IosCard} from '@frogpond/silly-card'

import {useAppDispatch, useAppSelector} from '../../redux'
import {
	acknowledgeAcknowledgement,
	selectAcknowledgement,
} from '../../redux/parts/settings'
import {BalancesView} from './balances'

let Paragraph = Platform.OS === 'android' ? AndroidP : IosP
let Ack = Platform.OS === 'android' ? AndroidAck : IosAck

export function BalancesOrAcknowledgementView(): JSX.Element {
	let dispatch = useAppDispatch()
	let alertSeen = useAppSelector(selectAcknowledgement)

	if (alertSeen) {
		return <BalancesView />
	}

	let content = (
		<>
			<Paragraph style={styles.cardText}>
				We want to make sure you have the most up-to-date information in the
				app, but please keep in mind that there may be some inaccuracies.
			</Paragraph>
			<Paragraph style={styles.cardText}>
				With that in mind, before you can view your balances in the app, we ask
				that you agree to the following.{'\n'}
			</Paragraph>

			<Paragraph style={styles.bonappNotice}>
				The information in the app may not be completely accurate.{'\n'}
				{'\n'}
				Bon Appétit is always the final authority on any discrepancies.{'\n'}
				{'\n'}
				This app is not an official college app.{'\n'}
			</Paragraph>

			<Paragraph style={styles.cardText}>
				If you do not agree to these terms, you will not be able to see your
				balances in the app, but you can still use the rest of the features.
			</Paragraph>
		</>
	)

	let ackProps = {
		onPositive: () => dispatch(acknowledgeAcknowledgement(true)),
		subtitle: 'Bon Appétit is always right',
		title: 'Before you continue…',
	}

	return <Ack {...ackProps}>{content}</Ack>
}

type AcknowledgementProps = React.PropsWithChildren<{
	title: string
	subtitle: string
	onPositive: () => void
}>

function AndroidAck(props: AcknowledgementProps) {
	let {title, subtitle, children, onPositive} = props

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Card style={styles.androidCard}>
				<Card.Title
					left={(props) => (
						<Avatar.Icon
							{...props}
							icon={({size, color}) => (
								<Icon name="md-warning" size={size} style={{color}} />
							)}
						/>
					)}
					subtitle={subtitle}
					title={title}
				/>
				<Card.Content>{children}</Card.Content>
				<Card.Actions>
					<Button mode="contained" onPress={onPositive}>
						I Agree
					</Button>
				</Card.Actions>
			</Card>
		</ScrollView>
	)
}

function IosAck(props: AcknowledgementProps) {
	let {title, children, onPositive} = props

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<IosCard header={title}>
				<>
					{children}

					<View style={styles.iosButtonRow}>
						<IosButton onPress={onPositive} title="I Agree" />
					</View>
				</>
			</IosCard>
		</ScrollView>
	)
}

let styles = StyleSheet.create({
	container: {
		marginVertical: 10,
	},
	cardText: {
		color: c.secondaryLabel,
	},
	androidCard: {
		marginHorizontal: 10,
		marginBottom: 10,
	},
	bonappNotice: {
		fontWeight: Platform.select({
			ios: '600',
			android: '700',
		}),
		color: c.label,
		textAlign: 'center',
	},
	iosButtonRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
	},
})
