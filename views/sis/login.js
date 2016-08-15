// @flow
/**
 * All About Olaf
 * SIS Login section
 */

import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  AsyncStorage,
} from 'react-native'
import LoginButton from '../components/login-button'


import Frisbee from 'frisbee'

const api = new Frisbee({
  baseURI: 'https://www.stolaf.edu',
})

import buildFormData from './formdata'

async function sisLogin(username, password) {
  let form = buildFormData({
    login: username,
    passwd: password,
  })

  let loginResult = await api.post('/sis/login.cfm', {body: form})
  let loginPage = loginResult.body
  let loginHeaders = loginResult.headers

  // console.log(loginPage)
  console.log(loginHeaders)
  if (loginPage.includes('Password')) {
    return false
  }
  return true
}

import {saveLoginCredentials, loadLoginCredentials, clearLoginCredentials} from './loginstuff'

const styles = StyleSheet.create({
  labelRow: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 10,
  },
  label: {
    marginRight: 10,
  },
})

export default class SISLoginSection extends React.Component {
  state = {
    username: '',
    password: '',
    success: false,
    loading: false,
    attemped: false,
  }

  async componentWillMount() {
    let [creds, status] = await Promise.all([
      loadLoginCredentials(),
      AsyncStorage.getItem('sis:valid_credentials').then(val => JSON.parse(val)),
    ])
    if (creds) {
      this.setState({username: creds.username, password: creds.password})
    }
    if (status) {
      this.setState({success: true})
    }
  }

  _handlePress = async () => {
    this.setState({loading: true})
    let {username, password} = this.state
    let success = await sisLogin(username, password)
    if (success) {
      saveLoginCredentials(username, password)
      AsyncStorage.setItem('sis:valid_credentials', JSON.stringify(true))
    }
    this.setState({loading: false, attempted: true, success})
  }

  logOut = async () => {
    this.setState({username: '', password: ''})
    clearLoginCredentials()
    AsyncStorage.removeItem('sis:valid_credentials')
  }

  render() {
    return (
      <ScrollView>
        <View>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Username:</Text>
            <TextInput
              style={styles.textInput}
              autoCapitalize='none'
              editable={!this.state.loading}
              onChangeText={text => this.setState({username: text})}
              value={this.state.username}
              // ios only
              clearButtonMode={'always'}
            />
          </View>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Password:</Text>
            <TextInput
              style={styles.textInput}
              editable={!this.state.loading}
              onChangeText={text => this.setState({password: text})}
              value={this.state.password}
              secureTextEntry={true}
              // ios only
              clearButtonMode={'always'}
            />
          </View>
        </View>
        <LoginButton
          containerStyle={styles.loginButtonContainer}
          style={styles.loginButton}
          disabledStyle={{color: 'red'}}
          onPress={this._handlePress}
          disabled={this.state.loading}
        >
          Log In
        </LoginButton>

        {this.state.success
          ? <LoginButton
            containerStyle={styles.loginButtonContainer}
            style={styles.loginButton}
            disabledStyle={{color: 'red'}}
            onPress={this.logOut}
            >
              Log Out
            </LoginButton>
          : null}

        {this.state.attempted
          ? <View>
            {this.state.success
              ? <Text>Success!</Text>
              : <Text>Bad username or password</Text>}
            </View>
          : null}
      </ScrollView>
    )
  }
}
