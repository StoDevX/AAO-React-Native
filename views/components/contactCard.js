import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Image,
} from 'react-native'

import Button from 'react-native-button'; // the button
import Communications from 'react-native-communications'; // the phone call functions
import {
  Card,
  CardImage,
  CardTitle,
  CardContent,
  CardAction
} from 'react-native-card-view'; // this relies on the exoernal card library

import NavigatorScreen from './navigator-screen'


var styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {

  },
  button: {

  },
  icon: {

  }
  })
export default class ContactCard extends React.Component {
  render() {
    return (
      <Card>
        <CardTitle>
          <Text style={styles.title}>{this.props.title}</Text>
        </CardTitle>
        <CardImage>
          <Image style={styles.icon} source={{uri: 'http://oleville.com/pause/wp-content/uploads/sites/12/2014/09/pizzaCut.png'}} />
        </CardImage>
        <CardContent>
          <Text>{this.props.text}</Text>
        </CardContent>
        <CardAction>
          <Button
            style={styles.button}
            onPress={() => Communications.phonecall(this.props.phoneNumber, false)}>
            {this.props.buttonText}
          </Button>
        </CardAction>
      </Card>
    )
  }
}
