// @flow
import React from 'react'
import {Cell} from 'react-native-tableview-simple'
import {SectionWithNullChildren} from '../../components/section-with-null-children'
import {LoginField} from '../components/login-field'
import {LoginButton} from '../components/login-button'
import {
  logInViaCredentials,
  logOutViaCredentials,
  validateLoginCredentials,
  setLoginCredentials,
} from '../../../flux/parts/settings'
import {connect} from 'react-redux'
import noop from 'lodash/noop'


type CredentialsSectionPropsType = {
  username: string,
  password: string,
  loggedIn: boolean,
  message: ?string,

  logIn: (username: string, password: string) => any,
  logOut: () => any,
  validateCredentials: (username: string, password: string) => any,
  setCredentials: (username: string, password: string) => any,
};


class CredentialsLoginSection extends React.Component {
  state = {
    loading: false,
  }

  props: CredentialsSectionPropsType;

  _usernameInput: any;
  _passwordInput: any;
  focusUsername = () => this._usernameInput.focus();
  focusPassword = () => this._passwordInput.focus();

  logIn = async () => {
    this.setState({loading: true})
    await this.props.logIn(this.props.username, this.props.password)
    this.setState({loading: false})
  }

  logOut = () => {
    this.props.logOut()
  }

  render() {
    let {loggedIn, message} = this.props
    let {loading} = this.state

    return (
      <SectionWithNullChildren
        header='ST. OLAF LOGIN'
        footer='St. Olaf login enables the "meals remaining" feature.'
      >
        <LoginField
          label='Username'
          _ref={ref => this._usernameInput = ref}
          disabled={loading}
          onChangeText={(text='') => this.props.setCredentials(text, this.props.password)}
          onSubmitEditing={this.focusPassword}
          placeholder='username'
          returnKeyType='next'
          secureTextEntry={false}
          value={this.props.username}
        />

        <LoginField
          label='Password'
          _ref={ref => this._passwordInput = ref}
          disabled={loading}
          onChangeText={(text='') => this.props.setCredentials(this.props.username, text)}
          onSubmitEditing={loggedIn ? noop : this.logIn}
          placeholder='password'
          returnKeyType='done'
          secureTextEntry={true}
          value={this.props.password}
        />

        {message ? <Cell title={'⚠️ ' + message} /> : null}

        <LoginButton
          loggedIn={loggedIn}
          loading={loading}
          disabled={loading || (!this.props.username || !this.props.password)}
          onPress={loggedIn ? this.logOut : this.logIn}
          label='St. Olaf'
        />
      </SectionWithNullChildren>
    )
  }
}


function mapStateToProps(state) {
  return {
    username: state.settings.credentials.username,
    password: state.settings.credentials.password,
    loggedIn: state.settings.credentials.valid,
    message: state.settings.credentials.error,
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

export default connect(mapStateToProps, mapDispatchToProps)(CredentialsLoginSection)
