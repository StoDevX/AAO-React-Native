import {DynamicColorIOS} from 'react-native'

/** Newsprint, and warm dark paper in dark mode. */
export const paper = DynamicColorIOS({light: '#FBF9F4', dark: '#1C1A17'})
/** The type on it. */
export const ink = DynamicColorIOS({light: '#1A1A1A', dark: '#EDE8DF'})
/** Secondary type: dates, captions, bios. */
export const faded = DynamicColorIOS({light: '#5C5850', dark: '#A8A196'})
/** The Mess red, for kickers and links. */
export const messRed = DynamicColorIOS({light: '#8A1C1C', dark: '#E0736B'})
/** Type on a Mess red fill: white on the deep light-mode red, dark paper on the light dark-mode red. */
export const onMessRed = DynamicColorIOS({light: '#FFFFFF', dark: '#1C1A17'})
