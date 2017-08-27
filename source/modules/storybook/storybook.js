// @flow
/* eslint-disable no-await-in-loop */

import React from 'react'
import {
  Button,
  Dimensions,
  Picker,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native'

import delay from 'delay'
import {takeSnapshot, dirs} from 'react-native-view-shot'
import get from 'lodash/get'
import flatten from 'lodash/flatten'
import toPairs from 'lodash/toPairs'

import * as c from '../../components/colors'
import {views} from './views'

// this ensures that enough items have rendered to make a screenshot
// worthwhile
import {StyledAlphabetListView} from '../../components/alphabet-listview'
StyledAlphabetListView.initialListSize = 18

const {DocumentDir} = dirs
const outputDir = `${DocumentDir}/aao-view-shots`

export class StorybookView extends React.Component {
  static navigationOptions = {
    title: 'Snapshot Time',
  }

  _ref: any

  state = {
    viewPath: 'streaming.radio',
  }

  saveSnapshot = () => {
    const name = this.state.viewPath
    return takeSnapshot(this._ref, {
      format: 'png',
      path: `${outputDir}/${name}.png`,
    }).then(
      uri => console.log('saved to', uri),
      err => console.error('snapstho failed', err),
    )
  }

  saveAll = async () => {
    for (const [parent, child] of this.viewsAsList()) {
      const viewPath = `${parent}.${child}`
      const args = get(views, viewPath)

      this.setState({viewPath})
      await delay(args.delay || 1000)
      await this.saveSnapshot()
    }
  }

  viewsAsList = () => {
    // goes from {name: {inner: {}}} to [[name, inner]]
    const choices = toPairs(views).map(([key, val]) =>
      toPairs(val).map(([innerKey]) => [key, innerKey]),
    )

    return flatten(choices)
  }

  onChangeView = (value: string) => {
    this.setState({viewPath: value})
  }

  render() {
    const selected = get(views, this.state.viewPath, {})

    const options = this.viewsAsList().map(([parent, child]) =>
      <Picker.Item
        key={`${parent}.${child}`}
        label={`${parent} ❯ ${child}`}
        value={`${parent}.${child}`}
      />,
    )

    const height = Dimensions.get('window').height
    const heightDiff = Platform.OS === 'ios' ? 64 : 56

    const childStyle = {
      height: height - heightDiff,
    }

    return (
      <ScrollView style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.settings}>
          <Picker
            onValueChange={this.onChangeView}
            selectedValue={this.state.viewPath}
          >
            {options}
          </Picker>

          <View style={styles.buttonBar}>
            <Button onPress={this.saveSnapshot} title="Snapshot" />
            <Button onPress={this.saveAll} title="Run All" />
          </View>
        </View>

        <View
          ref={ref => (this._ref = ref)}
          style={[styles.viewContainer, childStyle]}
        >
          {selected.view()}
        </View>
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  settings: {
    backgroundColor: c.white,
  },
  buttonBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  viewContainer: {
    ...Platform.select({
      ios: {
        backgroundColor: c.iosLightBackground,
      },
      android: {
        backgroundColor: c.androidLightBackground,
      },
    }),
  },
})
