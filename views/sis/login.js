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
} from 'react-native'
import LoginButton from '../components/login-button'

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
  loginButton: {

  },
  loginButtonContainer: {

  }
})

export default class SISLoginSection extends React.Component {
  constructor() {
    super()
    this.state = {
      username: '',
      password: '',
    }
  }

  render() {
    return (
      <View>
        <Text>
          Credentials
        </Text>
        <View>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Username:</Text>
            <TextInput
              style={styles.textInput}
              autoCapitalize='none'
              onChangeText={text => this.setState({username: text})}
              value={this.state.username}
            />
          </View>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Password:</Text>
            <TextInput
              style={styles.textInput}
              onChangeText={text => this.setState({password: text})}
              value={this.state.password}
              secureTextEntry={true}
            />
          </View>
        </View>
        <LoginButton
          containerStyle={styles.loginButtonContainer}
          style={styles.loginButton}
          disabledStyle={{color: 'red'}}
          onPress={this._handlePress}
        >
          Log In
        </LoginButton>
      </View>
    )
  }

  _handlePress(ev) {
    console.warn(ev)
  }
}
