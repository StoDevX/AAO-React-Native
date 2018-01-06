// @flow

import * as React from 'react'
import {ScrollView, Text} from 'react-native'
import {Card} from '../components/card'
import {Button} from '../components/button'
import deviceInfo from 'react-native-device-info'
import networkInfo from 'react-native-network-info'
import retry from 'p-retry'
import delay from 'delay'
import reportNetworkProblem from '../../lib/report-network-problem'
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
  dateRecorded: new Date().toJSON(),
})

function reportToServer(data) {
  const url =
    'https://www.stolaf.edu/apps/all-about-olaf/index.cfm?fuseaction=Submit'
  return fetch(url, {method: 'POST', body: JSON.stringify(data)})
}

type Props = {}

type State = {
  status: string,
}

export class ReportWifiProblemView extends React.Component<Props, State> {
  state = {
    status: '',
  }

  start = async () => {
    this.setState(() => ({status: 'Collecting data…'}))
    const [position, device] = await Promise.all([getPosition(), collectData()])
    this.setState(() => ({status: 'Reporting data…'}))
    try {
      let data = {position, device, version: 1}
      await retry(() => reportToServer(data), {retries: 10})
      await delay(1000)
      this.setState(() => ({status: 'Thanks!'}))
    } catch (err) {
      reportNetworkProblem(err)
      this.setState(() => ({
        status: 'Apologies; there was an error. Please try again later.',
      }))
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
        </Card>
      </ScrollView>
    )
  }
}
