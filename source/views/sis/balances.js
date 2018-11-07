// @flow

import * as React from 'react'
import {
	StyleSheet,
	ScrollView,
	View,
	Text,
	RefreshControl,
	Alert,
} from 'react-native'
import {TabBarIcon} from '@frogpond/navigation-tabs'
import {connect} from 'react-redux'
import {Cell, TableView, Section} from '@frogpond/tableview'
import {
	hasSeenAcknowledgement,
	type LoginStateType,
} from '../../redux/parts/settings'
import {getBalances} from '../../lib/financials'
import {type ReduxState} from '../../redux'
import delay from 'delay'
import * as c from '@frogpond/colors'
import type {TopLevelViewPropsType} from '../types'

const DISCLAIMER = 'This data may be outdated or otherwise inaccurate.'
const LONG_DISCLAIMER =
	'This data may be inaccurate.\nBon Appétit is always right.\nThis app is unofficial.'

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	loginState: LoginStateType,
	alertSeen: boolean,
}

type ReduxDispatchProps = {
	hasSeenAcknowledgement: () => any,
}

type Props = ReactProps & ReduxStateProps & ReduxDispatchProps

type State = {
	loading: boolean,
	flex: ?string,
	ole: ?string,
	print: ?string,
	weeklyMeals: ?string,
	dailyMeals: ?string,
	mealPlan: ?string,
	message: ?string,
}

class BalancesView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		tabBarLabel: 'Balances',
		tabBarIcon: TabBarIcon('card'),
	}

	state = {
		loading: false,
		flex: null,
		ole: null,
		print: null,
		weeklyMeals: null,
		dailyMeals: null,
		mealPlan: null,
		message: null,
	}

	componentDidMount() {
		// calling "refresh" here, to make clear to the user
		// that the data is being updated
		this.refresh()

		if (!this.props.alertSeen) {
			Alert.alert('', LONG_DISCLAIMER, [
				{text: 'I Disagree', onPress: this.goBack, style: 'cancel'},
				{text: 'Okay', onPress: this.props.hasSeenAcknowledgement},
			])
		}
	}

	refresh = async () => {
		let start = Date.now()
		this.setState(() => ({loading: true}))

		await this.fetchData()

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		let elapsed = Date.now() - start
		await delay(500 - elapsed)

		this.setState(() => ({loading: false}))
	}

	fetchData = async () => {
		let balances = await getBalances()

		if (balances.error === true) {
			return
		}

		let {value} = balances

		let {flex, ole, print} = value
		let {weekly: weeklyMeals, daily: dailyMeals, plan: mealPlan} = value

		this.setState(() => ({
			flex,
			ole,
			print,
			weeklyMeals,
			dailyMeals,
			mealPlan,
		}))
	}

	openSettings = () => this.props.navigation.navigate('SettingsView')

	goBack = () => this.props.navigation.goBack(null)

	render() {
		let {
			flex,
			ole,
			print,
			dailyMeals,
			weeklyMeals,
			mealPlan,
			message,
			loading,
		} = this.state
		let {loginState} = this.props

		return (
			<ScrollView
				contentContainerStyle={styles.stage}
				refreshControl={
					<RefreshControl
						onRefresh={this.refresh}
						refreshing={this.state.loading}
					/>
				}
			>
				<TableView>
					<Section footer={DISCLAIMER} header="BALANCES">
						<View style={styles.balancesRow}>
							<FormattedValueCell
								formatter={getValueOrNa}
								indeterminate={loading}
								label="Flex"
								value={flex}
							/>

							<FormattedValueCell
								formatter={getValueOrNa}
								indeterminate={loading}
								label="Ole"
								value={ole}
							/>

							<FormattedValueCell
								formatter={getValueOrNa}
								indeterminate={loading}
								label="Copy/Print"
								style={styles.finalCell}
								value={print}
							/>
						</View>
					</Section>

					<Section footer={DISCLAIMER} header="MEAL PLAN">
						<View style={styles.balancesRow}>
							<FormattedValueCell
								formatter={getValueOrNa}
								indeterminate={loading}
								label="Daily Meals Left"
								value={dailyMeals}
							/>

							<FormattedValueCell
								formatter={getValueOrNa}
								indeterminate={loading}
								label="Weekly Meals Left"
								style={styles.finalCell}
								value={weeklyMeals}
							/>
						</View>
						{mealPlan && (
							<Cell cellStyle="Subtitle" detail={mealPlan} title="Meal Plan" />
						)}
					</Section>
				</TableView>

				{(loginState !== 'logged-in' || message) && (
					<Section footer="You'll need to log in in order to see this data.">
						{loginState !== 'logged-in' ? (
							<Cell
								accessory="DisclosureIndicator"
								cellStyle="Basic"
								onPress={this.openSettings}
								title="Log in with St. Olaf"
							/>
						) : null}

						{message ? (
							<Cell cellStyle="Basic" title={message} />
						) : null}
					</Section>
				)}
			</ScrollView>
		)
	}
}

function mapState(state: ReduxState): ReduxStateProps {
	return {
		alertSeen: state.settings ? state.settings.unofficiallyAcknowledged : false,
		loginState: state.settings ? state.settings.loginState : 'logged-out',
	}
}

function mapDispatch(dispatch): ReduxDispatchProps {
	return {
		hasSeenAcknowledgement: () => dispatch(hasSeenAcknowledgement()),
	}
}

export default connect(
	mapState,
	mapDispatch,
)(BalancesView)

let cellMargin = 10
let cellSidePadding = 10
let cellEdgePadding = 10

let styles = StyleSheet.create({
	stage: {
		backgroundColor: c.iosLightBackground,
		paddingTop: 20,
		paddingBottom: 20,
	},

	common: {
		backgroundColor: c.white,
	},

	balances: {
		borderRightWidth: StyleSheet.hairlineWidth,
		borderRightColor: c.iosSeparator,
	},

	finalCell: {
		borderRightWidth: 0,
	},

	balancesRow: {
		flexDirection: 'row',
		marginTop: 0,
		marginBottom: -10,
	},

	rectangle: {
		height: 88,
		flex: 1,
		alignItems: 'center',
		paddingTop: cellSidePadding,
		paddingBottom: cellSidePadding,
		paddingRight: cellEdgePadding,
		paddingLeft: cellEdgePadding,
		marginBottom: cellMargin,
	},

	// Text styling
	financialText: {
		paddingTop: 8,
		color: c.iosDisabledText,
		textAlign: 'center',
		fontWeight: '200',
		fontSize: 23,
	},
	rectangleButtonText: {
		paddingTop: 15,
		color: c.black,
		textAlign: 'center',
		fontSize: 16,
	},
})

function getValueOrNa(value: ?string): string {
	if (value == null) {
		return 'N/A'
	}
	return value
}

function FormattedValueCell(props: {
	indeterminate: boolean,
	label: string,
	value: ?string,
	style?: any,
	formatter: (?string) => string,
}) {
	let {indeterminate, label, value, style, formatter} = props

	return (
		<View style={[styles.rectangle, styles.common, styles.balances, style]}>
			<Text
				autoAdjustsFontSize={true}
				selectable={true}
				style={styles.financialText}
			>
				{indeterminate ? '…' : formatter(value)}
			</Text>
			<Text autoAdjustsFontSize={true} style={styles.rectangleButtonText}>
				{label}
			</Text>
		</View>
	)
}
