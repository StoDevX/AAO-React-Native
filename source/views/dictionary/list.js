// @flow
/**
 * All About Olaf
 * Dictionary page
 */
import React from 'react'
import {StyleSheet, View, Platform} from 'react-native'
import {StyledAlphabetListView} from '../components/alphabet-listview'
import {Column} from '../components/layout'
import {
  Detail,
  Title,
  ListRow,
  ListSectionHeader,
  ListSeparator,
} from '../components/list'
import LoadingView from '../components/loading'
import type {WordType} from './types'
import {tracker} from '../../analytics'
import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import uniq from 'lodash/uniq'
import words from 'lodash/words'
import deburr from 'lodash/deburr'
import {data as terms} from '../../../docs/dictionary.json'
import {SearchBar} from '../components/searchbar'

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

export class DictionaryView extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.object.isRequired,
    route: React.PropTypes.object.isRequired,
  }

  state: {
    results: {[key: string]: Array<WordType>},
    hideClear: boolean,
  } = {
    results: terms,
    hideClear: true,
  }

  onPressRow = (data: WordType) => {
    tracker.trackEvent('dictionary', data.word)
    this.props.navigator.push({
      id: 'DictionaryDetailView',
      index: this.props.route.index + 1,
      title: data.word,
      backButtonTitle: 'Dictionary',
      props: {item: data},
    })
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
            {item.definition.trim()}
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

  performSearch = (text: string) => {
    const query = text.toLowerCase()
    this.setState(() => ({
      results: terms.filter(term =>
        this.termToArray(term)
          .some(word => word.startsWith(query))),
    }))
  }

  searchBar: any

  render() {
    if (!terms) {
      return <LoadingView />
    }

    return (
      <View style={styles.wrapper}>
        <SearchBar
          getRef={ref => this.searchBar = ref}
          onChangeText={this.performSearch}
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
        />
      </View>
    )
  }
}
