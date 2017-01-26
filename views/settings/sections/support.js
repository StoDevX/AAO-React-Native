// @flow
import React from 'react'
import {Cell, Section} from 'react-native-tableview-simple'
import Communications from 'react-native-communications'
import DeviceInfo from 'react-native-device-info'

export class SupportSection extends React.Component {
  getDeviceInfo = () => {
    return `
      ----- Please do not edit below here -----
      ${DeviceInfo.getBrand()} ${DeviceInfo.getModel()}
      ${DeviceInfo.getDeviceId()}
      ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}
      ${DeviceInfo.getReadableVersion()}
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
      this.getSupportBody())
  }

  render() {
    return (
      <Section header='SUPPORT'>
        <Cell cellStyle='RightDetail'
          title='Contact Us'
          accessory='DisclosureIndicator'
          onPress={this.openEmail}
        />
      </Section>
    )
  }
}
