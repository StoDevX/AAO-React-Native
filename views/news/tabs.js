// @flow

import StOlafNewsView from './stolaf'
import PoliticoleView from './politicole'
import ManitouMessView from './mess'

export default [
  {
    id: 'stolaf',
    title: 'St. Olaf',
    rnVectorIcon: {iconName: 'graduation-cap'},
    content: StOlafNewsView,
    props: {
      url: 'https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=-1&q=https://wp.stolaf.edu/feed',
    },
  },
  {
    id: 'politicole',
    title: 'PoliticOle',
    rnVectorIcon: {iconName: 'megaphone'},
    content: PoliticoleView,
    props: {
      url: 'https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=-1&q=http://oleville.com/politicole/feed',
    },
  },
  {
    id: 'mess',
    title: 'Mess',
    rnVectorIcon: {iconName: 'documents'},
    content: ManitouMessView,
    props: {
      url: 'https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=-1&q=http://manitoumessenger.com/feed',
    },
  },
]
