// @flow
/**
 * All About Olaf
 * Media page
 */

import React from 'react'

import TabbedView from '../components/tabbed-view'

import KSTOView from './radio'
// import WeeklyMovieView from './movie'
import WebcamsView from './webcams'

export default function MediaPage() {
  return (
    <TabbedView
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
