// @flow

// HomeView _must_ be exported first.
// react-navigation renders the first view it gets as the root of the navigator,
// so by putting HomeView first, it will be first in the nav, and therefore be
// the root view.
export {view as HomeView, navigation as HomeNav} from './home'

// The prettier-ignore comments are in here so that all of our exports can
// remain on the same line.

// NOTE: If you add a new screen, you _must_ export
// {view as `${Screen}View`, navigation as `${Screen}Nav`}
// or else the homescreen or the navigation won't pick up your new stuff.

// prettier-ignore
export {view as BuildingHoursView, navigation as BuildingHoursNav} from './building-hours'

// prettier-ignore
export {view as CalendarView, navigation as CalendarNav} from './calendar'

// prettier-ignore
export {view as CampusDictionaryView, navigation as CampusDictionaryNav} from './campus-dictionary'

// prettier-ignore
export {view as CampusMapView, navigation as CampusMapNav} from './campus-map'

// prettier-ignore
export {view as DirectoryView, navigation as DirectoryNav} from './directory'

// prettier-ignore
// export {view as HelpView, navigation as HelpNav} from './help'

// prettier-ignore
export {view as EditHomeView, navigation as EditHomeNav} from './home-edit'

// prettier-ignore
export {view as ImportantContactsView, navigation as ImportantContactsNav} from './important-contacts'

// prettier-ignore
export {view as MenusView, navigation as MenusNav} from './menus'

// prettier-ignore
export {view as NewsView, navigation as NewsNav} from './news'

// prettier-ignore
export {view as SettingsView, navigation as SettingsNav} from './settings'

// prettier-ignore
export {view as SisView, navigation as SisNav} from './sis'

// prettier-ignore
// export {view as StorybookView, navigation as StorybookNav} from './storybook'

// prettier-ignore
export {view as StreamingMediaView, navigation as StreamingMediaNav} from './streaming-media'

// prettier-ignore
export {view as StudentOrgsView, navigation as StudentOrgsNav} from './student-orgs'

// prettier-ignore
export {view as TransportationView, navigation as TransportationNav} from './transportation'
