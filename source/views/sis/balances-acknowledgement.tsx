import * as React from 'react'
import {StyleSheet, ScrollView, Platform, View} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {useSelector, useDispatch} from 'react-redux'
import {selectAcknowledgement, acknowledgeAcknowledgement} from '../../redux/parts/settings'
import {Avatar, Button, Card, Paragraph as AndroidP} from 'react-native-paper'
import {Paragraph as IosP} from '@frogpond/markdown'
import {Card as IosCard} from '@frogpond/silly-card'
import {Button as IosButton} from '@frogpond/button'
import {ConnectedBalancesView as BalancesView} from './balances'

let Paragraph = Platform.OS === 'android' ? AndroidP : IosP
let Ack = Platform.OS === 'android' ? AndroidAck : IosAck

export function BalancesOrAcknowledgementView(): JSX.Element {
	let dispatch = useDispatch()
	let alertSeen = useSelector(selectAcknowledgement)

	let acknowledge = React.useCallback(
		() => dispatch(acknowledgeAcknowledgement(true)),
		[dispatch],
	)

	if (alertSeen) {
		return <BalancesView />
	}

	let content = (
		<>
			<Paragraph>
				While we strive to keep this app and the data therein up-to-date, there
				will always be issues, especially seeing as we are not part of the
				college. (Students and alumni of, yes, but officially sponsored by, no.)
			</Paragraph>
			<Paragraph>
				As such, we require that you agree to the following statement before you
				can see your balances within the app:
			</Paragraph>
			<Paragraph style={styles.bonappNotice}>
				This data may be inaccurate.{'\n'}
				Bon Appétit is always right.{'\n'}
				This app is unofficial.
			</Paragraph>
			<Paragraph>
				If you disagree, you will simply not be able to access this Balances
				view. The rest of the app will remain available for perusal.
			</Paragraph>
		</>
	)

	let ackProps = {
		onPositive: acknowledge,
		subtitle: 'Bon Appétit is always right',
		title: 'Before you continue…',
	}

	return <Ack {...ackProps}>{content}</Ack>
}

type AcknowledgementProps = {
	title: string
	subtitle: string
	children: React.ReactChildren | JSX.Element
	onPositive: () => void
}

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
				{children}

				<View style={styles.iosButtonRow}>
					<IosButton onPress={onPositive} title="I Agree" />
				</View>
			</IosCard>
		</ScrollView>
	)
}

let styles = StyleSheet.create({
	container: {
		marginVertical: 10,
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
		textAlign: 'center',
	},
	iosButtonRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
	},
})
