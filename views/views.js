import * as c from './components/colors'

export type ViewType = {view: string, title: string, icon: string, tint: string, gradient?: [string, string]};
export const allViews: ViewType[] = [
  {view: 'MenusView', title: 'Menus', icon: 'bowl', tint: c.emerald, gradient: c.grassToLime},
  {view: 'SISView', title: 'SIS', icon: 'fingerprint', tint: c.goldenrod, gradient: c.yellowToGoldDark},
  {view: 'BuildingHoursView', title: 'Building Hours', icon: 'clock', tint: c.wave, gradient: c.lightBlueToBlueDark},
  {view: 'CalendarView', title: 'Calendar', icon: 'calendar', tint: c.coolPurple, gradient: c.magentaToPurple},
  {view: 'DirectoryView', title: 'Directory', icon: 'v-card', tint: c.indianRed, gradient: c.redToPurple},
  {view: 'StreamingView', title: 'Streaming Media', icon: 'video', tint: c.denim, gradient: c.lightBlueToBlueLight},
  {view: 'NewsView', title: 'News', icon: 'news', tint: c.eggplant, gradient: c.purpleToIndigo},
  {view: 'MapView', title: 'Campus Map', icon: 'map', tint: c.coffee, gradient: c.navyToNavy},
  {view: 'ContactsView', title: 'Important Contacts', icon: 'phone', tint: c.crimson, gradient: c.orangeToRed},
  {view: 'TransportationView', title: 'Transportation', icon: 'address', tint: c.cardTable, gradient: c.grayToDarkGray},
  {view: 'DictionaryView', title: 'Campus Dictionary', icon: 'open-book', tint: c.olive, gradient: c.yellowToGoldLight},
  {view: 'OlevilleView', title: 'Oleville', icon: 'mouse-pointer', tint: c.grapefruit, gradient: c.pinkToHotpink},
  {view: 'StudentOrgsView', title: 'Student Orgs', icon: 'globe', tint: c.periwinkle, gradient: c.lightBlueToBlueDark},
]

export const allViewNames = allViews.map(v => v.view)
