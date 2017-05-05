// @flow

import React from 'react'
import {StyleSheet, View, Text, Alert} from 'react-native'
import {Button} from '../components/button'
import Communications from 'react-native-communications'
import {tracker} from '../../analytics'

import * as c from '../components/colors'

let styles = StyleSheet.create({
  container: {
    marginLeft: 5,
    marginRight: 5,
    marginBottom: 5,
    backgroundColor: c.white,
  },
  title: {
    fontSize: 30,
    alignSelf: 'center',
    marginTop: 10,
  },
  content: {
    marginTop: 5,
    marginBottom: 5,
    marginLeft: 10,
    marginRight: 10,
  },
})

function formatNumber(phoneNumber: string) {
  let re = /\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})/g
  let subst = '($1) $2-$3'
  return phoneNumber.replace(re, subst)
}

function promptCall(buttonText: string, phoneNumber: string) {
  Alert.alert(buttonText, formatNumber(phoneNumber), [
    {text: 'Cancel', onPress: () => console.log('Call cancel pressed')},
    {text: 'Call', onPress: () => Communications.phonecall(phoneNumber, false)},
  ])
}

export default function ContactCard({
  title,
  phoneNumber,
  text,
  buttonText,
}: {
  title: string,
  phoneNumber: string,
  text: string,
  buttonText: string,
}) {
  return (
    <View style={styles.container}>
      <Text selectable={true} style={styles.title}>{title}</Text>
      <Text selectable={true} style={styles.content}>{text}</Text>
      <Button
        onPress={() => {
          tracker.trackScreenView(
            `ImportantContacts_${title.replace(' ', '')}View`,
          )
          promptCall(buttonText, phoneNumber)
        }}
        title={buttonText}
      />
    </View>
  )
}
