import * as React from 'react'
import {useColorScheme} from 'react-native'
import {getMaterialColors, isDynamicColorAvailable} from '@expo/ui/jetpack-compose'
import {gold} from '@frogpond/colors'

import type {MarkdownColors} from './theme'

/**
 * The palette's seed: none where the system has dynamic colour, so the
 * wallpaper's roles come back as the app's theme has them, and the brand gold
 * below Android 12, which the theme seeds its palette from.
 */
const SEED = isDynamicColorAvailable ? undefined : gold

/**
 * The Markdown colours, as the Material roles `@frogpond/colors` names on
 * Android. Those exports are `PlatformColor` theme references there, and the
 * library's Android side reads each colour as a plain number, so a reference
 * fails the whole render and leaves an empty box. The roles are read from the
 * theme's palette instead, again whenever the scheme changes.
 */
export function useMarkdownColors(): MarkdownColors {
	let scheme: 'light' | 'dark' = useColorScheme() === 'dark' ? 'dark' : 'light'
	return React.useMemo(() => {
		let colors = getMaterialColors({scheme, seedColor: SEED})
		return {
			label: colors.onSurface,
			link: colors.primary,
			secondarySystemBackground: colors.surfaceContainer,
			separator: colors.outlineVariant,
		}
	}, [scheme])
}
