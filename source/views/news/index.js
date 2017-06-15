/* eslint-disable camelcase */
/**
 * @flow
 * All About Olaf
 * News page
 */

import React from 'react'
import {TabNavigator} from '../components/tabbed-view'
import {TabBarIcon} from '../components/tabbar-icon'

import NewsContainer from './news-container'

export default TabNavigator(
  {
    StOlafNewsView: {
      screen: ({navigation}) =>
        <NewsContainer
          navigation={navigation}
          mode="wp-json"
          url="https://wp.stolaf.edu/wp-json/wp/v2/posts"
          query={{per_page: 10, _embed: true}}
          name="St. Olaf"
        />,
      navigationOptions: {
        tabBarLabel: 'St. Olaf',
        tabBarIcon: TabBarIcon('school'),
      },
    },

    OlevilleNewsView: {
      screen: ({navigation}) =>
        <NewsContainer
          navigation={navigation}
          mode="wp-json"
          url="http://oleville.com/wp-json/wp/v2/posts/"
          query={{per_page: 10, _embed: true}}
          embedFeaturedImage={true}
          name="Oleville"
        />,
      navigationOptions: {
        tabBarLabel: 'Oleville',
        tabBarIcon: TabBarIcon('happy'),
      },
    },

    MessNewsView: {
      screen: ({navigation}) =>
        <NewsContainer
          navigation={navigation}
          mode="rss"
          url="http://manitoumessenger.com/feed/"
          name="The Mess"
        />,
      navigationOptions: {
        tabBarLabel: 'The Mess',
        tabBarIcon: TabBarIcon('paper'),
      },
    },

    PoliticOleNewsView: {
      screen: ({navigation}) =>
        <NewsContainer
          navigation={navigation}
          mode="rss"
          url="http://oleville.com/politicole/feed/"
          name="PoliticOle"
        />,
      navigationOptions: {
        tabBarLabel: 'PoliticOle',
        tabBarIcon: TabBarIcon('megaphone'),
      },
    },

    KstoNewsView: {
      screen: ({navigation}) =>
        <NewsContainer
          navigation={navigation}
          mode="wp-json"
          url="https://pages.stolaf.edu/ksto/wp-json/wp/v2/posts/"
          query={{per_page: 10, _embed: true}}
          name="KSTO"
        />,
      navigationOptions: {
        tabBarLabel: 'KSTO',
        tabBarIcon: TabBarIcon('radio'),
      },
    },
  },
  {
    navigationOptions: {
      title: 'News',
    },
  },
)
