/**
 * @flow
 * All About Olaf
 * Contact page
 */

import React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {ListSeparator, ListSectionHeader} from '../components/list'
import {ListEmpty, ListFooter} from '../components/list'
import {ContactRow} from './contact-row'
import {data} from './data'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import * as c from '../components/colors'
import type {ContactType} from './types'

const AAO_URL = 'https://github.com/StoDevX/AAO-React-Native/issues/new'

const groupContacts = (contacts: ContactType[]) => {
  const grouped = groupBy(contacts, c => c.category)
  return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
}

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: c.white,
  },
})

const listFooter =
  <ListFooter
    title="Collected by the humans of All About Olaf"
    href={AAO_URL}
  />

export default class ContactsListView extends React.PureComponent {
  static navigationOptions = {
    title: 'Important Contacts',
    headerBackTitle: 'Contacts',
  }

  onPressContact = (contact: ContactType) => {
    this.props.navigation.navigate('ContactsDetailView', {
      contact,
    })
  }

  renderSeparator = () => <ListSeparator />

  renderSectionHeader = ({section: {title}}: any) =>
    <ListSectionHeader title={title} spacing={{left: 10}} />

  renderItem = ({item}: {item: ContactType}) =>
    <ContactRow contact={item} onPress={this.onPressContact} />

  keyExtractor = (item: ContactType) => {
    return item.title
  }

  render() {
    const groupedData = groupContacts(data)
    return (
      <SectionList
        ItemSeparatorComponent={this.renderSeparator}
        ListEmptyComponent={<ListEmpty mode="bug" />}
        ListFooterComponent={listFooter}
        style={styles.listContainer}
        data={groupedData}
        sections={groupedData}
        keyExtractor={this.keyExtractor}
        renderSectionHeader={this.renderSectionHeader}
        renderItem={this.renderItem}
      />
    )
  }
}
