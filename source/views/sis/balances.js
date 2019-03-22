// @flow

import * as React from 'react'
import {StyleSheet, ScrollView, View, Text, RefreshControl} from 'react-native'
import {connect} from 'react-redux'
import {Cell, TableView, Section} from '@frogpond/tableview'
import {logInViaCredentials} from '../../redux/parts/login'
import {type LoginStateEnum} from '../../redux/parts/login'
import {getBalances} from '../../lib/financials'
import {loadLoginCredentials} from '../../lib/login'
import {type ReduxState} from '../../redux'
import delay from 'delay'
import * as c from '@frogpond/colors'
import type {TopLevelViewPropsType} from '../types'
import {DataTable, Surface} from 'react-native-paper'

const DISCLAIMER = 'This data may be outdated or otherwise inaccurate.'

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	status: LoginStateEnum,
}

type ReduxDispatchProps = {
	logInViaCredentials: (string, string) => Promise<any>,
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

class BalancesView extends React.Component<Props, State> {
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

	logIn = async () => {
		let {status} = this.props
		if (status === 'logged-in' || status === 'checking') {
			return
		}

		let {username = '', password = ''} = await loadLoginCredentials()
		if (username && password) {
			await this.props.logInViaCredentials(username, password)
		}
	}

	fetchData = async () => {
		// trigger the login so that the banner at the bottom hides itself
		await this.logIn()

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
		let {status} = this.props

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
				<Surface style={styles.table}>
					<DataTable>
						<DataTable.Header>
							<DataTable.Title>OleCard Balances</DataTable.Title>
							<DataTable.Title numeric={true}>Balance</DataTable.Title>
						</DataTable.Header>

						<MaterialRow
							indeterminate={loading}
							label="Ole Dollars"
							value={ole}
						/>

						<MaterialRow
							indeterminate={loading}
							label="Flex Dollars"
							value={flex}
						/>

						<MaterialRow
							indeterminate={loading}
							label="Copy/Print"
							value={print}
						/>
					</DataTable>
				</Surface>

				<Surface style={styles.table}>
					<DataTable>
						<DataTable.Header>
							<DataTable.Title>Meal Plan Information</DataTable.Title>
							<DataTable.Title numeric={true}>Balance</DataTable.Title>
						</DataTable.Header>

						<MaterialRow
							indeterminate={loading}
							label="Meals Left Today"
							value={dailyMeals}
						/>
						<MaterialRow
							indeterminate={loading}
							label="Meals Left (Weekly)"
							value={weeklyMeals}
						/>

						{mealPlan != null && (
							<MaterialRow
								indeterminate={loading}
								label="Meal Plan"
								value={mealPlan}
							/>
						)}
					</DataTable>
				</Surface>

				{(status !== 'logged-in' || message) && (
					<Section footer="You'll need to log in in order to see this data.">
						{status !== 'logged-in' ? (
							<Cell
								accessory="DisclosureIndicator"
								cellStyle="Basic"
								onPress={this.openSettings}
								title="Log in with St. Olaf"
							/>
						) : null}

						{message ? <Cell cellStyle="Basic" title={message} /> : null}
					</Section>
				)}
			</ScrollView>
		)
	}
}

function mapState(state: ReduxState): ReduxStateProps {
	return {
		status: state.login ? state.login.status : 'initializing',
	}
}

export default connect(
	mapState,
	{logInViaCredentials},
)(BalancesView)

let styles = StyleSheet.create({
	stage: {
		paddingVertical: 20,
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

	table: {borderRadius: 2, margin: 20, marginTop: 0, elevation: 2},

	rectangle: {
		height: 88,
		flex: 1,
		alignItems: 'center',
		paddingVertical: 10,
		paddingHorizontal: 10,
		marginBottom: 10,
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

function MaterialRow(props: {
	label: string,
	value: ?string,
	indeterminate: boolean,
}) {
	return (
		<DataTable.Row>
			<DataTable.Cell>{props.label}</DataTable.Cell>
			<DataTable.Cell numeric={true}>
				<Text style={{fontWeight: '500'}}>{getValueOrNa(props.value)}</Text>
			</DataTable.Cell>
		</DataTable.Row>
	)
}

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
}) {
	let {indeterminate, label, value, style} = props

	return (
		<View style={[styles.rectangle, styles.common, styles.balances, style]}>
			<Text selectable={true} style={styles.financialText}>
				{indeterminate ? '…' : getValueOrNa(value)}
			</Text>
			<Text style={styles.rectangleButtonText}>{label}</Text>
		</View>
	)
}
