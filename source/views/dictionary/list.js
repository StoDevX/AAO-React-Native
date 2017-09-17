// @flow

import React from 'react'
import {StyleSheet, ScrollView, RefreshControl} from 'react-native'
import {AlphabetSectionList} from '../components/alphabet-sectionlist'
import debounce from 'lodash/debounce'
import {ListSectionHeader, ListSeparator} from '../components/list'
import delay from 'delay'
import {reportNetworkProblem} from '../../lib/report-network-problem'
import LoadingView from '../components/loading'
import type {WordType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {tracker} from '../../analytics'
import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import toPairs from 'lodash/toPairs'
import {DictionaryRow} from './row'
import {SearchBar} from '../components/searchbar'
import {NoticeView} from '../components/notice'
import * as defaultData from '../../../docs/dictionary.json'

const GITHUB_URL = 'https://stodevx.github.io/AAO-React-Native/dictionary.json'

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
})

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

  searchBar: any

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

  _performSearch = (text: string | Object) => {
    // Android clear button returns an object
    if (typeof text !== 'string') {
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

  // We need to make the search run slightly behind the UI,
  // so I'm slowing it down by 50ms. 0ms also works, but seems
  // rather pointless.
  performSearch = debounce(this._performSearch, 50)

  render() {
    if (this.state.loading) {
      return <LoadingView />
    }

    return (
      <ScrollView
        style={styles.wrapper}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="never"
        refreshControl={
          <RefreshControl
            onRefresh={this.refresh}
            refreshing={this.state.refreshing}
          />
        }
        //stickyHeaderIndices={[0]}
      >
        <SearchBar
          getRef={ref => (this.searchBar = ref)}
          onChangeText={this.performSearch}
          // if we don't use the arrow function here, searchBar ref is null...
          onSearchButtonPress={() => this.searchBar.unFocus()}
        />
        <AlphabetSectionList
          ItemSeparatorComponent={ListSeparator}
          ListEmptyComponent={<NoticeView text="No definitions." />}
          keyExtractor={this.keyExtractor}
          renderItem={this.renderItem}
          renderSectionHeader={this.renderSectionHeader}
          sections={groupEntries(this.state.results)}
          showsVerticalScrollIndicator={false}
        />
      </ScrollView>
    )
  }
}
