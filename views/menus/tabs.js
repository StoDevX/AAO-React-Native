// @flow
import {BonAppHostedMenu} from './menu-bonapp'
import {GitHubHostedMenu} from './menu-github'
// import {BonAppPickerView} from './dev-bonapp-picker'

const stolaf = [
  {
    id: 'StavHallMenuView',
    title: 'Stav Hall',
    rnVectorIcon: {iconName: 'nutrition'},
    component: BonAppHostedMenu,
    props: {
      name: 'stav',
      cafeId: '261',
      loadingMessage: [
        'Hunting Ferndale Turkey…',
        'Tracking wild vegan burgers…',
        '"Cooking" some lutefisk…',
      ],
    },
  },
  {
    id: 'TheCageMenuView',
    title: 'The Cage',
    rnVectorIcon: {iconName: 'cafe'},
    component: BonAppHostedMenu,
    props: {
      name: 'cage',
      cafeId: '262',
      loadingMessage: [
        'Checking for vegan cookies…',
        'Serving up some shakes…',
      ],
    },
  },
  {
    id: 'ThePauseMenuView',
    title: 'The Pause',
    rnVectorIcon: {iconName: 'paw'},
    component: GitHubHostedMenu,
    props: {
      name: 'pause',
      loadingMessage: [
        'Mixing up a shake…',
        'Spinning up pizzas…',
      ],
    },
  },
  // {
  //   id: 'BonAppDevToolView',
  //   title: 'BonApp',
  //   rnVectorIcon: {iconName: 'ionic'},
  //   component: BonAppPickerView,
  // },
]

const carleton = [
  {
    id: 'CarletonBurtonMenuView',
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
    id: 'CarletonLDCMenuView',
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
    id: 'CarletonWeitzMenuView',
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
    id: 'CarletonSaylesMenuView',
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
