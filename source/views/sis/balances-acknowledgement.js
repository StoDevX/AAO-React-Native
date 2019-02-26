// @flow

import * as React from 'react'
import {StyleSheet, ScrollView, Platform, Alert, View} from 'react-native'
import {TabBarIcon} from '@frogpond/navigation-tabs'
import {connect} from 'react-redux'
import {hasSeenAcknowledgement} from '../../redux/parts/settings'
import {type ReduxState} from '../../redux'
import type {TopLevelViewPropsType} from '../types'
import {Avatar, Button, Card, Paragraph as AndroidP} from 'react-native-paper'
import {Paragraph as IosP} from '@frogpond/markdown'
import {Card as IosCard} from '@frogpond/silly-card'
import {Button as IosButton} from '@frogpond/button'
import BalancesView from './balances'

type ReduxStateProps = {
	alertSeen: boolean,
}

type Props = {
	...TopLevelViewPropsType,
	...ReduxStateProps,
	// from redux mapDispatch
	hasSeenAcknowledgement: () => any,
}

let Acknowledgement = Platform.OS === 'android' ? AndroidAck : IosAck
let Paragraph = Platform.OS === 'android' ? AndroidP : IosP

function BalancesOrAcknowledgementView(props: Props) {
	if (props.alertSeen) {
		return <BalancesView navigation={props.navigation} />
	}

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Acknowledgement
				onNegative={() => Alert.alert('You said "No"')}
				onPositive={props.hasSeenAcknowledgement}
				subtitle="Bon Appétit is always right"
				title="Before you continue…"
			>
				<Paragraph>
					While we strive to keep this app and the data therein up-to-date,
					there will always be issues, especially seeing as we are not part of
					the college. (Students and alumni of, yes, but officially sponsored
					by, no.)
				</Paragraph>
				<Paragraph>
					As such, we require that you agree to the following statement before
					you can see your balances within the app:
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
			</Acknowledgement>
		</ScrollView>
	)
}

BalancesOrAcknowledgementView.navigationOptions = {
	tabBarLabel: 'Balances',
	tabBarIcon: TabBarIcon('card'),
}

function mapState(state: ReduxState): ReduxStateProps {
	return {
		alertSeen: state.settings ? state.settings.unofficiallyAcknowledged : false,
	}
}

export default connect(
	mapState,
	{hasSeenAcknowledgement},
)(BalancesOrAcknowledgementView)

type AcknowledgementProps = {
	title: string,
	subtitle: string,
	children: React.Node,
	onPositive: () => any,
	onNegative: () => any,
}

function AndroidAck(props: AcknowledgementProps) {
	let {title, subtitle, children, onPositive, onNegative} = props

	return (
		<Card style={styles.androidCard}>
			<Card.Title
				left={props => <Avatar.Icon {...props} icon="warning" />}
				subtitle={subtitle}
				title={title}
			/>
			<Card.Content>{children}</Card.Content>
			<Card.Actions>
				<Button onPress={onNegative}>I Disagree</Button>
				<Button onPress={onPositive}>Agreed</Button>
			</Card.Actions>
		</Card>
	)
}

function IosAck(props: AcknowledgementProps) {
	let {title, subtitle, children, onPositive, onNegative} = props

	return (
		<IosCard footer={subtitle} header={title}>
			{children}

			<View style={styles.iosButtonRow}>
				<IosButton mode="inverted" onPress={onNegative} title="I Disagree" />
				<IosButton onPress={onPositive} title="Agreed" />
			</View>
		</IosCard>
	)
}

let styles = StyleSheet.create({
	container: {
		marginVertical: 10,
	},
	androidCard: {
		marginHorizontal: 10,
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
