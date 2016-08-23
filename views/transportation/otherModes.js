// @flow
import React from 'react'
import {
  Text,
  StyleSheet,
  View,
  ListView,
  Linking,
} from 'react-native'
import type {OtherModeType} from './types'
import modes from '../../data/transportation.json'
import * as c from '../components/colors'
import Button from 'react-native-button' // the button

let styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 49,
    alignItems: 'center',
    backgroundColor: c.iosLightBackground,
  },
  row: {
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: c.white,
  },
  title: {
    fontSize: 30,
    alignSelf: 'center',
    marginTop: 10,
  },
  content: {
    marginBottom: 5,
    marginLeft: 10,
    marginRight: 10,
    textAlign: 'center',
  },
  button: {
    backgroundColor: c.denim,
    width: 200,
    color: c.white,
    alignSelf: 'center',
    height: 30,
    paddingTop: 3,
    marginBottom: 10,
    marginTop: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
})

export default class OtherModesView extends React.Component {
  state = {
    dataSource: new ListView.DataSource({
      rowHasChanged: this._rowHasChanged,
    }).cloneWithRows(modes),
  }

  _rowHasChanged(r1: OtherModeType, r2: OtherModeType) {
    return r1.name !== r2.name
  }

  _renderRow(data: OtherModeType) {
    return (
      <View>
        <Text style={styles.title}>{data.name}</Text>
        <Text style={styles.content}>{data.description}</Text>
        <Button
          onPress={() => Linking.openURL(data.url).catch(err => console.error('An error occurred', err))}
          style={styles.button}>
          More info
        </Button>
      </View>
    )
  }

  render() {
    return (
      <ListView
        contentInset={{bottom: 49}}
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={styles.container}
        dataSource={this.state.dataSource}
        renderRow={this._renderRow.bind(this)}
      />
    )
  }
}
