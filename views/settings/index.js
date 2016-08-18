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

function SisAccountSection(props: {
  loading: bool,
  loggedIn: bool,
  username: string,
  password: string,
  onUsernameChange: Function,
  onPasswordChange: Function,
  onSubmit: Function,
}) {
  return (
    <Section header='ST. OLAF ACCOUNT'>
      <CustomCell contentContainerStyle={styles.loginCell}>
        <Icon name='user' size={18} />
        <Text style={styles.label}>Username</Text>

        <SisAccountTextInput
          placeholder='username'
          value={props.username}
          returnKeyType='next'
          onChangeText={props.onUsernameChange}
        />
      </CustomCell>

      <CustomCell contentContainerStyle={styles.loginCell}>
        <Icon name='lock' size={18} />
        <Text style={styles.label}>Password</Text>

        <SisAccountTextInput
          secureTextEntry={true}
          placeholder='password'
          value={props.password}
          returnKeyType='done'
          onChangeText={props.onPasswordChange}
          onSubmitEditing={props.onSubmit}
        />
      </CustomCell>

      <CustomCell disabled={props.loading} onPress={props.onSubmit}>
        {props.loggedIn
          ? <Text style={styles.loginButtonText}>Sign Out</Text>
          : <Text style={styles.loginButtonText}>Sign In</Text>}
      </CustomCell>
    </Section>
  )
}
SisAccountSection.propTypes = {
  loading: React.PropTypes.bool.isRequired,
  loggedIn: React.PropTypes.bool.isRequired,
  onPasswordChange: React.PropTypes.func.isRequired,
  onSubmit: React.PropTypes.func.isRequired,
  onUsernameChange: React.PropTypes.func.isRequired,
  password: React.PropTypes.string.isRequired,
  username: React.PropTypes.string.isRequired,
}


function SupportSection() {
  return (
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
}


function OddsAndEndsSection() {
  return (
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
          <SisAccountSection
            username={this.state.username}
            password={this.state.password}
            onUsernameChange={text => this.setState({username: text})}
            onPasswordChange={text => this.setState({password: text})}
            onSubmit={this.state.success ? this.handleLogoutPress : this.handleLoginPress}
            loggedIn={this.state.success}
            loading={this.state.loading}
          />

          <SupportSection />

          <OddsAndEndsSection />
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
    marginLeft: 10,
    marginRight: -100,
  },
  customTextInput: {
    flex: 1,
  },
  loginButtonText: {
    color: c.black,
  },
  loginButton: {
    backgroundColor: c.white,
  },
  loginCell: {
    height: (Platform.OS === 'android') ? 65 : 40,
  },
})
