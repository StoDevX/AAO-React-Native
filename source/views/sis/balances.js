// @flow

import * as React from 'react'
import {
	StyleSheet,
	ScrollView,
	View,
	Text,
	RefreshControl,
	Alert,
	Button,
} from 'react-native'
import {TabBarIcon} from '../components/tabbar-icon'
import {connect} from 'react-redux'
import {Cell, TableView, Section} from 'react-native-tableview-simple'
import {
	hasSeenAcknowledgement,
	setTouchIDStatus,
	type LoginStateType,
	hasSeenTouchIDAlert,
} from '../../flux/parts/settings'
import {updateBalances} from '../../flux/parts/sis'
import {type ReduxState} from '../../flux'
import delay from 'delay'
import * as c from '../components/colors'
import type {TopLevelViewPropsType} from '../types'
import TouchID from 'react-native-touch-id'
import {ButtonCell} from '../components/cells/button'
import Modal from 'react-native-modal'
import {CellTextField} from '../components/cells/textfield'

const DISCLAIMER = 'This data may be outdated or otherwise inaccurate.'
const LONG_DISCLAIMER =
	'This data may be inaccurate.\nBon Appétit is always right.\nThis app is unofficial.'

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
	flex: ?string,
	ole: ?string,
	print: ?string,
	weeklyMeals: ?string,
	dailyMeals: ?string,
	mealPlan: ?string,
	loginState: LoginStateType,
	username: ?string,
	password: ?string,
	message: ?string,
	alertSeen: boolean,
	touchIDEnabled: boolean,
	touchIDAlertSeen: boolean,
}

type ReduxDispatchProps = {
	hasSeenAcknowledgement: () => any,
	updateBalances: boolean => any,
	setTouchIDEnabled: boolean => any,
	hasSeenTouchIDAlert: () => any,
}

type Props = ReactProps & ReduxStateProps & ReduxDispatchProps

type State = {
	loading: boolean,
	bioAuthenticated: boolean,
	bioAuthenticating: boolean,
	enterPasswordPrompt: boolean,
	password: string,
	error: boolean,
}

class BalancesView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		tabBarLabel: 'Balances',
		tabBarIcon: TabBarIcon('card'),
	}

	_passwordInput: any

	state = {
		loading: false,
		bioAuthenticated: false,
		bioAuthenticating: false,
		enterPasswordPrompt: false,
		password: '',
		error: false,
	}

	componentWillMount() {
		// calling "refresh" here, to make clear to the user
		// that the data is being updated
	}

	componentDidMount() {
		if (!this.props.alertSeen) {
			Alert.alert('', LONG_DISCLAIMER, [
				{text: 'I Disagree', onPress: this.goBack, style: 'cancel'},
				{text: 'Okay', onPress: this.props.hasSeenAcknowledgement},
			])
		}

		if (!this.props.touchIDAlertSeen) {
			TouchID.isSupported()
				.then(() => {
					// Success code
					Alert.alert(
						'Enable TouchID/FaceID',
						'Would you like to enable TouchID/FaceID to protect your balances information?',
						[
							{
								text: 'No',
								onPress: () => {
									this.props.setTouchIDEnabled(false)
								},
								style: 'cancel',
							},
							{
								text: 'Yes',
								onPress: () => {
									this.props.setTouchIDEnabled(true)
									this.touchIDAuthentication()
								},
							},
						],
					)
					this.props.hasSeenTouchIDAlert()
				})
				.catch(() => {
					// Failure code
					this.props.setTouchIDEnabled(false)
				})
		}

		if (this.props.loginState === 'logged-in' && this.props.touchIDEnabled) {
			this.touchIDAuthentication()
		}
	}

	touchIDAuthentication = () => {
		this.setState(() => ({bioAuthenticating: true}))
		TouchID.authenticate('to view balances information')
			.then(() => {
				this.setState(() => ({bioAuthenticated: true}))
				this.setState(() => ({bioAuthenticating: false}))
				this.refresh()
			})
			.catch(error => {
				this.setState(() => ({bioAuthenticating: false}))
				if (error.name === 'LAErrorUserFallback') {
					this.setState(() => ({enterPasswordPrompt: true}))
				} else if (error.name === 'RCTTouchIDNotSupported') {
					this.setState(() => ({bioAuthenticated: true}))
					this.refresh()
				}
			})
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
		await this.props.updateBalances(true)
	}

	openSettings = () => {
		this.props.navigation.navigate('SettingsView')
	}

	goBack = () => {
		this.props.navigation.goBack(null)
	}

	getPasswordRef = ref => (this._passwordInput = ref)
	focusPassword = () => this._passwordInput.focus()
	onChangePassword = (text = '') => this.setState(() => ({password: text}))

	unlockBalances = () => {
		if (this.state.password === this.props.password) {
			this.dismissModal()
			this.setState(() => ({bioAuthenticated: true}))
			this.refresh()
		} else {
			this.setState(() => ({error: true}))
		}
	}

	dismissModal = () => {
		this.setState(() => ({enterPasswordPrompt: false}))
	}

	render() {
		let {
			flex,
			ole,
			print,
			dailyMeals,
			weeklyMeals,
			mealPlan,
			touchIDEnabled,
		} = this.props
		let {
			loading,
			bioAuthenticated,
			bioAuthenticating,
			password,
			error,
		} = this.state

		return (
			<View>
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
									value={bioAuthenticated || !touchIDEnabled ? flex : 'N/A'}
								/>

								<FormattedValueCell
									formatter={getValueOrNa}
									indeterminate={loading}
									label="Ole"
									value={bioAuthenticated || !touchIDEnabled ? ole : 'N/A'}
								/>

								<FormattedValueCell
									formatter={getValueOrNa}
									indeterminate={loading}
									label="Copy/Print"
									style={styles.finalCell}
									value={bioAuthenticated || !touchIDEnabled ? print : 'N/A'}
								/>
							</View>
						</Section>

						<Section footer={DISCLAIMER} header="MEAL PLAN">
							<View style={styles.balancesRow}>
								<FormattedValueCell
									formatter={getValueOrNa}
									indeterminate={loading}
									label="Daily Meals Left"
									value={
										bioAuthenticated || !touchIDEnabled ? dailyMeals : 'N/A'
									}
								/>

								<FormattedValueCell
									formatter={getValueOrNa}
									indeterminate={loading}
									label="Weekly Meals Left"
									style={styles.finalCell}
									value={
										bioAuthenticated || !touchIDEnabled ? weeklyMeals : 'N/A'
									}
								/>
							</View>
							{mealPlan && (bioAuthenticated || !touchIDEnabled) ? (
								<Cell
									cellStyle="Subtitle"
									detail={mealPlan}
									title="Meal Plan"
								/>
							) : null}
						</Section>

						{!bioAuthenticated &&
						touchIDEnabled &&
						this.props.loginState === 'logged-in' ? (
							<Section>
								<ButtonCell
									disabled={false}
									indeterminate={bioAuthenticating}
									onPress={this.touchIDAuthentication}
									title={
										bioAuthenticating
											? 'Authenticating...'
											: 'Unlock Balances Data'
									}
								/>
							</Section>
						) : null}

						{this.props.loginState !== 'logged-in' || this.props.message ? (
							<Section footer="You'll need to log in again so we can update these numbers.">
								{this.props.loginState !== 'logged-in' ? (
									<Cell
										accessory="DisclosureIndicator"
										cellStyle="Basic"
										onPress={this.openSettings}
										title="Log in with St. Olaf"
									/>
								) : null}

								{this.props.message ? (
									<Cell cellStyle="Basic" title={this.props.message} />
								) : null}
							</Section>
						) : null}
					</TableView>
				</ScrollView>
				<Modal
					animationIn="zoomIn"
					animationOut="zoomOut"
					backdropColor={c.black}
					backdropOpacity={0.3}
					isVisible={this.state.enterPasswordPrompt}
					onRequestClose={() => this.setState({enterPasswordPrompt: false})}
					transparent={true}
				>
					<View style={styles.modalContainer}>
						<Text style={styles.modalHeader}>Unlock Balances Information</Text>
						<CellTextField
							_ref={this.getPasswordRef}
							label="Password"
							onChangeText={this.onChangePassword}
							onSubmitEditing={this.unlockBalances}
							placeholder="password"
							returnKeyType="done"
							secureTextEntry={true}
							style={styles.passwordInput}
							value={password}
						/>
						{error && (
							<Text style={styles.errorMessage}>
								Incorrect Password. Try Again.
							</Text>
						)}
						<View style={styles.modalButtons}>
							<Button
								color={c.red}
								onPress={this.dismissModal}
								style={styles.modalButton}
								title="Cancel"
							/>
							<Button
								color={c.infoBlue}
								onPress={this.unlockBalances}
								style={styles.modalButton}
								title="Unlock"
							/>
						</View>
					</View>
				</Modal>
			</View>
		)
	}
}

function mapState(state: ReduxState): ReduxStateProps {
	return {
		flex: state.sis ? state.sis.flexBalance : null,
		ole: state.sis ? state.sis.oleBalance : null,
		print: state.sis ? state.sis.printBalance : null,
		weeklyMeals: state.sis ? state.sis.mealsRemainingThisWeek : null,
		dailyMeals: state.sis ? state.sis.mealsRemainingToday : null,
		mealPlan: state.sis ? state.sis.mealPlanDescription : null,
		message: state.sis ? state.sis.balancesErrorMessage : null,
		alertSeen: state.settings ? state.settings.unofficiallyAcknowledged : false,
		touchIDEnabled: state.settings ? state.settings.touchIDEnabled : false,
		touchIDAlertSeen: state.settings ? state.settings.touchIDAlertSeen : false,
		loginState: state.settings ? state.settings.loginState : 'logged-out',
		username: state.settings ? state.settings.username : null,
		password: state.settings ? state.settings.password : null,
	}
}

function mapDispatch(dispatch): ReduxDispatchProps {
	return {
		updateBalances: force => dispatch(updateBalances(force)),
		hasSeenAcknowledgement: () => dispatch(hasSeenAcknowledgement()),
		setTouchIDEnabled: status => dispatch(setTouchIDStatus(status)),
		hasSeenTouchIDAlert: () => dispatch(hasSeenTouchIDAlert()),
	}
}

export default connect(mapState, mapDispatch)(BalancesView)

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
	modalContainer: {
		backgroundColor: c.white,
		paddingTop: 22,
		paddingBottom: 22,
		borderRadius: 10,
		borderColor: c.semitransparentGray,
		paddingLeft: 5,
		paddingRight: 5,
	},
	modalButtons: {
		justifyContent: 'space-between',
		flexDirection: 'row',
		paddingLeft: 10,
		paddingRight: 10,
		paddingTop: 10,
	},
	modalHeader: {
		alignSelf: 'center',
		fontSize: 20,
		marginBottom: 10,
	},
	errorMessage: {
		color: c.red,
		paddingLeft: 15,
	},
	passwordInput: {
		paddingLeft: 0,
	},
	modalButton: {
		margin: 10,
	},
})

function getValueOrNa(value: ?string): string {
	// eslint-disable-next-line no-eq-null
	if (value == null) {
		return 'N/A'
	}
	return value
}

function FormattedValueCell({
	indeterminate,
	label,
	value,
	style,
	formatter,
}: {
	indeterminate: boolean,
	label: string,
	value: ?string,
	style?: any,
	formatter: (?string) => string,
}) {
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
