// @flow
import React from 'react'
import {Cell, Section} from 'react-native-tableview-simple'
import {CellTextField} from '../../components/cells/textfield'
import {LoginButton} from '../components/login-button'
import {
  logInViaCredentials,
  logOutViaCredentials,
  validateLoginCredentials,
  setLoginCredentials,
  type SettingsState,
  type LoginStateType,
} from '../../../flux/parts/settings'
import {connect} from 'react-redux'
import noop from 'lodash/noop'

type Props = {
  initialUsername: string,
  initialPassword: string,
  loginState: LoginStateType,

  logIn: (username: string, password: string) => any,
  logOut: () => any,
  validateCredentials: (username: string, password: string) => any,
  setCredentials: (username: string, password: string) => any,
}

type State = {
  username: string,
  password: string,
}

class CredentialsLoginSection extends React.PureComponent<void, Props, State> {
  _usernameInput: any
  _passwordInput: any

  state = {
    username: this.props.initialUsername,
    password: this.props.initialPassword,
  }

  focusUsername = () => this._usernameInput.focus()
  focusPassword = () => this._passwordInput.focus()

  logIn = async () => {
    await this.props.logIn(this.state.username, this.state.password)
  }

  logOut = () => {
    this.props.logOut()
  }

  getUsernameRef = ref => (this._usernameInput = ref)
  getPasswordRef = ref => (this._passwordInput = ref)

  onChangeUsername = (text = '') => this.setState(() => ({username: text}))
  onChangePassword = (text = '') => this.setState(() => ({password: text}))

  render() {
    const {loginState} = this.props
    const {username, password} = this.state

    const loading = loginState === 'checking'
    const loggedIn = loginState === 'logged-in'

    let message
    if (loginState === 'invalid') {
      message = 'Login failed'
    }

    return (
      <Section
        header="ST. OLAF LOGIN"
        footer="St. Olaf login enables the &quot;meals remaining&quot; feature."
      >
        <CellTextField
          label="Username"
          _ref={this.getUsernameRef}
          disabled={loading}
          onChangeText={this.onChangeUsername}
          onSubmitEditing={this.focusPassword}
          placeholder="username"
          returnKeyType="next"
          secureTextEntry={false}
          value={username}
        />

        <CellTextField
          label="Password"
          _ref={this.getPasswordRef}
          disabled={loading}
          onChangeText={this.onChangePassword}
          onSubmitEditing={loggedIn ? noop : this.logIn}
          placeholder="password"
          returnKeyType="done"
          secureTextEntry={true}
          value={password}
        />

        {message ? <Cell title={`⚠️ ${message}`} /> : null}

        <LoginButton
          loggedIn={loggedIn}
          loading={loading}
          disabled={loading || (!username || !password)}
          onPress={loggedIn ? this.logOut : this.logIn}
          label="St. Olaf"
        />
      </Section>
    )
  }
}

function mapStateToProps(state: {settings: SettingsState}) {
  return {
    initialUsername: state.settings.credentials.username,
    initialPassword: state.settings.credentials.password,
    loginState: state.settings.credentials.state,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    logIn: (u, p) => dispatch(logInViaCredentials(u, p)),
    logOut: () => dispatch(logOutViaCredentials()),
    validateCredentials: (u, p) => dispatch(validateLoginCredentials(u, p)),
    setCredentials: (u, p) => dispatch(setLoginCredentials(u, p)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(
  CredentialsLoginSection,
)
