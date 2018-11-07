// @flow

import * as React from 'react'
import {Cell, Section, CellTextField} from '@frogpond/tableview'
import {LoginButton} from './login-button'
import {
	logInViaCredentials,
	logOutViaCredentials,
	type LoginStateType,
} from '../../../../redux/parts/settings'
import {loadLoginCredentials} from '../../../../lib/login'
import {type ReduxState} from '../../../../redux'
import {connect} from 'react-redux'
import noop from 'lodash/noop'

type ReduxStateProps = {
	loginState: LoginStateType,
}

type ReduxDispatchProps = {
	logIn: (string, string) => any,
	logOut: () => any,
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
	}

	logIn = () => this.props.logIn(this.state.username, this.state.password)

	logOut = () => {
		this.setState(() => ({username: '', password: ''}))
		this.props.logOut()
	}

	getUsernameRef = ref => (this._usernameInput = ref)
	getPasswordRef = ref => (this._passwordInput = ref)

	onChangeUsername = (text = '') => this.setState(() => ({username: text}))
	onChangePassword = (text = '') => this.setState(() => ({password: text}))

	render() {
		const {loginState} = this.props
		const {username, password} = this.state

		const loggedIn = loginState === 'logged-in'
		const loading = loginState === 'checking' || loginState === 'initializing'

		return (
			<Section
				footer="St. Olaf login enables the &quot;meals remaining&quot; feature."
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
							onChangeText={this.onChangeUsername}
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
							onChangeText={this.onChangePassword}
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
	if (!state.settings) {
		return {loginState: 'initializing'}
	}

	return {loginState: state.settings.loginState}
}

function mapDispatchToProps(dispatch): ReduxDispatchProps {
	return {
		logOut: () => dispatch(logOutViaCredentials()),
		logIn: (user, pass) => dispatch(logInViaCredentials(user, pass)),
	}
}

export const ConnectedCredentialsLoginSection = connect(
	mapStateToProps,
	mapDispatchToProps,
)(CredentialsLoginSection)
