/**
 * All About Olaf
 * iOS Contact page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ListView,
} from 'react-native'

import Button from 'react-native-button'; // the button
import Communications from 'react-native-communications'; // the phone call functions
import {
  Card,
  CardImage,
  CardTitle,
  CardContent,
  CardAction,
} from 'react-native-card-view'; // this relies on the exoernal card library

import NavigatorScreen from './components/navigator-screen'
import ContactCard from './components/contactCard'

import * as c from './components/colors'


import numbers from '../data/contact-info'
export default class ContactView extends React.Component {
  constructor() {
    super()
    let ds = new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    })
    this.state = {
      dataSource: ds.cloneWithRows(numbers)
    }
  }

  _rowHasChanged(r1, r2) {
    return r1.title !== r2.title
  }

  render() {
    return <NavigatorScreen
      {...this.props}
      title="Contact"
      renderScene={this.renderScene.bind(this)}
    />
  }

  renderScene() {
    return (
      <View style={styles.container}>
        <ListView
        renderRow={this._renderRow.bind(this)}
          dataSource={this.state.dataSource}
        />
      </View>
    )
  }

  _renderRow(data) {
    return (
      <ContactCard title={data.title} text={data.text} phoneNumber={data.phoneNumber} buttonText={data.buttonText} />
    )
  }
}

var styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.iosLightBackground,
  },
  scrollView: {

  },
})
