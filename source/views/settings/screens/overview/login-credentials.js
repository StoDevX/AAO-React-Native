// @flow

import * as React from 'react'
import {Cell, Section, CellTextField} from '@frogpond/tableview'
import {LoginButton} from './login-button'
import {
	logInViaCredentials,
	logOutViaCredentials,
	type LoginStateEnum,
} from '../../../../redux/parts/login'
import {loadLoginCredentials} from '../../../../lib/login'
import {type ReduxState} from '../../../../redux'
import {connect} from 'react-redux'
import noop from 'lodash/noop'

type ReduxStateProps = {
	status: LoginStateEnum,
}

type ReduxDispatchProps = {
	logInViaCredentials: (string, string) => Promise<any>,
	logOutViaCredentials: () => any,
}

type Props = ReduxStateProps & ReduxDispatchProps

type State = {
	username: string,
	password: string,
	loadingCredentials: boolean,
	initialCheckComplete: boolean,
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

	_usernameInput = React.createRef()
	_passwordInput = React.createRef()

	focusPassword = () =>
		this._passwordInput.current && this._passwordInput.current.focus()

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

	render() {
		const {status} = this.props
		const {
			username,
			password,
			loadingCredentials,
			initialCheckComplete,
		} = this.state

		const loggedIn = status === 'logged-in'
		const checkingCredentials = status === 'checking'
		const hasBothCredentials = username && password

		// this becomes TRUE when (a) creds are loaded from AsyncStorage and
		// (b) the initial check from those credentials has completed
		const checkingState = loadingCredentials || !initialCheckComplete

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
							onChangeText={text => this.setState(() => ({username: text}))}
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
							onChangeText={text => this.setState(() => ({password: text}))}
							onSubmitEditing={loggedIn ? noop : this.logIn}
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

function mapStateToProps(state: ReduxState): ReduxStateProps {
	if (!state.login) {
		return {status: 'initializing'}
	}

	return {status: state.login.status}
}

export const ConnectedCredentialsLoginSection = connect(
	mapStateToProps,
	{logOutViaCredentials, logInViaCredentials},
)(CredentialsLoginSection)
