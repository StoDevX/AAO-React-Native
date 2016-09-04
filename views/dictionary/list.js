/**
 * All About Olaf
 * Dictionary page
 */

import React from 'react'
import {
  StyleSheet,
  View,
  ListView,
  TouchableHighlight,
  Text,
} from 'react-native'

import * as c from '../components/colors'

import terms from '../../data/dictionary.json'

let styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  row: {
    marginLeft: 20,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
  itemTitle: {
    color: c.black,
    fontWeight: '500',
    paddingBottom: 1,
    fontSize: 16,
    textAlign: 'left',
  },
  itemPreview: {
    color: c.iosText,
    fontSize: 13,
    textAlign: 'left',
  },
})

export class DictionaryView extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.object.isRequired,
    route: React.PropTypes.object.isRequired,
  };

  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    }).cloneWithRows(terms),
  }

  _rowHasChanged(r1, r2) {
    return r1.word !== r2.word
  }

  onPressRow = data => {
    this.props.navigator.push({
      id: 'DictionaryDetailView',
      index: this.props.route.index + 1,
      title: data.word,
      props: {item: data},
    })
  }

  _renderRow = data => {
    return (
      <TouchableHighlight underlayColor={'#ebebeb'} onPress={() => this.onPressRow(data)}>
        <View style={styles.row}>
          <Text style={styles.itemTitle} numberOfLines={1}>{data.word}</Text>
          <Text style={styles.itemPreview} numberOfLines={2}>{data.definition}</Text>
        </View>
      </TouchableHighlight>
    )
  }

  render() {
    return (
      <View style={styles.container}>
        <ListView
          dataSource={this.state.dataSource}
          renderRow={this._renderRow}
        />
      </View>
    )
  }
}
