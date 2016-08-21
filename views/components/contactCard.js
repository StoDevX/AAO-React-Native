import React from 'react'
import {
  StyleSheet,
  View,
  Text,
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
  console.log(title)
  console.log(phoneNumber)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.content}>{text}</Text>
      <Button
        onPress={() => Communications.phonecall(phoneNumber, false)}
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
