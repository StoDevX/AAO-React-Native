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

const StOlafTab = ({navigation}) =>
  <NewsContainer
    navigation={navigation}
    mode="wp-json"
    url="https://wp.stolaf.edu/wp-json/wp/v2/posts"
    query={{per_page: 10, _embed: true}}
    name="St. Olaf"
  />

const OlevilleTab = ({navigation}) =>
  <NewsContainer
    navigation={navigation}
    mode="wp-json"
    url="http://oleville.com/wp-json/wp/v2/posts/"
    query={{per_page: 10, _embed: true}}
    embedFeaturedImage={true}
    name="Oleville"
  />

const MessTab = ({navigation}) =>
  <NewsContainer
    navigation={navigation}
    mode="rss"
    url="http://manitoumessenger.com/feed/"
    name="The Mess"
  />

const PoliticOleTab = ({navigation}) =>
  <NewsContainer
    navigation={navigation}
    mode="rss"
    url="http://oleville.com/politicole/feed/"
    name="PoliticOle"
  />

const KstoTab = ({navigation}) =>
  <NewsContainer
    navigation={navigation}
    mode="wp-json"
    url="https://pages.stolaf.edu/ksto/wp-json/wp/v2/posts/"
    query={{per_page: 10, _embed: true}}
    name="KSTO"
  />

export default TabNavigator(
  {
    StOlafNewsView: {
      screen: StOlafTab,
      navigationOptions: {
        tabBarLabel: 'St. Olaf',
        tabBarIcon: TabBarIcon('school'),
      },
    },
    OlevilleNewsView: {
      screen: OlevilleTab,
      navigationOptions: {
        tabBarLabel: 'Oleville',
        tabBarIcon: TabBarIcon('happy'),
      },
    },
    MessNewsView: {
      screen: MessTab,
      navigationOptions: {
        tabBarLabel: 'The Mess',
        tabBarIcon: TabBarIcon('paper'),
      },
    },
    PoliticOleNewsView: {
      screen: PoliticOleTab,
      navigationOptions: {
        tabBarLabel: 'PoliticOle',
        tabBarIcon: TabBarIcon('megaphone'),
      },
    },
    KstoNewsView: {
      screen: KstoTab,
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
