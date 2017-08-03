// @flow

import React from 'react'
import {StyleSheet, View, Text, Alert} from 'react-native'
import {Button} from '../components/button'
import {phonecall} from 'react-native-communications'
import {tracker} from '../../analytics'
import type {CardType} from './types'

import * as c from '../components/colors'

const styles = StyleSheet.create({
  container: {
    backgroundColor: c.white,
  },
  title: {
    fontSize: 30,
    alignSelf: 'center',
    marginTop: 10,
  },
  content: {
    marginHorizontal: 10,
  },
})

function formatNumber(phoneNumber: string) {
  const re = /(\d{3})-?(\d{3})-?(\d{4})/g
  return phoneNumber.replace(re, '($1) $2-$3')
}

function promptCall(buttonText: string, phoneNumber: string) {
  Alert.alert(buttonText, formatNumber(phoneNumber), [
    {text: 'Cancel', onPress: () => console.log('Call cancel pressed')},
    {text: 'Call', onPress: () => phonecall(phoneNumber, false)},
  ])
}

export class ContactCard extends React.PureComponent {
  props: CardType

  _onPress = () => {
    const {title, phoneNumber, buttonText} = this.props
    tracker.trackScreenView(`ImportantContacts_${title.replace(' ', '')}View`)
    promptCall(buttonText, phoneNumber)
  }

  render() {
    const {title, text, buttonText} = this.props

    return (
      <View style={styles.container}>
        <Text selectable={true} style={styles.title}>{title}</Text>
        <Text selectable={true} style={styles.content}>{text}</Text>
        <Button onPress={this._onPress} title={buttonText} />
      </View>
    )
  }
}
