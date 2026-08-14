import * as React from 'react'
import {ScrollView, StyleSheet, Text, View} from 'react-native'
import {Card} from '@frogpond/silly-card'
import {Button} from '@frogpond/button'
import {BalancesView} from '../../../source/features/sis/balances'
import * as c from '@frogpond/colors'
import {useAppDispatch, useAppSelector} from '../../../source/redux'
import {
	acknowledgeAcknowledgement,
	selectAcknowledgement,
} from '../../../source/redux/parts/settings'

export default function SISBalancesPage(): React.ReactNode {
	let dispatch = useAppDispatch()
	let alertSeen = useAppSelector(selectAcknowledgement)

	if (alertSeen) {
		return <BalancesView />
	}

	let content = (
		<>
			<Text selectable={true} style={[styles.paragraph, styles.cardText]}>
				We want to make sure you have the most up-to-date information in the app, but please keep in
				mind that there may be some inaccuracies.
			</Text>
			<Text selectable={true} style={[styles.paragraph, styles.cardText]}>
				With that in mind, before you can view your balances in the app, we ask that you agree to
				the following.{'\n'}
			</Text>

			<Text selectable={true} style={[styles.paragraph, styles.bonappNotice]}>
				The information in the app may not be completely accurate.{'\n'}
				{'\n'}
				Bon Appétit is always the final authority on any discrepancies.{'\n'}
				{'\n'}
				This app is not an official college app.{'\n'}
			</Text>

			<Text selectable={true} style={[styles.paragraph, styles.cardText]}>
				If you do not agree to these terms, you will not be able to see your balances in the app,
				but you can still use the rest of the features.
			</Text>
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

function Ack(props: AcknowledgementProps) {
	let {title, children, onPositive} = props

	return (
		<ScrollView contentContainerStyle={styles.container} contentInsetAdjustmentBehavior="automatic">
			<Card header={title}>
				<>
					{children}

					<View style={styles.iosButtonRow}>
						<Button onPress={onPositive} title="I Agree" />
					</View>
				</>
			</Card>
		</ScrollView>
	)
}

let styles = StyleSheet.create({
	container: {
		marginVertical: 10,
	},
	paragraph: {
		marginVertical: 3,
		paddingRight: 4,
		fontSize: 17,
		color: c.label,
	},
	cardText: {
		color: c.secondaryLabel,
	},
	bonappNotice: {
		fontWeight: '600',
		color: c.label,
		textAlign: 'center',
	},
	iosButtonRow: {
		flexDirection: 'row',
		justifyContent: 'space-around',
	},
})
