// @flow
/**
 * All About Olaf
 * Dictionary page
 */
import React from 'react'
import {StyleSheet, View, Platform} from 'react-native'
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
import LoadingView from '../components/loading'
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
const rowHeight = Platform.OS === 'ios' ? 76 : 89
const headerHeight = Platform.OS === 'ios' ? 33 : 41

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  row: {
    height: rowHeight,
  },
  rowSectionHeader: {
    height: headerHeight,
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

  onPressRow = (data: WordType) => {
    tracker.trackEvent('dictionary', data.word)
    this.props.navigation.navigate('DictionaryDetailView', {item: data})
  }

  renderRow = ({item}: {item: WordType}) => {
    return (
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
    )
  }

  renderHeader = ({title}: {title: string}) => {
    return <ListSectionHeader title={title} style={styles.rowSectionHeader} />
  }

  renderSeparator = (sectionId: string, rowId: string) => {
    return <ListSeparator key={`${sectionId}-${rowId}`} />
  }

  splitToArray = (str: string) => {
    return words(deburr(str.toLowerCase()))
  }

  termToArray = (term: WordType) => {
    return uniq([
      ...this.splitToArray(term.word),
      ...this.splitToArray(term.definition),
    ])
  }

  _performSearch = (text: string) => {
    // Android clear button returns an object
    if (!isString(text)) {
      this.setState(state => ({results: state.allTerms}))
      return
    }

    const query = text.toLowerCase()
    this.setState(state => ({
      results: state.allTerms.filter(term =>
        this.termToArray(term).some(word => word.startsWith(query)),
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
      <View style={styles.wrapper}>
        <SearchBar
          getRef={ref => (this.searchBar = ref)}
          onChangeText={this.performSearch}
          // if we don't use the arrow function here, searchBar ref is null...
          onSearchButtonPress={() => this.searchBar.unFocus()}
        />
        <StyledAlphabetListView
          data={groupBy(this.state.results, item => head(item.word))}
          cell={this.renderRow}
          // just setting cellHeight sends the wrong values on iOS.
          cellHeight={
            rowHeight +
            (Platform.OS === 'ios' ? 11 / 12 * StyleSheet.hairlineWidth : 0)
          }
          sectionHeader={this.renderHeader}
          sectionHeaderHeight={headerHeight}
          showsVerticalScrollIndicator={false}
          renderSeparator={this.renderSeparator}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="never"
        />
      </View>
    )
  }
}
