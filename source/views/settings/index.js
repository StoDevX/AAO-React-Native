// @flow
import React from 'react'
import {StyleSheet, ScrollView, Platform} from 'react-native'
import {TableView} from 'react-native-tableview-simple'
import type {TopLevelViewPropsType} from '../types'
import * as c from '../components/colors'

import CredentialsLoginSection from './sections/login-credentials'
// import TokenLoginSection from './sections/login-token'
import OddsAndEndsSection from './sections/odds-and-ends'
import SupportSection from './sections/support'

const styles = StyleSheet.create({
  container: {
    backgroundColor: Platform.OS === 'ios'
      ? c.iosLightBackground
      : c.androidLightBackground,
    paddingVertical: 20,
  },
})

export default function SettingsView(props: TopLevelViewPropsType) {
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="on-drag"
    >
      <TableView>
        <CredentialsLoginSection />

        <SupportSection navigator={props.navigator} route={props.route} />

        <OddsAndEndsSection navigator={props.navigator} route={props.route} />
      </TableView>
    </ScrollView>
  )
}
