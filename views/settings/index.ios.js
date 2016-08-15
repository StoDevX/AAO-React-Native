// @flow
/**
 * All About Olaf
 * iOS Settings page
 */

import React from 'react'
import {
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
} from 'react-native'

import {
    Cell,
    CustomCell,
    Section,
    TableView,
} from 'react-native-tableview-simple'

import NavigatorScreen from '../components/navigator-screen'
import Icon from 'react-native-vector-icons/Entypo'
import Communications from 'react-native-communications'
import Keychain from 'react-native-keychain'
import * as c from '../components/colors'

export default class SettingsView extends React.Component {
  state = {
    username: '',
    password: '',
  }

  updateUsername(text: string) {
    this.setState({ username: text })
  }

  updatePassword(text: string) {
    this.setState({ password: text })
  }

  // Currently only both items are saved when we hit "done" on password
  saveCredentials() {
     // Check if we have a username set already. We cannot check for password here
     // as it would not be set by the time we check for it
    if (this.state.username !== '') {
        // Save the username and password from the saved state variables
      Keychain.setGenericPassword(this.state.username, this.state.password)

      // Tests to show it works
      this.retrieveCredientials()
      //this.resetCredentials()
    }
  }

  async retrieveCredientials() {
    let credentials = await Keychain.getGenericPassword()

    console.log('username ' + credentials.username +
                  '\npassword ' + credentials.password)
    console.log('Credentials successfully created')
  }

  async resetCredentials(username: string) {
    await Keychain.resetInternetCredentials(username)
    console.log('Credentials successfully deleted')
  }

  renderScene() {
    return (
      <ScrollView contentContainerStyle={styles.stage}>
        <TableView>
          <Section header='ST. OLAF ACCOUNT'>
            <CustomCell>
              <Icon name='user' size={18} />
              <Text style={styles.label}>Username</Text>
              <TextInput
                cellStyle='Basic'
                autoCorrect={false}
                autoCapitalize='none'
                style={styles.customTextInput}
                placeholder='username'
                onEndEditing={event => this.updateUsername(event.nativeEvent.text)}
              />
            </CustomCell>

            <CustomCell>
              <Icon name='lock' size={18} />
              <Text style={styles.label}>Password</Text>
              <TextInput
                cellStyle='Basic'
                secureTextEntry={true}
                autoCorrect={false}
                autoCapitalize='none'
                style={styles.customTextInput}
                placeholder='password'
                onEndEditing={event => this.updatePassword(event.nativeEvent.text)}
              />
            </CustomCell>
          </Section>

          <Section>
            <CustomCell onPress={() => this.saveCredentials()}>
              <Text style={styles.loginButtonText}>LOGIN</Text>
            </CustomCell>
          </Section>

          <Section header='SUPPORT'>
            <Cell cellStyle='RightDetail'
              title='Contact Us'
              accessory='DisclosureIndicator'
              onPress={() => Communications.email(
                ['odt@stolaf.edu'],
                null,
                null,
                'All About Olaf',
                null)}
            />
          </Section>

          <Section header='ODDS & ENDS'>
            <Cell cellStyle='RightDetail'
              title='Version'
              detail='<get me from info.plist>'
            />

            <Cell cellStyle='Basic'
              title='Credits'
              accessory='DisclosureIndicator'
              onPress={() => console.log('credits pressed')}
            />

            <Cell cellStyle='Basic'
              title='Privacy Policy'
              accessory='DisclosureIndicator'
              onPress={() => console.log('privacy policy pressed')}
            />

            <Cell cellStyle='Basic'
              title='Legal'
              accessory='DisclosureIndicator'
              onPress={() => console.log('legal pressed')}
            />
          </Section>
        </TableView>
      </ScrollView>
    )
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title='Settings'
      renderScene={this.renderScene.bind(this)}
    />
  }
}

let styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
  },
  stage: {
    backgroundColor: '#EFEFF4',
    paddingTop: 20,
    paddingBottom: 20,
  },
  label: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
    marginRight: -100,
  },
  customTextInput: {
    flex: 1,
    color: '#C7C7CC',
  },
  loginButtonText: {
    color: c.black,
  },
  loginButton: {
    backgroundColor: c.white,
  },
})
