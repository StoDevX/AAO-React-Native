// @flow

import React from 'react'
import {View, Text} from 'react-native'
import {Card} from '../components/card'
import {Button} from '../components/button'
import deviceInfo from 'react-native-device-info'
import networkInfo from 'react-native-network-info'

const getIpAddress = () =>
  new Promise(resolve => {
    try {
      networkInfo.getIPAddress(resolve)
    } catch (err) {
      resolve(null)
    }
  })

const getPosition = (args = {}) =>
  new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(resolve, () => resolve({}), {
      ...args,
      enableHighAccuracy: true,
      maximumAge: 1000 /*ms*/,
      timeout: 5000 /*ms*/,
    })
  })

const collectData = async () => ({
  id: deviceInfo.getUniqueID(),
  brand: deviceInfo.getBrand(),
  model: deviceInfo.getModel(),
  deviceKind: deviceInfo.getDeviceId(),
  os: deviceInfo.getSystemName(),
  osVersion: deviceInfo.getSystemVersion(),
  appVersion: deviceInfo.getReadableVersion(),
  ua: deviceInfo.getUserAgent(),
  ip: await getIpAddress(),
})

function reportToServer(data) {
  // return fetch('https://www.stolaf.edu/apps/aao/wifi.cfm?fuseaction=Submit', {
  //   method: 'POST',
  //   body: JSON.stringify(data),
  // })
}

export class ReportWifiProblemView extends React.Component {
  state = {
    status: '',
    data: null,
  }

  start = async () => {
    this.setState(() => ({status: 'Collecting data…'}))
    const [pos, dev] = await Promise.all([getPosition(), collectData()])
    this.setState(() => ({status: 'Reporting data…'}))
    await reportToServer({pos, dev})
    this.setState(() => ({data: {...pos, ...dev}}))
    this.setState(() => ({status: 'Thanks!'}))
  }

  render() {
    return (
      <View>
        <Card header="Report a WiFi Problem!" footer={this.state.status}>
          <Button
            disabled={this.state.status !== ''}
            onPress={this.start}
            title="Report"
          />
          <Text>
            {this.state.data && JSON.stringify(this.state.data, null, 2)}
          </Text>
        </Card>
      </View>
    )
  }
}
