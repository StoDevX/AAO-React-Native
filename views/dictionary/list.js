// @flow
/**
 * All About Olaf
 * Dictionary page
 */

import React from 'react'
import {StyleSheet, View, Text, Platform} from 'react-native'
import {StyledAlphabetListView} from '../components/alphabet-listview'
import {ListRow} from '../components/list-row'
import {ListSectionHeader} from '../components/list-section-header'
import {ListSeparator} from '../components/list-separator'
import type {WordType} from './types'
import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import * as c from '../components/colors'

import {data as terms} from '../../docs/dictionary.json'

const rowHeight = Platform.OS === 'ios' ? 68 : 89
const headerHeight = Platform.OS === 'ios' ? 27 : 41

const styles = StyleSheet.create({
  row: {
    height: rowHeight,
  },
  rowSectionHeader: {
    height: headerHeight,
  },
  itemTitle: {
    color: c.black,
    fontWeight: '500',
    paddingBottom: 1,
    fontSize: 16,
    textAlign: 'left',
  },
  itemPreview: {
    color: c.iosDisabledText,
    fontSize: 13,
    textAlign: 'left',
  },
})

export class DictionaryView extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.object.isRequired,
    route: React.PropTypes.object.isRequired,
  };

  onPressRow = (data: WordType) => {
    this.props.navigator.push({
      id: 'DictionaryDetailView',
      index: this.props.route.index + 1,
      title: data.word,
      backButtonTitle: 'Dictionary',
      props: {item: data},
    })
  }

  renderRow = ({isLast, item}: {isLast: boolean, item: WordType}) => {
    return (
      <View>
        <ListRow
          onPress={() => this.onPressRow(item)}
          contentContainerStyle={styles.row}
          arrowPosition='top'
        >
          <Text style={styles.itemTitle} numberOfLines={1}>{item.word}</Text>
          <Text style={styles.itemPreview} numberOfLines={2}>{item.definition}</Text>
        </ListRow>
        {!isLast ? <ListSeparator /> : null}
      </View>
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
      />
    )
  }
}
