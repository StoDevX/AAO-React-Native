// @flow
import StavMenuView from './menus/stav'
import PauseMenuView from './menus/pause'

const stolaf = [
  {
    id: 'stav',
    title: 'Stav Hall',
    rnVectorIcon: {iconName: 'nutrition'},
    component: StavMenuView,
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
    component: StavMenuView,
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
    component: PauseMenuView,
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
    component: StavMenuView,
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
    component: StavMenuView,
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
    component: StavMenuView,
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
    component: StavMenuView,
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
