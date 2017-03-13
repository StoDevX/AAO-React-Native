// @flow
/**
 * All About Olaf
 * Media page
 */

import React from 'react'
import {StyleSheet} from 'react-native'

import TabbedView from '../components/tabbed-view'

import KSTOView from './radio'
// import WeeklyMovieView from './movie'
import WebcamsView from './webcams'

export default function MediaPage() {
  return (
    <TabbedView
      style={styles.container}
      tabs={[
        {
          id: 'KSTORadioView',
          title: 'KSTO',
          icon: 'radio',
          component: () => <KSTOView />,
        },
        // {
        //   id: 'WeeklyMovieView',
        //   title: 'Weekly Movie',
        //   icon: 'film',
        //   component: () => <WeeklyMovieView />,
        // },
        {
          id: 'LiveWebcamsView',
          title: 'Webcams',
          icon: 'videocam',
          component: () => <WebcamsView />,
        },
      ]}
    />
  )
}

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
})
