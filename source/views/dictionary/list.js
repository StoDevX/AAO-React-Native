// @flow

import React from 'react'
import {Platform, StyleSheet} from 'react-native'
import {SearchableAlphabetSectionList} from '../components/alphabet-sectionlist'
import {ListSectionHeader, ListSeparator} from '../components/list'
import delay from 'delay'
import {reportNetworkProblem} from '../../lib/report-network-problem'
import LoadingView from '../components/loading'
import type {WordType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {tracker} from '../../analytics'
import fuzzysearch from 'fuzzysearch'
import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import toPairs from 'lodash/toPairs'
import {DictionaryRow} from './row'
import {NoticeView} from '../components/notice'
import * as defaultData from '../../../docs/dictionary.json'

const ITEM_HEIGHT = (Platform.OS === 'ios' ? 76 : 89) + StyleSheet.hairlineWidth
const HEADER_HEIGHT =
  (Platform.OS === 'ios' ? 33 : 41) + StyleSheet.hairlineWidth * 2
const GITHUB_URL = 'https://stodevx.github.io/AAO-React-Native/dictionary.json'

type Props = TopLevelViewPropsType

type State = {
  results: {[key: string]: Array<WordType>},
  allTerms: {[key: string]: Array<WordType>},
  loading: boolean,
  refreshing: boolean,
}
;[]

const splitToArray = (str: string) => words(deburr(str.toLowerCase()))

const termToArray = (term: WordType) =>
  Array.from(
    new Set([
      ...splitToArray(term.word.toLowerCase()),
      ...splitToArray(term.definition.toLowerCase()),
    ]),
  )

const groupEntries = entries => {
  const grouped = groupBy(entries, item => head(item.word))
  return toPairs(grouped).map(([key, value]) => ({
    title: key,
    data: value,
  }))
}

export class DictionaryView extends React.PureComponent<void, Props, State> {
  static navigationOptions = {
    title: 'Campus Dictionary',
    headerBackTitle: 'Dictionary',
  }

  state = {
    results: defaultData.data,
    allTerms: defaultData.data,
    loading: true,
    refreshing: false,
  }

  componentWillMount() {
    this.fetchData()
  }

  refresh = async () => {
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
    this.setState(() => ({loading: true}))

    let {data: allTerms} = await fetchJson(GITHUB_URL).catch(err => {
      reportNetworkProblem(err)
      return defaultData
    })

    if (process.env.NODE_ENV === 'development') {
      allTerms = defaultData.data
    }

    this.setState(() => ({allTerms, loading: false}))
  }

  onPressRow = (entry: WordType) => {
    tracker.trackEvent('dictionary', entry.word)
    this.props.navigation.navigate('DictionaryDetailView', {item: entry})
  }

  renderSectionHeader = ({section: {title}}: any) =>
    // the proper type is ({section: {title}}: {section: {title: string}})
    <ListSectionHeader title={title} />

  renderItem = ({item}: {item: WordType}) =>
    <DictionaryRow onPress={this.onPressRow} entry={item} />

  keyExtractor = (item: WordType) => item.word

  performSearch = (text: ?string) => {
    if (!text) {
      this.setState(state => ({results: state.allTerms}))
      return
    }

    const query = text.toLowerCase()
    this.setState(state => ({
      results: state.allTerms.filter(term =>
        termToArray(term).some(word => word.startsWith(query)),
      ),
    }))
  }

  getItemLayout = (data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })

  render() {
    if (this.state.loading) {
      return <LoadingView />
    }

    return (
      <SearchableAlphabetSectionList
        ItemSeparatorComponent={ListSeparator}
        ListEmptyComponent={<NoticeView text="No definitions." />}
        getItemLayout={this.getItemLayout}
        keyExtractor={this.keyExtractor}
        onRefresh={this.refresh}
        onSearch={this.performSearch}
        refreshing={this.state.refreshing}
        renderItem={this.renderItem}
        renderSectionHeader={this.renderSectionHeader}
        sections={groupEntries(this.state.results)}
      />
    )
  }
}
