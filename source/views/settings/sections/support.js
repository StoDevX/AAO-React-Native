// @flow
import React from 'react'
import {Cell, Section} from 'react-native-tableview-simple'
import Communications from 'react-native-communications'
import DeviceInfo from 'react-native-device-info'
import {version} from '../../../../package.json'
import {PushButtonCell} from '../components/push-button'

export default class SupportSection extends React.Component {
  getDeviceInfo = () => {
    return `
      ----- Please do not edit below here -----
      ${DeviceInfo.getBrand()} ${DeviceInfo.getModel()}
      ${DeviceInfo.getDeviceId()}
      ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}
      ${DeviceInfo.getReadableVersion()}
      Codepush: ${version}
    `
  }

  getSupportBody = () => {
    return '\n' + this.getDeviceInfo()
  }

  openEmail = () => {
    Communications.email(
      ['odt@stolaf.edu'],
      null,
      null,
      'Support: All About Olaf',
      this.getSupportBody(),
    )
  }

  render() {
    return (
      <Section header="SUPPORT">
        <PushButtonCell title="Contact Us" onPress={this.openEmail} />
      </Section>
    )
  }
}
