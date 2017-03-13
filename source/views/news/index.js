/* eslint-disable camelcase */
/**
 * @flow
 * All About Olaf
 * News page
 */

import NewsContainer from './news-container'

import React from 'react'

import type {TopLevelViewPropsType} from '../types'
import TabbedView from '../components/tabbed-view'

export default function NewsPage({navigator, route}: TopLevelViewPropsType) {
  return (
    <TabbedView
      tabs={[
        {
          id: 'StOlafNewsView',
          title: 'St. Olaf',
          icon: 'school',
          component: () => (
            <NewsContainer
              navigator={navigator}
              route={route}
              mode="wp-json"
              url="https://wp.stolaf.edu/wp-json/wp/v2/posts"
              query={{per_page: 10, _embed: true}}
              name="St. Olaf"
            />
          ),
        },
        {
          id: 'OlevilleNewsView',
          title: 'Oleville',
          icon: 'happy',
          component: () => (
            <NewsContainer
              navigator={navigator}
              route={route}
              mode="wp-json"
              url="http://oleville.com/wp-json/wp/v2/posts/"
              query={{per_page: 10, _embed: true}}
              embedFeaturedImage={true}
              name="Oleville"
            />
          ),
        },
        {
          id: 'MessNewsView',
          title: 'The Mess',
          icon: 'paper',
          component: () => (
            <NewsContainer
              navigator={navigator}
              route={route}
              mode="rss"
              url="http://manitoumessenger.com/feed/"
              name="The Mess"
            />
          ),
        },
        {
          id: 'PoliticOleNewsView',
          title: 'PoliticOle',
          icon: 'megaphone',
          component: () => (
            <NewsContainer
              navigator={navigator}
              route={route}
              mode="rss"
              url="http://oleville.com/politicole/feed/"
              name="PoliticOle"
            />
          ),
        },
        {
          id: 'KstoNewsView',
          title: 'KSTO',
          icon: 'radio',
          component: () => (
            <NewsContainer
              navigator={navigator}
              route={route}
              mode="wp-json"
              url="https://pages.stolaf.edu/ksto/wp-json/wp/v2/posts/"
              query={{per_page: 10, _embed: true}}
              name="KSTO"
            />
          ),
        },
      ]}
      navigator={navigator}
      route={route}
    />
  )
}
