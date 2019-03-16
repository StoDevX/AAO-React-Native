// @flow

import {createTheming} from '@callstack/react-theme-provider'
import {getTheme, type AppTheme} from '@frogpond/app-theme'

let theme = getTheme()

const {ThemeProvider, withTheme, useTheme} = createTheming<AppTheme>(theme)

export {ThemeProvider, withTheme, useTheme}
