// @flow
/**
 * All About Olaf
 * iOS Settings page
 */

import React from 'react'
import {
  StyleSheet,
  Text,
  ScrollView,
  Platform,
  AsyncStorage,
  Navigator,
  View,
  TextInput,
  Alert,
} from 'react-native'

import {
  Cell,
  CustomCell,
  Section,
  TableView,
} from 'react-native-tableview-simple'

import {version} from '../../package.json'

import Communications from 'react-native-communications'
import * as c from '../components/colors'
import CookieManager from 'react-native-cookies'
import DeviceInfo from 'react-native-device-info'

// These imports manage the St. Olaf login system
import {
  loadLoginCredentials,
  clearLoginCredentials,
  performLogin,
} from '../../lib/login'


export default class SettingsView extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.instanceOf(Navigator),
    route: React.PropTypes.object,
  }

  state = {
    loggedInGoogle: false,
    loggedInStOlaf: false,
    successGoogle: false,
    successStOlaf: false,
    loadingGoogle: false,
    loadingStOlaf: false,
    attempted: false,
    username: '',
    password: '',
  }

  componentWillMount() {
    this.loadData()
  }

  _usernameInput: any;
  _passwordInput: any;

  loadData = async () => {
    let [creds, status] = await Promise.all([
      loadLoginCredentials(),
      AsyncStorage.getItem('credentials:valid').then(val => JSON.parse(val)),
    ])
    if (creds) {
      this.setState({username: creds.username, password: creds.password})
    }
    if (status) {
      this.setState({loggedInStOlaf: true})
    }
  }

  logInGoogle = () => {
    this.props.navigator.push({
      id: 'SISLoginView',
      index: this.props.route.index + 1,
      props: {
        onLoginComplete: status => this.setState({successGoogle: status}),
      },
    })
  }

  logOutGoogle = async () => {
    this.setState({loadingGoogle: true})
    CookieManager.clearAll(err => {
      if (err) {
        console.log(err)
        Alert.alert('Error signing out', 'There was an issue signing out. Please try again.')
      }
      this.setState({
        successGoogle: false,
        loadingGoogle: false,
      })
    })
    await AsyncStorage.setItem('credentials:valid', JSON.stringify(false))
  }


  getDeviceInfo() {
    let deviceInfo = `
      ----- Please do not edit below here -----
      ${DeviceInfo.getBrand()} ${DeviceInfo.getModel()}
      ${DeviceInfo.getDeviceId()}
      ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}
      ${DeviceInfo.getReadableVersion()}
    `
    return deviceInfo
  }

  getSupportBody() {
    return '\n' + this.getDeviceInfo()
  }

  logInStOlaf = async () => {
    this.setState({loadingStOlaf: true})
    let {username, password} = this.state
    if (username) {
      username = username.replace(/@.*/g, '') // just in case someone uses their full email, throw the part we don't need away
    }
    let {result} = await performLogin(username, password)

    if (!result) {
      Alert.alert('Error signing in', 'The username or password is incorrect.')
      this.setState({loadingStOlaf: false, attempted: true, successStOlaf: result, loggedInStOlaf: false})
      return
    }
    this.setState({loadingStOlaf: false, attempted: true, successStOlaf: result, loggedInStOlaf: true})
  }

  logOutStOlaf = async () => {
    this.setState({username: '', password: '', successStOlaf: false, attempted: false, loggedInStOlaf: false})
    clearLoginCredentials()
    AsyncStorage.removeItem('credentials:valid')
  }

  onPressLegalButton() {
    this.props.navigator.push({
      id: 'LegalView',
      title: 'Legal',
      index: this.props.route.index + 1,
    })
  }

  onPressCreditsButton() {
    this.props.navigator.push({
      id: 'CreditsView',
      title: 'Credits',
      index: this.props.route.index + 1,
    })
  }

  onPressPrivacyButton() {
    this.props.navigator.push({
      id: 'PrivacyView',
      title: 'Privacy Policy',
      index: this.props.route.index + 1,
    })
  }

  focusUsername = () => {
    this._usernameInput.focus()
  }

  focusPassword = () => {
    this._passwordInput.focus()
  }

  render() {
    let loggedInGoogle = this.state.loggedInGoogle
    let loggedInStOlaf = this.state.loggedInStOlaf
    let loadingGoogle = this.state.loadingGoogle
    let loadingStOlaf = this.state.loadingStOlaf
    let username = this.state.username
    let password = this.state.password
    let disabledGoogle = loadingGoogle
    let disabledStOlaf = loadingStOlaf

    let loginTextStyleGoogle = disabledGoogle
      ? styles.loginButtonTextDisabled
      : loadingGoogle
        ? styles.loginButtonTextLoading
        : styles.loginButtonTextActive

    let loginTextStyleStOlaf = disabledStOlaf
      ? styles.loginButtonTextDisabled
      : loadingStOlaf
        ? styles.loginButtonTextLoading
        : styles.loginButtonTextActive

    let actionCell = (
      <CustomCell
        contentContainerStyle={styles.actionButton}
        isDisabled={disabledGoogle}
        onPress={loggedInGoogle ? this.logOutGoogle : this.logInGoogle}
      >
        <Text style={[styles.loginButtonText, loginTextStyleGoogle]}>
          {loadingGoogle
            ? 'Logging in to Google…'
            : loggedInGoogle
              ? 'Sign Out of Google'
              : 'Sign In with Google'}
        </Text>
      </CustomCell>
    )

    let usernameCell = (
      <CustomCell contentContainerStyle={styles.loginCell}>
        <Text onPress={this.focusUsername} style={styles.label}>Username</Text>
        <TextInput
          ref={ref => this._usernameInput = ref}
          cellStyle='Basic'
          autoCorrect={false}
          autoCapitalize='none'
          style={styles.customTextInput}
          placeholderTextColor='#C7C7CC'
          disabled={disabledStOlaf}
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
        <Text onPress={this.focusPassword} style={styles.label}>Password</Text>
        <TextInput
          ref={ref => this._passwordInput = ref}
          cellStyle='Basic'
          autoCorrect={false}
          autoCapitalize='none'
          style={styles.customTextInput}
          placeholderTextColor='#C7C7CC'
          disabled={disabledStOlaf}
          secureTextEntry={true}
          placeholder='password'
          value={password}
          returnKeyType='done'
          onChangeText={text => this.setState({password: text})}
          onSubmitEditing={loggedInStOlaf ? () => {} : this.logInStOlaf}
        />
      </CustomCell>
    )

    let loginButton = (
      <CustomCell
        contentContainerStyle={styles.actionButton}
        isDisabled={disabledStOlaf}
        onPress={loggedInStOlaf ? this.logOutStOlaf : this.logInStOlaf}
      >
        <Text style={[styles.loginButtonText, loginTextStyleStOlaf]}>
          {loadingStOlaf
            ? 'Logging in St. Olaf…'
            : loggedInStOlaf
              ? 'Sign Out of St. Olaf'
              : 'Sign In to St. Olaf'}
        </Text>
      </CustomCell>
    )

    let accountSection = (
      <View>
        <Section header='LOGIN' footer='Note: This application requires both logging in to Google and inputting your St. Olaf username and password in order to use all features.'>
          {usernameCell}
          {passwordCell}
          {loginButton}
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
            'Support: All About Olaf',
            this.getSupportBody())
          }
        />
      </Section>
    )

    let oddsAndEndsSection = (
      <Section header='ODDS & ENDS'>
        <Cell cellStyle='RightDetail'
          title='Version'
          detail={version}
        />

        <Cell cellStyle='Basic'
          title='Credits'
          accessory='DisclosureIndicator'
          onPress={() => this.onPressCreditsButton()}
        />

        <Cell cellStyle='Basic'
          title='Privacy Policy'
          accessory='DisclosureIndicator'
          onPress={() => this.onPressPrivacyButton()}
        />

        <Cell cellStyle='Basic'
          title='Legal'
          accessory='DisclosureIndicator'
          onPress={() => this.onPressLegalButton()}
        />
      </Section>
    )

    return (
      <ScrollView
        contentContainerStyle={styles.stage}
        keyboardShouldPersistTaps={true}
        keyboardDismissMode={'on-drag'}
      >
        <TableView>
          {accountSection}
          {supportSection}
          {oddsAndEndsSection}
        </TableView>
      </ScrollView>
    )
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
    width: 90,
    fontSize: 16,
    marginTop: (Platform.OS === 'ios') ? -2 : 0,  // lines the label up with the text on iOS
    alignSelf: 'center',
  },
  note: {

  },
  actionButton: {
    justifyContent: 'flex-start',
  },
  customTextInput: {
    flex: 1,
  },
  loginButtonText: {
    fontSize: 16,
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
