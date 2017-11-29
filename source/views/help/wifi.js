// @flow

import * as React from 'react'
import {ScrollView, Text} from 'react-native'
import {Card} from '../components/card'
import {Button} from '../components/button'
import deviceInfo from 'react-native-device-info'
import networkInfo from 'react-native-network-info'
import pkg from '../../../package.json'

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
  jsVersion: pkg.version,
  ua: deviceInfo.getUserAgent(),
  ip: await getIpAddress(),
})

function reportToServer(data) {
  return fetch(
    'https://www.stolaf.edu/apps/all-about-olaf/index.cfm?fuseaction=Submit',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  ).then(async r => {
    let text = await r.text()
    try {
      return JSON.parse(text)
    } catch (err) {
      return text
    }
  })
}

type Props = {}

type State = {
  status: string,
  data: ?any,
}

export class ReportWifiProblemView extends React.Component<Props, State> {
  state = {
    status: '',
    data: null,
  }

  start = async () => {
    this.setState(() => ({status: 'Collecting data…'}))
    const [position, device] = await Promise.all([getPosition(), collectData()])
    this.setState(() => ({status: 'Reporting data…'}))
    try {
      let data = {position, device, version: 1}
      let resp = await reportToServer(data)
      if (resp.status === 'success') {
        this.setState(() => ({data}))
        this.setState(() => ({status: 'Thanks!'}))
      } else {
        console.error(resp)
        this.setState(() => ({status: 'Server error'}))
      }
    } catch (err) {
      console.warn(err)
      this.setState(() => ({status: err.message}))
    }
  }

  render() {
    return (
      <ScrollView>
        <Card footer={this.state.status} header="Report a WiFi Problem!">
          <Button
            disabled={this.state.status !== ''}
            onPress={this.start}
            title="Report"
          />
          <Text>
            {this.state.data && JSON.stringify(this.state.data, null, 2)}
          </Text>
        </Card>
      </ScrollView>
    )
  }
}
