// @flow

import NewsContainer from './news-container'

export default [
  {
    id: 'stolaf',
    title: 'St. Olaf',
    rnVectorIcon: {iconName: 'school'},
    component: NewsContainer,
    props: {
      url: 'https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=-1&q=https://wp.stolaf.edu/feed',
    },
  },
  {
    id: 'politicole',
    title: 'PoliticOle',
    rnVectorIcon: {iconName: 'megaphone'},
    component: NewsContainer,
    props: {
      url: 'https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=-1&q=http://oleville.com/politicole/feed',
    },
  },
  {
    id: 'mess',
    title: 'Mess',
    rnVectorIcon: {iconName: 'paper'},
    component: NewsContainer,
    props: {
      url: 'https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=-1&q=http://manitoumessenger.com/feed',
    },
  },
]
