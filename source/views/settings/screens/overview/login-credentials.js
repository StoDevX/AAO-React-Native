// @flow

import * as React from 'react'
import {Cell, Section, CellTextField} from '@frogpond/tableview'
import {LoginButton} from './login-button'
import {
	loadLoginCredentials,
	performLogin,
	performLogout,
} from '../../../../lib/login'
import noop from 'lodash/noop'

type Props = {}

type State = {
	loginState: 'checking' | 'logged-in' | 'logged-out',
	username: string,
	password: string,
}

export class CredentialsLoginSection extends React.Component<Props, State> {
	_usernameInput: any
	_passwordInput: any

	state = {
		loginState: 'checking',
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
			this.logIn()
		} else {
			this.setState(() => ({loginState: 'logged-out'}))
		}
	}

	logIn = async () => {
		this.setState(() => ({loginState: 'checking'}))
		const result = await performLogin({
			username: this.state.username,
			password: this.state.password,
			attempts: 1,
		})
		this.setState(() => ({
			loginState: result === 'success' ? 'logged-in' : 'logged-out',
		}))
	}

	logOut = async () => {
		this.setState(() => ({
			username: '',
			password: '',
			loginState: 'logged-out',
		}))
		await performLogout()
	}

	getUsernameRef = (ref : any) => (this._usernameInput = ref)
	getPasswordRef = (ref : any) => (this._passwordInput = ref)

	onChangeUsername = (text : string = '') => this.setState(() => ({username: text}))
	onChangePassword = (text : string = '') => this.setState(() => ({password: text}))

	render() {
		const {loginState, username, password} = this.state
		const loggedOut = loginState === 'logged-out'
		const loggedIn = loginState === 'logged-in'
		const loading = loginState === 'checking'

		return (
			<Section
				footer="St. Olaf login enables the &quot;meals remaining&quot; feature."
				header="ST. OLAF LOGIN"
			>
				{username && !loggedOut ? (
					<Cell
						title={`${loggedIn ? 'Logged' : 'Logging'} in as ${username}.`}
					/>
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
