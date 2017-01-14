// @flow
/**
 * All About Olaf
 * Dictionary page
 */
import React from 'react'
import {StyleSheet, Platform} from 'react-native'
import {StyledAlphabetListView} from '../components/alphabet-listview'
import {Column} from '../components/layout'
import {Detail, Title, ListRow, ListSectionHeader, ListSeparator} from '../components/list'
import type {WordType} from './types'
import {tracker} from '../../analytics'
import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import {data as terms} from '../../docs/dictionary.json'

const rowHeight = Platform.OS === 'ios' ? 76 : 89
const headerHeight = Platform.OS === 'ios' ? 33 : 41

const styles = StyleSheet.create({
  row: {
    height: rowHeight,
  },
  rowSectionHeader: {
    height: headerHeight,
  },
})

export class DictionaryView extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.object.isRequired,
    route: React.PropTypes.object.isRequired,
  };

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
        arrowPosition='none'
      >
        <Column>
          <Title lines={1}>{item.word}</Title>
          <Detail lines={2} style={{fontSize: 14}}>{item.definition}</Detail>
        </Column>
      </ListRow>
    )
  }

  renderHeader = ({title}: {title: string}) => {
    return (
      <ListSectionHeader
        title={title}
        style={styles.rowSectionHeader}
      />
    )
  }

  renderSeparator = (sectionId: string, rowId: string) => {
    return <ListSeparator key={`${sectionId}-${rowId}`} />
  }

  render() {
    return (
      <StyledAlphabetListView
        data={groupBy(terms, item => head(item.word))}
        cell={this.renderRow}
        // just setting cellHeight sends the wrong values on iOS.
        cellHeight={rowHeight + (Platform.OS === 'ios' ? (11/12 * StyleSheet.hairlineWidth) : 0)}
        sectionHeader={this.renderHeader}
        sectionHeaderHeight={headerHeight}
        showsVerticalScrollIndicator={false}
        renderSeparator={this.renderSeparator}
      />
    )
  }
}
