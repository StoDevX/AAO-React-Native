// @flow
import React from 'react'
import {Alert} from 'react-native'
import {Section} from 'react-native-tableview-simple'
import type {TopLevelViewPropsType} from '../../types'
import Communications from 'react-native-communications'
import DeviceInfo from 'react-native-device-info'
import {PushButtonCell} from '../components/push-button'
import {refreshApp} from '../../../lib/refresh'

export default class SupportSection extends React.Component {
  props: TopLevelViewPropsType

  onPressButton = (id: string, title: string) => {
    this.props.navigator.push({
      id: id,
      title: title,
      index: this.props.route.index + 1,
    })
  }

  getDeviceInfo = () => `

      ----- Please do not edit below here -----
      ${DeviceInfo.getBrand()} ${DeviceInfo.getModel()}
      ${DeviceInfo.getDeviceId()}
      ${DeviceInfo.getSystemName()} ${DeviceInfo.getSystemVersion()}
      ${DeviceInfo.getReadableVersion()}
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

  onFaqButton = () => this.onPressButton('FaqView', 'FAQs')

  onResetButton = () => {
    Alert.alert(
      'Reset Everything',
      'Are you sure you want to clear everything?',
      [
        {text: 'Nope!', style: 'cancel'},
        {
          text: 'Reset it!',
          style: 'destructive',
          onPress: () => refreshApp(),
        },
      ],
    )
  }

  render() {
    return (
      <Section header="SUPPORT">
        <PushButtonCell title="Contact Us" onPress={this.openEmail} />
        <PushButtonCell title="FAQs" onPress={this.onFaqButton} />
        <PushButtonCell title="Reset Everything" onPress={this.onResetButton} />
      </Section>
    )
  }
}
