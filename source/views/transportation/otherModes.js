// @flow
import React from 'react'
import {
  Text,
  StyleSheet,
  View,
  Linking,
} from 'react-native'
import type {OtherModeType} from './types'
import {data as modes} from '../../../docs/transportation.json'
import * as c from '../components/colors'
import {Button} from '../components/button'
import SimpleListView from '../components/listview'
import {tracker} from '../../analytics'

let styles = StyleSheet.create({
  container: {
    backgroundColor: c.white,
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
  },
  mode: {
    borderWidth: 5,
    borderTopWidth: 1,
    borderColor: c.iosLightBackground,
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

export default function OtherModesView() {
  return (
    <SimpleListView
      contentContainerStyle={styles.container}
      forceBottomInset={true}
      data={modes}
    >
      {(data: OtherModeType) =>
        <View style={styles.mode}>
          <Text style={styles.title}>{data.name}</Text>
          <Text style={styles.content}>{data.description}</Text>
          <Button
            title='More info'
            onPress={() => Linking.openURL(data.url).catch(err => {
              tracker.trackException(err.message)
              console.error('An error occurred', err)
            })}
            style={styles.button}
          />
        </View>}
    </SimpleListView>
  )
}
