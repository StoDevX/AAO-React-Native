/**
 * @flow
 * All About Olaf
 * iOS Contact page
 */

import React from 'react'
import {
  StyleSheet,
  ListView,
} from 'react-native'
import ContactCard from './card'
import {data as numbers} from '../../../docs/contact-info.json'

export default class ContactView extends React.Component {
  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: (r1, r2) => r1 !== r2,
    }).cloneWithRows(numbers),
  }

  render() {
    return (
      <ListView
        contentContainerStyle={styles.container}
        initialListSize={3}
        removeClippedSubviews={false}
        dataSource={this.state.dataSource}
        renderRow={data =>
          <ContactCard
            title={data.title}
            text={data.text}
            phoneNumber={data.phoneNumber}
            buttonText={data.buttonText}
          />}
      />
    )
  }
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
