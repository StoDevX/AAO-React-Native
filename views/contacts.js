/**
 * All About Olaf
 * iOS Contact page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  ListView,
} from 'react-native'

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
      dataSource: ds.cloneWithRows(numbers),
    }
  }

  _rowHasChanged(r1, r2) {
    return r1.title !== r2.title
  }

  _renderRow(data) {
    return (
      <ContactCard title={data.title} text={data.text} phoneNumber={data.phoneNumber} buttonText={data.buttonText} />
    )
  }

  render() {
    return (
      <View style={styles.container}>
        <ListView
          renderRow={this._renderRow.bind(this)}
          dataSource={this.state.dataSource}
        />
      </View>
    )
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.iosLightBackground,
  },
  scrollView: {

  },
})
