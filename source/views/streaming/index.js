// @flow
/**
 * All About Olaf
 * Media page
 */

import React from 'react'

import {TabbedView, Tab} from '../components/tabbed-view'

import KSTOView from './radio'
// import WeeklyMovieView from './movie'
import WebcamsView from './webcams'

export default function MediaPage() {
  return (
    <TabbedView>
      <Tab
        id="KSTORadioView"
        title="KSTO"
        icon="radio"
        render={() => <KSTOView />}
      />

      {/*<Tab id='WeeklyMovieView' title='Weekly Movie' icon='film' render={() => <WeeklyMovieView />} />*/}

      <Tab
        id="LiveWebcamsView"
        title="Webcams"
        icon="videocam"
        render={() => <WebcamsView />}
      />
    </TabbedView>
  )
}
