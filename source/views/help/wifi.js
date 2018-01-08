// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import glamorous from 'glamorous-native'
import {Card} from '../components/card'
import {Button} from '../components/button'
import deviceInfo from 'react-native-device-info'
import networkInfo from 'react-native-network-info'
import retry from 'p-retry'
import delay from 'delay'
import {reportNetworkProblem} from '../../lib/report-network-problem'
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
  error: ?string,
  status: 'init' | 'collecting' | 'reporting' | 'done' | 'error',
}

export class ReportWifiProblemView extends React.Component<Props, State> {
  state = {
    error: null,
    status: 'init',
  }

  start = async () => {
    this.setState(() => ({status: 'collecting', error: ''}))
    const [position, device] = await Promise.all([getPosition(), collectData()])
    this.setState(() => ({status: 'reporting'}))
    try {
      let data = {position, device, version: 1}
      await retry(() => reportToServer(data), {retries: 10})
      await delay(1000)
      this.setState(() => ({status: 'done'}))
    } catch (err) {
      reportNetworkProblem(err)
      this.setState(() => ({
        error: 'Apologies; there was an error. Please try again later.',
        status: 'error',
      }))
    }
  }

  render() {
    const buttonEnabled =
      this.state.status === 'init' || this.state.status === 'error'

    let buttonMessage = 'Error'
    if (this.state.status === 'init') {
      buttonMessage = 'Report'
    } else if (this.state.status === 'collecting') {
      buttonMessage = 'Collecting data…'
    } else if (this.state.status === 'reporting') {
      buttonMessage = 'Reporting data…'
    } else if (this.state.status === 'done') {
      buttonMessage = 'Thanks!'
    } else if (this.state.status === 'error') {
      buttonMessage = 'Try again?'
    } else {
      ;(this.state.status: empty)
    }

    return (
      <Card style={styles.card}>
        <Title selectable={true}>Report a Wi-Fi Problem</Title>
        <Description selectable={true}>
          If you are having an issue connecting to any of the St. Olaf College
          Wi-Fi networks, please tap the button below.
        </Description>
        <Description selectable={true}>
          This information is anonymous, and we do not collect usernames. We
          will record your current location and some general information about
          the device you are using, then send it to a server that IT maintains.
        </Description>
        <Description selectable={true} style={styles.lastParagraph}>
          The networking team can then use this information to identify where
          people are having issues!
        </Description>
        <Button
          disabled={!buttonEnabled}
          onPress={this.start}
          title={buttonMessage}
        />
      </Card>
    )
  }
}

const Title = glamorous.text({
  fontWeight: '700',
  fontSize: 16,
  marginBottom: 10,
  textAlign: 'center',
})

const Description = glamorous.text({
  fontSize: 14,
  marginBottom: 10,
})

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  lastParagraph: {
    marginBottom: 0,
  },
})
