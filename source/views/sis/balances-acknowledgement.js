// @flow

import * as React from 'react'
import {StyleSheet, ScrollView, View, Text} from 'react-native'
import {TabBarIcon} from '@frogpond/navigation-tabs'
import {connect} from 'react-redux'
import {hasSeenAcknowledgement} from '../../redux/parts/settings'
import {type ReduxState} from '../../redux'
import type {TopLevelViewPropsType} from '../types'
import BalancesView from './balances'

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	alertSeen: boolean,
}

type ReduxDispatchProps = {
	hasSeenAcknowledgement: () => any,
}

type Props = ReactProps & ReduxStateProps & ReduxDispatchProps

BalancesOrAcknowledgementView.navigationOptions = {
	tabBarLabel: 'Balances',
	tabBarIcon: TabBarIcon('card'),
}

function BalancesOrAcknowledgementView(props: Props) {
	if (props.alertSeen) {
		return <BalancesView navigation={props.navigation} />
	}

	return (
		<ScrollView>
			<Text>This data may be inaccurate.</Text>
			<Text>Bon Appétit is always right.</Text>
			<Text>This app is unofficial.</Text>
		</ScrollView>
	)
}

function mapState(state: ReduxState): ReduxStateProps {
	return {
		alertSeen: state.settings ? state.settings.unofficiallyAcknowledged : false,
	}
}

export default connect(
	mapState,
	{hasSeenAcknowledgement},
)(BalancesView)
