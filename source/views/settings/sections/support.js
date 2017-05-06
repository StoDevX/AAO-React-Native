// @flow
import React from 'react'
import {Alert} from 'react-native'
import {Section} from 'react-native-tableview-simple'
import Communications from 'react-native-communications'
import DeviceInfo from 'react-native-device-info'
import {version} from '../../../../package.json'
import {PushButtonCell} from '../components/push-button'
import {refreshApp} from '../../../lib/refresh'

export default class SupportSection extends React.Component {
  getDeviceInfo = () => `

      ----- Please do not edit below here -----
      ${DeviceInfo.getBrand()} ${DeviceInfo.getModel()}
      ${DeviceInfo.getDeviceId()}
      ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}
      ${DeviceInfo.getReadableVersion()}
      Codepush: ${version}
    `

  openEmail = () => {
    Communications.email(
      ['odt@stolaf.edu'],
      null,
      null,
      'Support: All About Olaf',
      this.getDeviceInfo(),
    )
  }

  onResetButton = () =>
    Alert.alert(
      'Reset Everything',
      'Are you sure you want to clear everything?',
      [
        {
          text: 'Reset it!',
          style: 'destructive',
          onPress: () => refreshApp(),
        },
        {text: 'Nope!', style: 'cancel'},
      ],
    )

  render() {
    return (
      <Section header="SUPPORT">
        <PushButtonCell title="Contact Us" onPress={this.openEmail} />
        <PushButtonCell title="Reset Everything" onPress={this.onResetButton} />
      </Section>
    )
  }
}
