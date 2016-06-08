/**
 * All About Olaf
 * iOS Menus page
 */
'use strict'

// React native
const React = require('react')
const RN = require('react-native')
const Button = require('react-native-button')

const {StyleSheet, Text, View, TextInput} = RN

class SISLoginSection extends React.Component {
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
        <Button
          containerStyle={styles.loginButtonContainer}
          style={styles.loginButton}
          styleDisabled={{color: 'red'}}
          // onPress={this._handlePress}
        >
          Log In
        </Button>
      </View>
    )
  }
}

var styles = StyleSheet.create({
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
    height: 40,
    fontSize: 20,
    borderColor: 'gray',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    textAlignVertical: 'center'
  },
  loginButtonContainer: {
    alignItems: 'center',
    borderWidth: 1,
    flex: 1,
  }
})

module.exports = SISLoginSection
