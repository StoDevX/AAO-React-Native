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
  Navigator,
  Alert,
  View,
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

function SisAccountTextInput(props) {
  return <TextInput
    cellStyle='Basic'
    autoCorrect={false}
    autoCapitalize='none'
    style={styles.customTextInput}
    placeholderTextColor='#C7C7CC'
    {...props}
  />
}


export default class SettingsView extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.instanceOf(Navigator),
  }

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

  _usernameInput: React.Element;
  _passwordInput: React.Element;

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
    if (!success) {
      Alert.alert('Error signing in', 'The username or password is incorrect.')
    }
    this.setState({loading: false, attempted: true, success})
  }

  logOut = async () => {
    this.setState({username: '', password: '', success: false, attempted: false})
    clearLoginCredentials()
    AsyncStorage.removeItem('stolaf:credentials-are-good')
  }

  handleLoginPress = () => {
    this.logIn()
  }

  handleLogoutPress = () => {
    this.logOut()
  }

  focusUsername = () => {
    this._usernameInput.focus()
  }

  focusPassword = () => {
    this._passwordInput.focus()
  }

  renderScene() {
    let username = this.state.username
    let password = this.state.password

    let onSubmit = this.state.success
      ? this.handleLogoutPress
      : this.handleLoginPress
    let loggedIn = this.state.success
    let loading = this.state.loading

    let disabled = loading || (!username || !password)

    let loginTextStyle = disabled
      ? styles.loginButtonTextDisabled
      : loading
        ? styles.loginButtonTextLoading
        : styles.loginButtonTextActive

    let usernameCell = (
      <CustomCell contentContainerStyle={styles.loginCell}>
        <Text onPress={this.focusUsername} style={styles.label}>Username</Text>

        <SisAccountTextInput
          ref={ref => this._usernameInput = ref}
          disabled={disabled}
          placeholder='username'
          value={username}
          returnKeyType='next'
          onChangeText={text => this.setState({username: text})}
          onSubmitEditing={this.focusPassword}
        />
      </CustomCell>
    )

    let passwordCell = (
      <CustomCell contentContainerStyle={styles.loginCell}>
        <Text onPress={this.focusUsername} style={styles.label}>Password</Text>

        <SisAccountTextInput
          ref={ref => this._passwordInput = ref}
          disabled={disabled}
          secureTextEntry={true}
          placeholder='password'
          value={password}
          returnKeyType='done'
          onChangeText={text => this.setState({password: text})}
          onSubmitEditing={onSubmit}
        />
      </CustomCell>
    )

    let actionCell = (
      <CustomCell
        contentContainerStyle={styles.actionButton}
        isDisabled={disabled}
        onPress={onSubmit}
      >
        <Text style={loginTextStyle}>
          {loading
            ? 'Logging in…'
            : loggedIn
              ? 'Sign Out'
              : 'Sign In'}
        </Text>
      </CustomCell>
    )

    let accountSection = (
      <View>
        <Section header='ST. OLAF ACCOUNT'>
          {usernameCell}
          {passwordCell}
        </Section>

        <Section>
          {actionCell}
        </Section>
      </View>
    )

    let supportSection = (
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
    )

    let oddsAndEndsSection = (
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
    )

    return (
      <ScrollView contentContainerStyle={styles.stage}>
        <TableView>
          {accountSection}
          {supportSection}
          {oddsAndEndsSection}
        </TableView>
      </ScrollView>
    )
  }

  render() {
    return <NavigatorScreen
      navigator={this.props.navigator}
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
    marginRight: -130,
    marginTop: (Platform.OS === 'ios') ? -2 : 0,  // lines the label up with the text on iOS
    alignSelf: 'center',
  },
  actionButton: {
    justifyContent: 'flex-start',
  },
  customTextInput: {
    flex: 1,
  },
  loginButtonTextActive: {
    color: c.infoBlue,
  },
  loginButtonTextDisabled: {
    color: c.iosDisabledText,
  },
  loginButtonTextLoading: {
    color: c.iosDisabledText,
  },
  loginButton: {
    backgroundColor: c.white,
  },
  loginCell: {
    height: (Platform.OS === 'android') ? 65 : 44,
    alignItems: 'stretch',
    paddingTop: 0,
    paddingBottom: 0,
  },
})
