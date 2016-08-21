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

import {version} from '../../package.json'

import NavigatorScreen from '../components/navigator-screen'
import Icon from 'react-native-vector-icons/Entypo'
import Communications from 'react-native-communications'
import * as c from '../components/colors'
import LegalView from './legal'
import CreditsView from './credits'
import PrivacyView from './privacy'
import {
  loadLoginCredentials,
  clearLoginCredentials,
  performLogin,
} from '../../lib/login'


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
      this.setState({success: true})
    }
  }

  logIn = async () => {
    this.setState({loading: true})
    let {username, password} = this.state
    let {result} = await performLogin(username, password)
    if (!result) {
      Alert.alert('Error signing in', 'The username or password is incorrect.')
    }
    this.setState({loading: false, attempted: true, success: result})
  }

  logOut = async () => {
    this.setState({username: '', password: '', success: false, attempted: false})
    clearLoginCredentials()
    AsyncStorage.removeItem('credentials:valid')
  }

  focusUsername = () => {
    console.log(this._usernameInput)
    this._usernameInput.focus()
  }

  focusPassword = () => {
    this._passwordInput.focus()
  }

  onPressLegalButton() {
    this.props.navigator.push({
      id: 'LegalView',
      component: <LegalView
        navigator={this.props.navigator}
      />,
    })
  }

  onPressCreditsButton() {
    this.props.navigator.push({
      id: 'CreditsView',
      component: <CreditsView
        navigator={this.props.navigator}
      />,
    })
  }

  onPressPrivacyButton() {
    this.props.navigator.push({
      id: 'PrivacyView',
      component: <PrivacyView
        navigator={this.props.navigator}
      />,
    })
  }

  renderScene() {
    let username = this.state.username
    let password = this.state.password

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

        <TextInput
          ref={ref => this._usernameInput = ref}
          cellStyle='Basic'
          autoCorrect={false}
          autoCapitalize='none'
          style={styles.customTextInput}
          placeholderTextColor='#C7C7CC'
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
        <Text onPress={this.focusPassword} style={styles.label}>Password</Text>

        <TextInput
          ref={ref => this._passwordInput = ref}
          cellStyle='Basic'
          autoCorrect={false}
          autoCapitalize='none'
          style={styles.customTextInput}
          placeholderTextColor='#C7C7CC'
          disabled={disabled}
          secureTextEntry={true}
          placeholder='password'
          value={password}
          returnKeyType='done'
          onChangeText={text => this.setState({password: text})}
          onSubmitEditing={loggedIn ? this.logIn : () => {}}
        />
      </CustomCell>
    )

    let actionCell = (
      <CustomCell
        contentContainerStyle={styles.actionButton}
        isDisabled={disabled}
        onPress={loggedIn ? this.logOut : this.logIn}
      >
        <Text style={[styles.loginButtonText, loginTextStyle]}>
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
            'Support: All About Olaf',
            null)
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
