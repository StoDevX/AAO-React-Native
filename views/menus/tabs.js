// @flow
import {BonAppHostedMenu} from './menu-bonapp'
import {LocalMenu} from './menu-local'

const stolaf = [
  {
    id: 'stav',
    title: 'Stav Hall',
    rnVectorIcon: {iconName: 'nutrition'},
    component: BonAppHostedMenu,
    props: {
      cafeId: '261',
      loadingMessage: [
        'Hunting Ferndale Turkey…',
        'Tracking wild vegan burgers…',
        '"Cooking" some lutefisk…',
      ],
    },
  },
  {
    id: 'cage',
    title: 'The Cage',
    rnVectorIcon: {iconName: 'cafe'},
    component: BonAppHostedMenu,
    props: {
      cafeId: '262',
      loadingMessage: [
        'Checking for vegan cookies…',
        'Serving up some shakes…',
      ],
    },
  },
  {
    id: 'pause',
    title: 'The Pause',
    rnVectorIcon: {iconName: 'paw'},
    component: LocalMenu,
    props: {
      loadingMessage: [
        'Mixing up a shake…',
        'Spinning up pizzas…',
      ],
    },
  },
]

const carleton = [
  {
    id: 'burton',
    title: 'Burton',
    rnVectorIcon: {iconName: 'trophy'},
    component: BonAppHostedMenu,
    props: {
      cafeId: '35',
      loadingMessage: [
        'Searching for Schiller…',
      ],
    },
  },
  {
    id: 'ldc',
    title: 'LDC',
    rnVectorIcon: {iconName: 'water'},
    component: BonAppHostedMenu,
    props: {
      cafeId: '36',
      loadingMessage: [
        'Tracking down empty seats…',
      ],
    },
  },
  {
    id: 'weitz',
    title: 'Weitz Center',
    rnVectorIcon: {iconName: 'wine'},
    component: BonAppHostedMenu,
    props: {
      cafeId: '458',
      loadingMessage: [
        'Observing the artwork…',
        'Previewing performances…',
      ],
    },
  },
  {
    id: 'sayles',
    title: 'Sayles Hill',
    rnVectorIcon: {iconName: 'snow'},
    component: BonAppHostedMenu,
    props: {
      cafeId: '34',
      loadingMessage: [
        'Engaging in people-watching…',
        'Checking the mail…',
      ],
    },
  },
]

export {stolaf, carleton}
export default stolaf
