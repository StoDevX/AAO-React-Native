// @flow
import NewsContainer from './news-container'
import OlevilleView from './oleville-view'

export default [
  {
    id: 'StOlafNewsView',
    title: 'St. Olaf',
    rnVectorIcon: {iconName: 'school'},
    component: NewsContainer,
    props: {
      url: 'https://wp.stolaf.edu/feed/',
      mode: 'rss',
      name: 'St. Olaf',
    },
  },
  {
    id: 'OlevilleView',
    title: 'Oleville',
    rnVectorIcon: {iconName: 'ion-mouse'},
    component: OlevilleView,
    props: {},
  },
  {
    id: 'MessNewsView',
    title: 'Mess',
    rnVectorIcon: {iconName: 'paper'},
    component: NewsContainer,
    props: {
      url: 'http://manitoumessenger.com/feed/',
      mode: 'rss',
      name: 'Mess',
    },
  },
  {
    id: 'PoliticOleNewsView',
    title: 'PoliticOle',
    rnVectorIcon: {iconName: 'megaphone'},
    component: NewsContainer,
    props: {
      url: 'http://oleville.com/politicole/feed/',
      mode: 'rss',
      name: 'PoliticOle',
    },
  },
]
