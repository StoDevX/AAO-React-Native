import * as React from 'react'
import {
	StyleSheet,
	ScrollView,
	View,
	Text,
	RefreshControl,
	StyleProp,
	ViewStyle,
} from 'react-native'
import {useDispatch, useSelector} from 'react-redux'
import {Cell, TableView, Section} from '@frogpond/tableview'
import {logInViaCredentials} from '../../redux/parts/login'
import type {LoginStateEnum} from '../../redux/parts/login'
import {getBalances} from '../../lib/financials'
import {loadLoginCredentials} from '../../lib/login'
import type {ReduxState} from '../../redux'
import delay from 'delay'
import * as c from '@frogpond/colors'
import type {TopLevelViewPropsType} from '../types'

const DISCLAIMER = 'This data may be outdated or otherwise inaccurate.'

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	status: LoginStateEnum
}

type ReduxDispatchProps = {
	logInViaCredentials: (username: string, password: string) => void
}

type Props = ReactProps & ReduxStateProps & ReduxDispatchProps

type State = {
	loading: boolean
	flex: string | null
	ole: string | null
	print: string | null
	weeklyMeals: string | null
	dailyMeals: string | null
	mealPlan: string | null
	message: string | null
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

		if (balances.error) {
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
				<TableView>
					<Section footer={DISCLAIMER} header="BALANCES">
						<View style={styles.balancesRow}>
							<FormattedValueCell
								indeterminate={loading}
								label="Flex"
								value={flex}
							/>

							<FormattedValueCell
								indeterminate={loading}
								label="Ole"
								value={ole}
							/>

							<FormattedValueCell
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
								indeterminate={loading}
								label="Daily Meals Left"
								value={dailyMeals}
							/>

							<FormattedValueCell
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

export function ConnectedBalancesView(props: TopLevelViewPropsType) {
	let dispatch = useDispatch()
	let status = useSelector(
		(state: ReduxState) => state.login?.status || 'initializing',
	)

	let logIn = React.useCallback(
		(u: string, p: string) => {
			dispatch(logInViaCredentials(u, p))
		},
		[dispatch],
	)

	return <BalancesView {...props} logInViaCredentials={logIn} status={status} />
}

let styles = StyleSheet.create({
	stage: {
		backgroundColor: c.sectionBgColor,
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

function getValueOrNa(value: string | null): string {
	if (value == null) {
		return 'N/A'
	}
	return value
}

function FormattedValueCell(props: {
	indeterminate: boolean
	label: string
	value: string | null
	style?: StyleProp<ViewStyle>
	formatter?: (str: string | null) => string
}) {
	let {indeterminate, label, value, style, formatter = getValueOrNa} = props

	return (
		<View style={[styles.rectangle, styles.common, styles.balances, style]}>
			<Text selectable={true} style={styles.financialText}>
				{indeterminate ? '…' : formatter(value)}
			</Text>
			<Text style={styles.rectangleButtonText}>{label}</Text>
		</View>
	)
}
