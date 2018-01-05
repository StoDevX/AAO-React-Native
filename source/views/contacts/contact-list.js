// @flow

import * as React from 'react'
import {SectionList, StyleSheet} from 'react-native'
import {ListSeparator, ListSectionHeader} from '../components/list'
import {ListEmpty} from '../components/list'
import {ContactRow} from './contact-row'
import delay from 'delay'
import {reportNetworkProblem} from '../../lib/report-network-problem'
import * as defaultData from '../../../docs/contact-info.json'
import groupBy from 'lodash/groupBy'
import toPairs from 'lodash/toPairs'
import * as c from '../components/colors'
import type {ContactType} from './types'
import type {TopLevelViewPropsType} from '../types'

const GITHUB_URL =
  'https://stodevx.github.io/AAO-React-Native/contact-info.json'

const groupContacts = (contacts: ContactType[]) => {
  const grouped = groupBy(contacts, c => c.category)
  return toPairs(grouped).map(([key, value]) => ({title: key, data: value}))
}

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: c.white,
  },
})

type Props = TopLevelViewPropsType

type State = {
  contacts: Array<ContactType>,
  loading: boolean,
  refreshing: boolean,
}

export class ContactsListView extends React.PureComponent<Props, State> {
  static navigationOptions = {
    title: 'Important Contacts',
    headerBackTitle: 'Contacts',
  }

  state = {
    contacts: defaultData.data,
    loading: true,
    refreshing: false,
  }

  componentWillMount() {
    this.fetchData().then(() => {
      this.setState(() => ({loading: false}))
    })
  }

  refresh = async (): any => {
    const start = Date.now()
    this.setState(() => ({refreshing: true}))

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    const elapsed = Date.now() - start
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }

    this.setState(() => ({refreshing: false}))
  }

  fetchData = async () => {
    let {data: contacts} = await fetchJson(GITHUB_URL).catch(err => {
      reportNetworkProblem(err)
      return defaultData
    })

    if (process.env.NODE_ENV === 'development') {
      contacts = defaultData.data
    }

    this.setState(() => ({contacts}))
  }

  onPressContact = (contact: ContactType) => {
    this.props.navigation.navigate('ContactsDetailView', {
      contact,
    })
  }

  renderSectionHeader = ({section: {title}}: any) => (
    <ListSectionHeader title={title} />
  )

  renderItem = ({item}: {item: ContactType}) => (
    <ContactRow contact={item} onPress={this.onPressContact} />
  )

  keyExtractor = (item: ContactType) => item.title

  render() {
    const groupedData = groupContacts(this.state.contacts)
    return (
      <SectionList
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={<ListEmpty mode="bug" />}
        data={groupedData}
        keyExtractor={this.keyExtractor}
        onRefresh={this.refresh}
        refreshing={this.state.refreshing}
        renderItem={this.renderItem}
        renderSectionHeader={this.renderSectionHeader}
        sections={groupedData}
        style={styles.listContainer}
      />
    )
  }
}
