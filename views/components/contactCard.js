import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Alert,
} from 'react-native'

import {Button} from './button' // the button
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
  Alert.alert(
    buttonText,
    formatNumber(phoneNumber),
    [
        {text: 'Cancel', onPress: () => console.log('Call cancel pressed')},
        {text: 'Call', onPress: () => Communications.phonecall(phoneNumber, false)},
    ]
  )
}

export default function ContactCard({title, phoneNumber, text, buttonText}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.content}>{text}</Text>
      <Button
        onPress={() => promptCall(buttonText, phoneNumber)}
        title={buttonText}
      />
    </View>
  )
}
ContactCard.propTypes = {
  buttonText: React.PropTypes.string.isRequired,
  phoneNumber: React.PropTypes.string.isRequired,
  text: React.PropTypes.string.isRequired,
  title: React.PropTypes.string.isRequired,
}
