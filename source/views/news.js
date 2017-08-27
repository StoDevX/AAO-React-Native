// @flow

import * as c from '../components/colors'
import type {HomescreenViewType, AppNavigationType} from '../app/types'

import React from 'react'
import {TabNavigator, TabBarIcon} from '../components/tabbed-view'

import {newsImages} from '../../images/news-images'
import {NewsContainer, NewsItemView} from '../modules/news-feed'

const StOlafNewsView = {
  screen: ({navigation}) =>
    <NewsContainer
      navigation={navigation}
      mode="wp-json"
      url="https://wp.stolaf.edu/wp-json/wp/v2/posts"
      // eslint-disable-next-line camelcase
      query={{per_page: 10, _embed: true}}
      name="St. Olaf"
      thumbnail={newsImages.stolaf}
    />,
  navigationOptions: {
    tabBarLabel: 'St. Olaf',
    tabBarIcon: TabBarIcon('school'),
  },
}

const OlevilleNewsView = {
  screen: ({navigation}) =>
    <NewsContainer
      navigation={navigation}
      mode="wp-json"
      url="http://oleville.com/wp-json/wp/v2/posts/"
      // eslint-disable-next-line camelcase
      query={{per_page: 10, _embed: true}}
      embedFeaturedImage={true}
      name="Oleville"
      thumbnail={newsImages.oleville}
    />,
  navigationOptions: {
    tabBarLabel: 'Oleville',
    tabBarIcon: TabBarIcon('happy'),
  },
}

const MessNewsView = {
  screen: ({navigation}) =>
    <NewsContainer
      navigation={navigation}
      mode="rss"
      url="http://manitoumessenger.com/feed/"
      name="The Mess"
      thumbnail={newsImages.mess}
    />,
  navigationOptions: {
    tabBarLabel: 'The Mess',
    tabBarIcon: TabBarIcon('paper'),
  },
}

const PoliticOleNewsView = {
  screen: ({navigation}) =>
    <NewsContainer
      navigation={navigation}
      mode="rss"
      url="http://oleville.com/politicole/feed/"
      name="PoliticOle"
      thumbnail={newsImages.politicole}
    />,
  navigationOptions: {
    tabBarLabel: 'PoliticOle',
    tabBarIcon: TabBarIcon('megaphone'),
  },
}

const KstoNewsView = {
  screen: ({navigation}) =>
    <NewsContainer
      navigation={navigation}
      mode="wp-json"
      url="https://pages.stolaf.edu/ksto/wp-json/wp/v2/posts/"
      // eslint-disable-next-line camelcase
      query={{per_page: 10, _embed: true}}
      name="KSTO"
      thumbnail={newsImages.ksto}
    />,
  navigationOptions: {
    tabBarLabel: 'KSTO',
    tabBarIcon: TabBarIcon('radio'),
  },
}

const NewsView = TabNavigator(
  {
    StOlafNewsView,
    OlevilleNewsView,
    MessNewsView,
    PoliticOleNewsView,
    KstoNewsView,
  },
  {
    navigationOptions: {
      title: 'News',
    },
  },
)

export const navigation: AppNavigationType = {
  NewsView: {screen: NewsView},
  NewsItemView: {screen: NewsItemView},
}

export const view: HomescreenViewType = {
  type: 'view',
  view: 'NewsView',
  title: 'News',
  icon: 'news',
  tint: c.eggplant,
  gradient: c.purpleToIndigo,
}
