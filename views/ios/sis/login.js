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
          <Text>Username:</Text>
          <TextInput
            style={{flex: 1, height: 40, borderColor: 'gray', borderWidth: 1}}
            autoCapitalize='none'
            onChangeText={text => this.setState({username: text})}
            value={this.state.username}
          />
        </View>
        <View style={styles.labelRow}>
          <Text>Password:</Text>
          <TextInput
            style={{flex: 1, height: 40, borderColor: 'gray', borderWidth: 1}}
            onChangeText={text => this.setState({password: text})}
            value={this.state.password}
            secureTextEntry={true}
          />
        </View>
        <Button
          style={{fontSize: 20, color: 'green', borderWidth: 1, borderColor: 'gray'}}
          styleDisabled={{color: 'red'}}
          // onPress={this._handlePress}
        >
          Press Me!
        </Button>
      </View>
    )
  }
}

var styles = StyleSheet.create({
  labelRow: {
    flex: 1, flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center',
  }
})

module.exports = SISLoginSection
