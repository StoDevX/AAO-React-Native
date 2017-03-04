// @flow
import NewsContainer from './news-container'

export default [
  {
    id: 'StOlafNewsView',
    title: 'St. Olaf',
    rnVectorIcon: {iconName: 'school'},
    component: NewsContainer,
    props: {
      mode: 'wp-json',
      url: 'https://wp.stolaf.edu/wp-json/wp/v2/posts',
      query: {'per_page': 10, _embed: true},
      name: 'St. Olaf',
    },
  },
  {
    id: 'OlevilleNewsView',
    title: 'Oleville',
    rnVectorIcon: {iconName: 'happy'},
    component: NewsContainer,
    props: {
      mode: 'wp-json',
      url: 'http://oleville.com/wp-json/wp/v2/posts/',
      query: {'per_page': 10, _embed: true},
      embedFeaturedImage: true,
      name: 'Oleville',
    },
  },
  {
    id: 'MessNewsView',
    title: 'The Mess',
    rnVectorIcon: {iconName: 'paper'},
    component: NewsContainer,
    props: {
      mode: 'rss',
      url: 'http://manitoumessenger.com/feed/',
      name: 'The Mess',
    },
  },
  {
    id: 'PoliticOleNewsView',
    title: 'PoliticOle',
    rnVectorIcon: {iconName: 'megaphone'},
    component: NewsContainer,
    props: {
      mode: 'rss',
      url: 'http://oleville.com/politicole/feed/',
      name: 'PoliticOle',
    },
  },
  {
    id: 'KstoNewsView',
    title: 'KSTO',
    rnVectorIcon: {iconName: 'radio'},
    component: NewsContainer,
    props: {
      mode: 'wp-json',
      url: 'https://pages.stolaf.edu/ksto/wp-json/wp/v2/posts/',
      query: {'per_page': 10, _embed: true},
      name: 'KSTO',
    },
  },
]
