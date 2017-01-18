// @flow
import React from 'react'
import {StyleSheet, ScrollView, Platform} from 'react-native'
import {TableView} from 'react-native-tableview-simple'
import type {TopLevelViewPropsType} from '../types'
import {
  logInViaCredentials,
  logOutViaCredentials,
  validateLoginCredentials,
  logInViaToken,
  logOutViaToken,
  setLoginCredentials,
} from '../../flux/parts/settings'
import {connect} from 'react-redux'
import * as c from '../components/colors'

import {CredentialsLoginSection} from './sections/login-credentials'
import {TokenLoginSection} from './sections/login-token'
import {OddsAndEndsSection} from './sections/odds-and-ends'
import {SupportSection} from './sections/support'

const styles = StyleSheet.create({
  container: {
    backgroundColor: Platform.OS === 'ios' ? c.iosLightBackground : c.androidLightBackground,
    paddingVertical: 20,
  },
})

type SettingsViewPropsType = TopLevelViewPropsType & {
  username: string,
  password: string,
  credentialsValid: boolean,
  tokenValid: boolean,
  tokenMessage: string,
  credentialsMessage: string,

  logInViaCredentials: (username: string, password: string) => any,
  logOutViaCredentials: () => any,
  validateLoginCredentials: (username: string, password: string) => any,
  logInViaToken: (status: boolean) => any,
  logOutViaToken: () => any,
  setLoginCredentials: (username: string, password: string) => any,
};

function SettingsView(props: SettingsViewPropsType) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps={true}
      keyboardDismissMode={'on-drag'}
    >
      <TableView>
        <CredentialsLoginSection
          username={props.username}
          password={props.password}
          loggedIn={props.credentialsValid}
          validateLogin={props.validateLoginCredentials}
          logIn={props.logInViaCredentials}
          logOut={props.logOutViaCredentials}
          message={props.credentialsMessage}
          onChangeUsername={username => props.setLoginCredentials(username, props.password)}
          onChangePassword={password => props.setLoginCredentials(props.username, password)}
        />

        <TokenLoginSection
          navigator={props.navigator}
          route={props.route}
          loggedIn={props.tokenValid}
          logIn={props.logInViaToken}
          logOut={props.logOutViaToken}
          message={props.tokenMessage}
        />

        <SupportSection />

        <OddsAndEndsSection
          navigator={props.navigator}
          route={props.route}
        />
      </TableView>
    </ScrollView>
  )
}

function mapStateToProps(state) {
  return {
    username: state.settings.credentials.username,
    password: state.settings.credentials.password,
    credentialsValid: state.settings.credentials.valid,
    credentialsMessage: state.settings.credentials.error,
    tokenValid: state.settings.token.valid,
    tokenMessage: state.settings.token.error,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    logInViaCredentials: (u, p) => dispatch(logInViaCredentials(u, p)),
    logOutViaCredentials: () => dispatch(logOutViaCredentials()),
    validateLoginCredentials: (u, p) => dispatch(validateLoginCredentials(u, p)),
    logInViaToken: s => dispatch(logInViaToken(s)),
    logOutViaToken: () => dispatch(logOutViaToken()),
    setLoginCredentials: (u, p) => dispatch(setLoginCredentials(u, p)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsView)
