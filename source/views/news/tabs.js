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
    id: 'OlevilleView',
    title: 'Oleville',
    rnVectorIcon: {iconName: 'happy'},
    component: NewsContainer,
    props: {
      url: 'http://oleville.com/wp-json/wp/v2/posts/',
      query: {'per_page': 5, _embed: true},
      mode: 'wp-json',
      name: 'Oleville',
    },
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
