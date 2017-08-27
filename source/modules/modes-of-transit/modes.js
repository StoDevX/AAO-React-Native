// @flow
import React from 'react'
import {StyleSheet, Text, View, FlatList} from 'react-native'
import type {OtherModeType} from './types'
import {data as modes} from '../../../docs/transportation.json'
import * as c from '../../components/colors'
import {Button} from '../../components/button'
import {trackedOpenUrl} from '../../components/open-url'

const styles = StyleSheet.create({
  container: {
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
  },
  mode: {
    borderWidth: 5,
    borderTopWidth: 1,
    borderColor: c.iosLightBackground,
  },
})

class OtherModeCard extends React.PureComponent {
  props: {
    data: OtherModeType,
  }

  _onPress = () => {
    const {data} = this.props
    const modeName = data.name.replace(' ', '')
    return trackedOpenUrl({
      url: data.url,
      id: `Transportation_OtherModes_${modeName}View`,
    })
  }

  render() {
    const {data} = this.props
    return (
      <View style={styles.mode}>
        <Text selectable={true} style={styles.title}>
          {data.name}
        </Text>
        <Text selectable={true} style={styles.content}>
          {data.description}
        </Text>
        <Button onPress={this._onPress} title="More info" />
      </View>
    )
  }
}

export class ModesOfTransit extends React.PureComponent {
  renderItem = ({item}: {item: OtherModeType}) => <OtherModeCard data={item} />

  keyExtractor = (item: OtherModeType) => item.name

  render() {
    return (
      <FlatList
        contentContainerStyle={styles.container}
        keyExtractor={this.keyExtractor}
        renderItem={this.renderItem}
        data={modes}
      />
    )
  }
}
