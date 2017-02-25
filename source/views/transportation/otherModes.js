// @flow
import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import type {OtherModeType} from './types'
import {data as modes} from '../../../docs/transportation.json'
import * as c from '../components/colors'
import {Button} from '../components/button'
import SimpleListView from '../components/listview'
import openUrl from '../components/open-url'

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
            onPress={() => openUrl(data.url)}
            title='More info'
          />
        </View>}
    </SimpleListView>
  )
}
