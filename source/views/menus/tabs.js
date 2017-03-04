// @flow
import {BonAppHostedMenu} from './menu-bonapp';
import {GitHubHostedMenu} from './menu-github';
import {CarletonMenuPicker} from './carleton-list';
//import {BonAppPickerView} from './dev-bonapp-picker'

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
      ignoreProvidedMenus: true,
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
      loadingMessage: ['Mixing up a shake…', 'Spinning up pizzas…'],
    },
  },
  {
    id: 'CarletonMenuListView',
    title: 'Carleton',
    rnVectorIcon: {iconName: 'menu'},
    component: CarletonMenuPicker,
    props: {
      name: 'carleton',
    },
  },
  // {
  //   id: 'BonAppDevToolView',
  //   title: 'BonApp',
  //   rnVectorIcon: {iconName: 'ionic'},
  //   component: BonAppPickerView,
  // },
];

export default stolaf;
