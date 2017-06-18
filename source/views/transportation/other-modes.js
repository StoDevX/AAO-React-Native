// @flow
import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {TabBarIcon} from '../components/tabbar-icon'
import type {OtherModeType} from './types'
import {data as modes} from '../../../docs/transportation.json'
import * as c from '../components/colors'
import {Button} from '../components/button'
import SimpleListView from '../components/listview'
import {trackedOpenUrl} from '../components/open-url'

let styles = StyleSheet.create({
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

export default function OtherModesView() {
  return (
    <SimpleListView contentContainerStyle={styles.container} data={modes}>
      {(data: OtherModeType) =>
        <View style={styles.mode}>
          <Text selectable={true} style={styles.title}>{data.name}</Text>
          <Text selectable={true} style={styles.content}>
            {data.description}
          </Text>
          <Button
            onPress={() => {
              const modeName = data.name.replace(' ', '')
              return trackedOpenUrl({
                url: data.url,
                id: `Transportation_OtherModes_${modeName}View`,
              })
            }}
            title="More info"
          />
        </View>}
    </SimpleListView>
  )
}
OtherModesView.navigationOptions = {
  tabBarLabel: 'Other Modes',
  tabBarIcon: TabBarIcon('boat'),
}
