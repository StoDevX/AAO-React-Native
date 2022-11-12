import * as React from 'react'
import {Cell, Section} from '@frogpond/tableview'
import {CellTextField} from '@frogpond/tableview/cells'
import {LoginButton} from './login-button'
import {
	logInViaCredentials,
	logOutViaCredentials,
} from '../../../../redux/parts/login'
import type {LoginStateEnum} from '../../../../redux/parts/login'
import {loadLoginCredentials} from '../../../../lib/login'
import type {ReduxState} from '../../../../redux'
import {useSelector, useDispatch} from 'react-redux'
import type {TextInput} from 'react-native'

type ReduxStateProps = {
	status: LoginStateEnum
}

type ReduxDispatchProps = {
	logInViaCredentials: (username: string, password: string) => void
	logOutViaCredentials: () => void
}

type Props = ReduxStateProps & ReduxDispatchProps

type State = {
	username: string
	password: string
	loadingCredentials: boolean
	initialCheckComplete: boolean
}

class CredentialsLoginSection extends React.Component<Props, State> {
	state = {
		username: '',
		password: '',
		loadingCredentials: true,
		initialCheckComplete: false,
	}

	componentDidMount() {
		this.loadCredentialsFromKeychain()
	}

	_usernameInput = React.createRef<TextInput>()
	_passwordInput = React.createRef<TextInput>()

	focusPassword = () => this._passwordInput.current?.focus()

	loadCredentialsFromKeychain = async () => {
		let {username = '', password = ''} = await loadLoginCredentials()
		this.setState(() => ({username, password, loadingCredentials: false}))

		if (username && password) {
			await this.props.logInViaCredentials(username, password)
		}

		this.setState(() => ({initialCheckComplete: true}))
	}

	logIn = () => {
		this.props.logInViaCredentials(this.state.username, this.state.password)
	}

	logOut = () => {
		this.setState(() => ({username: '', password: ''}))
		this.props.logOutViaCredentials()
	}

	render(): JSX.Element {
		let {status} = this.props
		let {username, password, loadingCredentials, initialCheckComplete} =
			this.state

		let loggedIn = status === 'logged-in'
		let checkingCredentials = status === 'checking'
		let hasBothCredentials = username && password

		// this becomes TRUE when (a) creds are loaded from AsyncStorage and
		// (b) the initial check from those credentials has completed
		let checkingState = loadingCredentials || !initialCheckComplete

		return (
			<Section
				footer='St. Olaf login enables the "meals remaining" feature.'
				header="ST. OLAF LOGIN"
			>
				{checkingState ? (
					<Cell title="Loading…" />
				) : loggedIn ? (
					<Cell title={`Logged in as ${username}.`} />
				) : (
					[
						<CellTextField
							key={0}
							_ref={this._usernameInput}
							disabled={checkingCredentials}
							label="Username"
							onChangeText={(text) => this.setState(() => ({username: text}))}
							onSubmitEditing={this.focusPassword}
							placeholder="username"
							returnKeyType="next"
							secureTextEntry={false}
							value={username}
						/>,
						<CellTextField
							key={1}
							_ref={this._passwordInput}
							disabled={checkingCredentials}
							label="Password"
							onChangeText={(text) => this.setState(() => ({password: text}))}
							onSubmitEditing={this.logIn}
							placeholder="password"
							returnKeyType="done"
							secureTextEntry={true}
							value={password}
						/>,
					]
				)}

				<LoginButton
					disabled={!hasBothCredentials || checkingCredentials || checkingState}
					label="St. Olaf"
					loading={checkingCredentials || checkingState}
					loggedIn={loggedIn}
					onPress={loggedIn ? this.logOut : this.logIn}
				/>
			</Section>
		)
	}
}

export function ConnectedCredentialsLoginSection(): JSX.Element {
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

	let logOut = React.useCallback(() => {
		dispatch(logOutViaCredentials())
	}, [dispatch])

	return (
		<CredentialsLoginSection
			logInViaCredentials={logIn}
			logOutViaCredentials={logOut}
			status={status}
		/>
	)
}
