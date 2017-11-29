// @flow

import * as React from 'react'
import {StyleSheet, RefreshControl, Platform} from 'react-native'
import {SearchableAlphabetListView} from '../components/searchable-alphabet-listview'
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
import uniq from 'lodash/uniq'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import * as defaultData from '../../../docs/dictionary.json'

const GITHUB_URL = 'https://stodevx.github.io/AAO-React-Native/dictionary.json'
const ROW_HEIGHT = Platform.OS === 'ios' ? 76 : 89
const SECTION_HEADER_HEIGHT = Platform.OS === 'ios' ? 33 : 41

const splitToArray = (str: string) => words(deburr(str.toLowerCase()))

const termToArray = (term: WordType) =>
  uniq([...splitToArray(term.word), ...splitToArray(term.definition)])

const styles = StyleSheet.create({
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
  results: Array<WordType>,
  allTerms: Array<WordType>,
  refreshing: boolean,
}

export class DictionaryView extends React.PureComponent<Props, State> {
  static navigationOptions = {
    title: 'Campus Dictionary',
    headerBackTitle: 'Dictionary',
  }

  state = {
    results: defaultData.data,
    allTerms: defaultData.data,
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

  renderRow = ({item}: {item: WordType}) => (
    <ListRow
      arrowPosition="none"
      contentContainerStyle={styles.row}
      onPress={() => this.onPressRow(item)}
    >
      <Column>
        <Title lines={1}>{item.word}</Title>
        <Detail lines={2} style={styles.rowDetailText}>
          {item.definition}
        </Detail>
      </Column>
    </ListRow>
  )

  renderSectionHeader = ({title}: {title: string}) => (
    <ListSectionHeader style={styles.rowSectionHeader} title={title} />
  )

  renderSeparator = (sectionId: string, rowId: string) => (
    <ListSeparator key={`${sectionId}-${rowId}`} />
  )

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

  render() {
    const refreshControl = (
      <RefreshControl
        onRefresh={this.refresh}
        refreshing={this.state.refreshing}
      />
    )

    return (
      <SearchableAlphabetListView
        cell={this.renderRow}
        cellHeight={
          ROW_HEIGHT +
          (Platform.OS === 'ios' ? 11 / 12 * StyleSheet.hairlineWidth : 0)
        }
        data={groupBy(this.state.results, item => item.word[0])}
        onSearch={this.performSearch}
        refreshControl={refreshControl}
        renderSeparator={this.renderSeparator}
        sectionHeader={this.renderSectionHeader}
        sectionHeaderHeight={SECTION_HEADER_HEIGHT}
      />
    )
  }
}
