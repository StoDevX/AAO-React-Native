// @flow
/**
 * All About Olaf
 * Media page
 */

import React from 'react'
import {StyleSheet} from 'react-native'

import {TabbedView, Tab} from '../components/tabbed-view'

import KSTOView from './radio'
// import WeeklyMovieView from './movie'
import WebcamsView from './webcams'

export default function MediaPage() {
  return (
    <TabbedView style={styles.container}>
      <Tab id="KSTORadioView" title="KSTO" icon="radio">
        {() => <KSTOView />}
      </Tab>

      {/*<Tab id='WeeklyMovieView' title='Weekly Movie' icon='film'>
        {() => <WeeklyMovieView />}
      </Tab>*/}

      <Tab id="LiveWebcamsView" title="Webcams" icon="videocam">
        {() => <WebcamsView />}
      </Tab>
    </TabbedView>
  )
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
