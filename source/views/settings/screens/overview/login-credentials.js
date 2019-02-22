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
	logInViaCredentials: (string, string) => any,
	logOutViaCredentials: () => any,
}

type Props = ReduxStateProps & ReduxDispatchProps

type State = {
	username: string,
	password: string,
}

class CredentialsLoginSection extends React.Component<Props, State> {
	_usernameInput: any
	_passwordInput: any

	state = {
		username: '',
		password: '',
	}

	componentDidMount() {
		this.loadCredentialsFromKeychain()
	}

	focusUsername = () => this._usernameInput.focus()
	focusPassword = () => this._passwordInput.focus()

	loadCredentialsFromKeychain = async () => {
		let {username = '', password = ''} = await loadLoginCredentials()
		this.setState(() => ({username, password}))

		if (username && password) {
			this.props.logInViaCredentials(username, password)
		}
	}

	logIn = () =>
		this.props.logInViaCredentials(this.state.username, this.state.password)

	logOut = () => {
		this.setState(() => ({username: '', password: ''}))
		this.props.logOutViaCredentials()
	}

	getUsernameRef = ref => (this._usernameInput = ref)
	getPasswordRef = ref => (this._passwordInput = ref)

	render() {
		const {status} = this.props
		const {username, password} = this.state

		const loggedIn = status === 'logged-in'
		const loading = status === 'checking'

		return (
			<Section
				footer='St. Olaf login enables the "meals remaining" feature.'
				header="ST. OLAF LOGIN"
			>
				{loggedIn ? (
					<Cell title={`Logged in as ${username}.`} />
				) : (
					[
						<CellTextField
							key={0}
							_ref={this.getUsernameRef}
							disabled={loading}
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
							_ref={this.getPasswordRef}
							disabled={loading}
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
					disabled={loading || (!username || !password)}
					label="St. Olaf"
					loading={loading}
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
