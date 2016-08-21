import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Alert,
} from 'react-native'

import Button from 'react-native-button' // the button
import Communications from 'react-native-communications' // the phone call functions

import * as c from './colors'

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
  button: {
    backgroundColor: c.denim,
    width: 200,
    color: c.white,
    alignSelf: 'center',
    height: 30,
    paddingTop: 3,
    marginBottom: 10,
    marginTop: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  content: {
    marginBottom: 5,
    marginLeft: 10,
    marginRight: 10,
  },
})

export default function ContactCard({title, phoneNumber, text, buttonText}) {
  function formatNumber(phoneNumber: string) {
    let re = /\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})/g
    let subst = '($1) $2-$3'
    return phoneNumber.replace(re, subst)
  }

  function promptCall(buttonText: string, phoneNumber: string) {
    Alert.alert(
      buttonText,
      formatNumber(phoneNumber),
      [
          {text: 'Cancel', onPress: () => console.log('Call cancel pressed')},
          {text: 'Call', onPress: () => Communications.phonecall(phoneNumber, false)},
      ]
  )}

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.content}>{text}</Text>
      <Button
        onPress={() => promptCall(buttonText, phoneNumber)}
        style={styles.button}
      >
        {buttonText}
      </Button>
    </View>
  )
}
ContactCard.propTypes = {
  buttonText: React.PropTypes.string.isRequired,
  phoneNumber: React.PropTypes.string.isRequired,
  text: React.PropTypes.string.isRequired,
  title: React.PropTypes.string.isRequired,
}
