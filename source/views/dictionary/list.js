// @flow

import React from 'react'
import {StyleSheet, RefreshControl, Platform} from 'react-native'
import {StyledAlphabetListView} from '../components/alphabet-listview'
import debounce from 'lodash/debounce'
import {Column} from '../components/layout'
import {
  Detail,
  Title,
  ListRow,
  ListSectionHeader,
  ListSeparator,
} from '../components/list'
import delay from 'delay'
import {reportNetworkProblem} from '../../lib/report-network-problem'
import type {WordType} from './types'
import type {TopLevelViewPropsType} from '../types'
import {tracker} from '../../analytics'
import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import uniq from 'lodash/uniq'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import isString from 'lodash/isString'
import * as defaultData from '../../../docs/dictionary.json'
import {SearchBar} from '../components/searchbar'

const GITHUB_URL = 'https://stodevx.github.io/AAO-React-Native/dictionary.json'
const ROW_HEIGHT = Platform.OS === 'ios' ? 76 : 89
const LIST_HEADER_HEIGHT = Platform.OS === 'ios' ? 42 : 0
const SECTION_HEADER_HEIGHT = Platform.OS === 'ios' ? 33 : 41

const splitToArray = (str: string) => words(deburr(str.toLowerCase()))

const termToArray = (term: WordType) =>
  uniq([...splitToArray(term.word), ...splitToArray(term.definition)])

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  row: {
    height: ROW_HEIGHT,
  },
  rowSectionHeader: {
    height: SECTION_HEADER_HEIGHT,
  },
  rowDetailText: {
    fontSize: 14,
  },
})

type Props = TopLevelViewPropsType

type State = {
  results: {[key: string]: Array<WordType>},
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
  }

  componentWillMount() {
    this.refresh()
  }

  refresh = async () => {
    const start = Date.now()
    this.setState(() => ({loading: true}))

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    const elapsed = Date.now() - start
    if (elapsed < 500) {
      await delay(500 - elapsed)
    }

    this.setState(() => ({loading: false}))
  }

  fetchData = async () => {
    let {data: allTerms} = await fetchJson(GITHUB_URL).catch(err => {
      reportNetworkProblem(err)
      return defaultData
    })

    if (process.env.NODE_ENV === 'development') {
      allTerms = defaultData.data
    }

    this.setState(() => ({allTerms}))
  }

  onPressRow = (data: WordType) => {
    tracker.trackEvent('dictionary', data.word)
    this.props.navigation.navigate('DictionaryDetailView', {item: data})
  }

  renderRow = ({item}: {item: WordType}) =>
    <ListRow
      onPress={() => this.onPressRow(item)}
      contentContainerStyle={styles.row}
      arrowPosition="none"
    >
      <Column>
        <Title lines={1}>{item.word}</Title>
        <Detail lines={2} style={styles.rowDetailText}>
          {item.definition}
        </Detail>
      </Column>
    </ListRow>

  renderListHeader = () =>
    <SearchBar
      getRef={ref => (this.searchBar = ref)}
      onChangeText={this.performSearch}
      // if we don't use the arrow function here, searchBar ref is null...
      onSearchButtonPress={() => this.searchBar.unFocus()}
    />

  renderHeader = ({title}: {title: string}) =>
    <ListSectionHeader title={title} style={styles.rowSectionHeader} />

  renderSeparator = (sectionId: string, rowId: string) =>
    <ListSeparator key={`${sectionId}-${rowId}`} />

  _performSearch = (text: string) => {
    // Android clear button returns an object
    if (!isString(text)) {
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
    const refreshControl = (
      <RefreshControl
        refreshing={this.state.loading}
        onRefresh={this.refresh}
      />
    )

    return (
      <StyledAlphabetListView
        style={styles.wrapper}
        data={groupBy(this.state.results, item => head(item.word))}
        cell={this.renderRow}
        cellHeight={
          ROW_HEIGHT +
          (Platform.OS === 'ios' ? 11 / 12 * StyleSheet.hairlineWidth : 0)
        }
        header={this.renderListHeader}
        headerHeight={
          Platform.OS === 'ios'
            ? LIST_HEADER_HEIGHT + StyleSheet.hairlineWidth * 12
            : 0
        }
        sectionHeader={this.renderHeader}
        refreshControl={refreshControl}
        sectionHeaderHeight={SECTION_HEADER_HEIGHT}
        showsVerticalScrollIndicator={false}
        renderSeparator={this.renderSeparator}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="never"
      />
    )
  }
}
