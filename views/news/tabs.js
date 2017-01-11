// @flow
import NewsContainer from './news-container'

export default [
  {
    id: 'stolaf',
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
    id: 'politicole',
    title: 'PoliticOle',
    rnVectorIcon: {iconName: 'megaphone'},
    component: NewsContainer,
    props: {
      url: 'http://oleville.com/politicole/feed',
      mode: 'rss',
      name: 'PoliticOle',
    },
  },
  {
    id: 'mess',
    title: 'Mess',
    rnVectorIcon: {iconName: 'paper'},
    component: NewsContainer,
    props: {
      url: 'http://manitoumessenger.com/feed',
      mode: 'rss',
      name: 'Mess',
    },
  },
]
