import * as Sentry from '@sentry/react-native'
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
import {sto} from '../../lib/colors'
import {useNavigation} from '@react-navigation/native'

const DISCLAIMER = 'This data may be outdated or otherwise inaccurate.'

type ReduxStateProps = {
	status: LoginStateEnum
}

type ReduxDispatchProps = {
	logInViaCredentials: (username: string, password: string) => void
}

type Props = ReduxStateProps & ReduxDispatchProps

const BalancesView = (props: Props) => {
	let [loading, setLoading] = React.useState(false)
	let [flex, setFlex] = React.useState<string | null>(null)
	let [ole, setOle] = React.useState<string | null>(null)
	let [print, setPrint] = React.useState<string | null>(null)
	let [weeklyMeals, setWeeklyMeals] = React.useState<string | null>(null)
	let [dailyMeals, setDailyMeals] = React.useState<string | null>(null)
	let [mealPlan, setMealPlan] = React.useState<string | null>(null)
	let [message, setMessage] = React.useState<string | null>(null)

	let navigation = useNavigation()

	let logIn = React.useCallback(async () => {
		let {status} = props
		if (status === 'logged-in' || status === 'checking') {
			return
		}

		let {username = '', password = ''} = await loadLoginCredentials()
		if (username && password) {
			await props.logInViaCredentials(username, password)
		}
	}, [props])

	let fetchData = React.useCallback(async () => {
		try {
			// trigger the login so that the banner at the bottom hides itself
			await logIn()

			let balances = await getBalances()

			if (balances.error) {
				return
			}

			let {value} = balances

			let {flex, ole, print} = value
			let {weekly: weeklyMeals, daily: dailyMeals, plan: mealPlan} = value

			setMessage('')
			setFlex(flex)
			setOle(ole)
			setPrint(print)
			setWeeklyMeals(weeklyMeals)
			setDailyMeals(dailyMeals)
			setMealPlan(mealPlan)
		} catch (error) {
			setMessage('An unexpected error occured while updating.')
			console.error(error)
			Sentry.captureException(error)
		}
	}, [logIn])

	let refresh = React.useCallback(async () => {
		let start = Date.now()
		setLoading(true)

		await fetchData()

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		let elapsed = Date.now() - start
		await delay(500 - elapsed)

		setLoading(false)
	}, [fetchData])

	React.useEffect(() => {
		// calling "refresh" here, to make clear to the user
		// that the data is being updated
		refresh()
	}, [refresh])

	let openSettings = () => navigation.navigate('Settings')

	let {status} = props

	return (
		<ScrollView
			contentContainerStyle={styles.stage}
			refreshControl={
				<RefreshControl onRefresh={refresh} refreshing={loading} />
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
					{Boolean(mealPlan) && mealPlan !== null && (
						<Cell cellStyle="Subtitle" detail={mealPlan} title="Meal Plan" />
					)}
				</Section>

				{(status !== 'logged-in' || Boolean(message)) && (
					<Section footer="You'll need to log in in order to see this data.">
						{status !== 'logged-in' ? (
							<Cell
								accessory="DisclosureIndicator"
								cellStyle="Basic"
								onPress={openSettings}
								title="Log in with St. Olaf"
							/>
						) : null}

						{message ? (
							<Cell
								cellStyle="Basic"
								title={message}
								titleTextColor={sto.red}
							/>
						) : null}
					</Section>
				)}
			</TableView>
		</ScrollView>
	)
}

export function ConnectedBalancesView(): JSX.Element {
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

	return <BalancesView logInViaCredentials={logIn} status={status} />
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
