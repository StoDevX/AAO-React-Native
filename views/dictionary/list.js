/**
 * All About Olaf
 * Dictionary page
 */

import React from 'react'
import {StyleSheet, View, Text} from 'react-native'
import AlphabetListView from 'react-native-alphabetlistview'
import {ListRow} from '../components/list-row'
import {ListSectionHeader} from '../components/list-section-header'
import {ListSeparator} from '../components/list-separator'

import groupBy from 'lodash/groupBy'
import head from 'lodash/head'
import * as c from '../components/colors'

import {data as terms} from '../../docs/dictionary.json'

let styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  listView: {
    paddingRight: 16,
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
  row: {
    height: 70,
  },
  rowSectionHeader: {
    height: 27,
  },
})

export class DictionaryView extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.object.isRequired,
    route: React.PropTypes.object.isRequired,
  };

  onPressRow = data => {
    this.props.navigator.push({
      id: 'DictionaryDetailView',
      index: this.props.route.index + 1,
      title: data.word,
      backButtonTitle: 'Dictionary',
      props: {item: data},
    })
  }

  renderRow = ({isLast, item}) => {
    return (
      <View>
        <ListRow
          onPress={() => this.onPressRow(item)}
          style={{flexDirection: 'column'}}
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

  renderHeader = ({title}) => {
    return <ListSectionHeader text={title} style={styles.rowSectionHeader} />
  }

  render() {
    // console.error(groupBy(terms, item => head(item.word)))
    return (
      <View style={styles.container}>
        <AlphabetListView
          contentContainerStyle={styles.listView}
          data={groupBy(terms, item => head(item.word))}
          cell={this.renderRow}
          sectionHeader={this.renderHeader}
          sectionHeaderHeight={28}
          cellHeight={70}
          showsVerticalScrollIndicator={false}
        />
      </View>
    )
  }
}
