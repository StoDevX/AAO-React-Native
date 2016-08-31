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
import {
  loadLoginCredentials,
} from '../../lib/login'


export default class SettingsView extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.instanceOf(Navigator),
    route: React.PropTypes.object,
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

  logIn = () => {
    this.props.navigator.push({
      id: 'SISLoginView',
      index: this.props.route.index + 1,
    })
  }

  logOut = async () => {
    // this.props.navigator.push({
    //   id: 'SISLoginView',
    //   index: this.props.route.index + 1,
    // })
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
      index: this.props.route.index + 1,
    })
  }

  onPressCreditsButton() {
    this.props.navigator.push({
      id: 'CreditsView',
      index: this.props.route.index + 1,
    })
  }

  onPressPrivacyButton() {
    this.props.navigator.push({
      id: 'PrivacyView',
      index: this.props.route.index + 1,
    })
  }

  render() {
    let username = this.state.username
    let password = this.state.password

    let loggedIn = this.state.success
    let loading = this.state.loading

    let disabled = loading

    let loginTextStyle = disabled
      ? styles.loginButtonTextDisabled
      : loading
        ? styles.loginButtonTextLoading
        : styles.loginButtonTextActive

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
