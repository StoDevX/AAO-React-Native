/* eslint-disable camelcase */
/**
 * @flow
 * All About Olaf
 * News page
 */

import React from 'react'
import {TabNavigator} from '../components/tabbed-view'
import {TabBarIcon} from '../components/tabbar-icon'
import * as c from '../components/colors'

import NewsContainer from './news-container'

const StOlafTab = ({navigation}) =>
  <NewsContainer
    navigation={navigation}
    mode="wp-json"
    url="https://wp.stolaf.edu/wp-json/wp/v2/posts"
    query={{per_page: 10, _embed: true}}
    name="St. Olaf"
  />
StOlafTab.navigationOptions = {
  tabBarLabel: 'St. Olaf',
  tabBarIcon: TabBarIcon('school'),
}

const OlevilleTab = ({navigation}) =>
  <NewsContainer
    navigation={navigation}
    mode="wp-json"
    url="http://oleville.com/wp-json/wp/v2/posts/"
    query={{per_page: 10, _embed: true}}
    embedFeaturedImage={true}
    name="Oleville"
  />
OlevilleTab.navigationOptions = {
  tabBarLabel: 'Oleville',
  tabBarIcon: TabBarIcon('happy'),
}

const MessTab = ({navigation}) =>
  <NewsContainer
    navigation={navigation}
    mode="rss"
    url="http://manitoumessenger.com/feed/"
    name="The Mess"
  />
MessTab.navigationOptions = {
  tabBarLabel: 'The Mess',
  tabBarIcon: TabBarIcon('paper'),
}

const PoliticOleTab = ({navigation}) =>
  <NewsContainer
    navigation={navigation}
    mode="rss"
    url="http://oleville.com/politicole/feed/"
    name="PoliticOle"
  />
PoliticOleTab.navigationOptions = {
  tabBarLabel: 'PoliticOle',
  tabBarIcon: TabBarIcon('megaphone'),
}

const KstoTab = ({navigation}) =>
  <NewsContainer
    navigation={navigation}
    mode="wp-json"
    url="https://pages.stolaf.edu/ksto/wp-json/wp/v2/posts/"
    query={{per_page: 10, _embed: true}}
    name="KSTO"
  />
KstoTab.navigationOptions = {
  tabBarLabel: 'KSTO',
  tabBarIcon: TabBarIcon('radio'),
}

export default TabNavigator(
  {
    StOlafNewsView: {screen: StOlafTab},
    OlevilleNewsView: {screen: OlevilleTab},
    MessNewsView: {screen: MessTab},
    PoliticOleNewsView: {screen: PoliticOleTab},
    KstoNewsView: {screen: KstoTab},
  },
  {
    navigationOptions: {
      title: 'News',
    },
  },
)
