/**
 * All About Olaf
 * Dictionary page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  TouchableHighlight,
  Text,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import AlphabetListView from 'react-native-alphabetlistview'

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
  textRows: {
    marginLeft: 20,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
    height: 70,
    flexDirection: 'column',
    flex: 1,
  },
  notLastRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#c8c7cc',
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
  rowSectionHeader: {
    backgroundColor: c.iosListSectionHeader,
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 20,
    height: 27,
    borderBottomWidth: 1,
    borderColor: '#ebebeb',
  },
  rowSectionHeaderText: {
    color: 'black',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  arrowIcon: {
    color: c.iosDisabledText,
    fontSize: 20,
    marginRight: 6,
    marginLeft: 4,
    marginTop: 8,
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
      <TouchableHighlight underlayColor={'#ebebeb'} onPress={() => this.onPressRow(item)}>
        <View style={[styles.row, !isLast && styles.notLastRow]}>
          <View style={[styles.textRows]}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.word}</Text>
            <Text style={styles.itemPreview} numberOfLines={2}>{item.definition}</Text>
          </View>
          <Icon style={[styles.arrowIcon]} name='ios-arrow-forward' />
        </View>
      </TouchableHighlight>
    )
  }

  renderHeader = ({title}) => {
    return (
      <View style={styles.rowSectionHeader}>
        <Text style={styles.rowSectionHeaderText}>{title}</Text>
      </View>
    )
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
