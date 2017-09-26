// @flow

import * as c from './components/colors'

export type ViewType =
  | {
      type: 'view',
      view: string,
      title: string,
      icon: string,
      tint: string,
      gradient?: [string, string],
    }
  | {
      type: 'url',
      view: string,
      url: string,
      title: string,
      icon: string,
      tint: string,
      gradient?: [string, string],
    }

export const allViews: ViewType[] = [
  {
    type: 'view',
    view: 'MenusView',
    title: 'Menus',
    icon: 'bowl',
    tint: c.emerald,
    gradient: c.grassToLime,
  },
  {
    type: 'view',
    view: 'SISView',
    title: 'SIS',
    icon: 'fingerprint',
    tint: c.goldenrod,
    gradient: c.yellowToGoldDark,
  },
  {
    type: 'view',
    view: 'BuildingHoursView',
    title: 'Building Hours',
    icon: 'clock',
    tint: c.wave,
    gradient: c.lightBlueToBlueDark,
  },
  {
    type: 'view',
    view: 'CalendarView',
    title: 'Calendar',
    icon: 'calendar',
    tint: c.coolPurple,
    gradient: c.magentaToPurple,
  },
  {
    type: 'url',
    url: 'https://www.stolaf.edu/personal/index.cfm',
    view: 'DirectoryView',
    title: 'Directory',
    icon: 'v-card',
    tint: c.indianRed,
    gradient: c.redToPurple,
  },
  {
    type: 'view',
    view: 'StreamingView',
    title: 'Streaming Media',
    icon: 'video',
    tint: c.denim,
    gradient: c.lightBlueToBlueLight,
  },
  {
    type: 'view',
    view: 'NewsView',
    title: 'News',
    icon: 'news',
    tint: c.eggplant,
    gradient: c.purpleToIndigo,
  },
  {
    type: 'url',
    url: 'https://www.myatlascms.com/map/index.php?id=294',
    view: 'MapView',
    title: 'Campus Map',
    icon: 'map',
    tint: c.coffee,
    gradient: c.navyToNavy,
  },
  {
    type: 'view',
    view: 'ContactsView',
    title: 'Important Contacts',
    icon: 'phone',
    tint: c.crimson,
    gradient: c.orangeToRed,
  },
  {
    type: 'view',
    view: 'TransportationView',
    title: 'Transportation',
    icon: 'address',
    tint: c.cardTable,
    gradient: c.grayToDarkGray,
  },
  {
    type: 'view',
    view: 'DictionaryView',
    title: 'Campus Dictionary',
    icon: 'open-book',
    tint: c.olive,
    gradient: c.yellowToGoldLight,
  },
  {
    type: 'view',
    view: 'StudentOrgsView',
    title: 'Student Orgs',
    icon: 'globe',
    tint: c.periwinkle,
    gradient: c.lightBlueToBlueDark,
  },
  {
    type: 'url',
    url: 'https://moodle.stolaf.edu/',
    view: 'MoodleView',
    title: 'Moodle',
    icon: 'graduation-cap',
    tint: c.cantaloupe,
    gradient: c.yellowToGoldDark,
  },
  //   {
  //     type: 'view',
  //     view: 'HelpView',
  //     title: 'Report A Problem',
  //     icon: 'help',
  //     tint: c.lavender,
  //     gradient: c.purpleToIndigo,
  //   },
]

export const allViewNames = allViews.map(v => v.view)
