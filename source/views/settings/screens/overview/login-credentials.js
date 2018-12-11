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
	loginState: LoginStateEnum,
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

		if (username && password) {
			this.props.logIn(username, password)
		}
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
		const loading = loginState === 'checking'

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
							onChangeText={this.onChangeUsername}
							onSubmitEditing={this.focusPassword}
							placeholder="ole"
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
							placeholder="the$lion"
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
		return {loginState: 'initializing'}
	}

	return {loginState: state.login.loginState}
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
