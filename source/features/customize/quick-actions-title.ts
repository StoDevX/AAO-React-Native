import {Platform} from 'react-native'

/**
 * What the app's long-press shortcuts are called: Quick Actions on iOS,
 * Shortcuts on Android, where the launcher calls them that.
 */
export const QUICK_ACTIONS_TITLE = Platform.OS === 'android' ? 'Shortcuts' : 'Quick Actions'
