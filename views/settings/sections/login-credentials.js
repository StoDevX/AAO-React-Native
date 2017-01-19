// @flow
import React from 'react'
import {Cell} from 'react-native-tableview-simple'
import {SectionWithNullChildren} from '../../components/section-with-null-children'
import {LoginField} from '../components/login-field'
import {LoginButton} from '../components/login-button'

export class CredentialsLoginSection extends React.Component {
  state = {
    loading: false,
  }

  props: {
    username: string,
    password: string,
    loggedIn: boolean,
    logIn: (username: string, password: string) => Promise<boolean>,
    logOut: () => any,
    message: ?string,
    validateLogin: (username: string, password: string) => Promise<boolean>,
    onChangeUsername: (username: string) => any,
    onChangePassword: (password: string) => any,
  };

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
          onChangeText={text => text && this.props.onChangeUsername(text)}
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
          onChangeText={text => text && this.props.onChangePassword(text)}
          onSubmitEditing={loggedIn ? () => {} : this.logIn}
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
