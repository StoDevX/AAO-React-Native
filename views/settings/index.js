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
  Platform,
  AsyncStorage,
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
import * as c from '../components/colors'

import {
  saveLoginCredentials,
  loadLoginCredentials,
  clearLoginCredentials,
  checkLogin,
} from '../../lib/login'

export default class SettingsView extends React.Component {
  state = {
    username: '',
    password: '',
    success: false,
    loading: false,
    attempted: false,
  }

  componentWillMount() {
    this.loadData()
  }

  loadData = async () => {
    let [creds, status] = await Promise.all([
      loadLoginCredentials(),
      AsyncStorage.getItem('stolaf:credentials-are-good').then(val => JSON.parse(val)),
    ])
    if (creds) {
      this.setState({username: creds.username, password: creds.password})
    }
    if (status) {
      this.setState({success: true})
    }
  }

  logIn = async () => {
    this.setState({loading: true})
    let {username, password} = this.state
    let success = await checkLogin(username, password)
    if (success) {
      saveLoginCredentials(username, password)
      AsyncStorage.setItem('stolaf:credentials-are-good', JSON.stringify(true))
    }
    this.setState({loading: false, attempted: true, success})
  }

  logOut = async () => {
    this.setState({username: '', password: ''})
    clearLoginCredentials()
    AsyncStorage.removeItem('stolaf:credentials-are-good')
  }

  handleLoginPress = () => {
    this.logIn()
  }

  handleLogoutPress = () => {
    this.logOut()
  }

  renderScene() {
    return (
      <ScrollView contentContainerStyle={styles.stage}>
        <TableView>
          <Section header='ST. OLAF ACCOUNT'>
            <CustomCell contentContainerStyle={styles.loginCell}>
              <Icon name='user' size={18} />
              <Text style={styles.label}>Username</Text>
              <TextInput
                cellStyle='Basic'
                autoCorrect={false}
                autoCapitalize='none'
                style={styles.customTextInput}
                placeholder='username'
                onChangeText={text => this.setState({username: text})}
              />
            </CustomCell>

            <CustomCell contentContainerStyle={styles.loginCell}>
              <Icon name='lock' size={18} />
              <Text style={styles.label}>Password</Text>
              <TextInput
                cellStyle='Basic'
                secureTextEntry={true}
                autoCorrect={false}
                autoCapitalize='none'
                style={styles.customTextInput}
                placeholder='password'
                onChangeText={text => this.setState({password: text})}
              />
            </CustomCell>
          </Section>

          <Section>
            {this.state.attempted
              ? <CustomCell disabled={this.state.loading} onPress={this.handleLogoutPress}>
                  {this.state.success
                    ? <Text>Success!</Text>
                    : <Text>Bad username or password</Text>}
                </CustomCell>
              : null}
            {this.state.success
              ? <CustomCell disabled={this.state.loading} onPress={this.handleLogoutPress}>
                  <Text style={styles.loginButtonText}>LOG OUT</Text>
                </CustomCell>
              : <CustomCell disabled={this.state.loading} onPress={this.handleLoginPress}>
                  <Text style={styles.loginButtonText}>LOG IN</Text>
                </CustomCell>}
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
                null)
              }
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
              onPress={() => console.warn('credits pressed')}
            />

            <Cell cellStyle='Basic'
              title='Privacy Policy'
              accessory='DisclosureIndicator'
              onPress={() => console.warn('privacy policy pressed')}
            />

            <Cell cellStyle='Basic'
              title='Legal'
              accessory='DisclosureIndicator'
              onPress={() => console.warn('legal pressed')}
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
  loginCell: {
    height: (Platform.OS === 'android') ? 65 : '',
  },
})
