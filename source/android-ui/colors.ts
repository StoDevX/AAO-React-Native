import * as React from 'react'
import {processColor, type ColorValue} from 'react-native'

import {
	ADAPTIVE_COLORS,
	type AdaptiveColorName,
	type AdaptivePair,
} from '@frogpond/colors'
import {type MaterialColors, useMaterialColors} from '@expo/ui/jetpack-compose'

/**
 * A colour as the screens hand it to a SwiftUI modifier: a CSS string, one of
 * SwiftUI's named colours, an iOS `PlatformColor`, or a `ShapeStyle` object
 * such as `{type: 'hierarchical', style: 'secondary'}`.
 */
export type ColorInput = ColorValue | Record<string, unknown> | null | undefined

/** A Material colour role, by its name on `MaterialColors`. */
type Role = keyof MaterialColors

/**
 * iOS's semantic colours, by the names SwiftUI and iOS's `PlatformColor` use,
 * mapped to the Material roles that play the same part. On Android
 * `@frogpond/colors` exports each as that role's theme attribute instead (see
 * its platform.android.ts, which mirrors this table), so a screen's colour
 * reaches here as a name only when it is written as a string.
 */
const SEMANTIC_ROLES: Readonly<Record<string, Role>> = {
	label: 'onSurface',
	secondaryLabel: 'onSurfaceVariant',
	tertiaryLabel: 'outline',
	quaternaryLabel: 'outlineVariant',
	placeholderText: 'onSurfaceVariant',
	systemFill: 'surfaceContainerHighest',
	secondarySystemFill: 'surfaceContainerHigh',
	tertiarySystemFill: 'surfaceContainerHigh',
	quaternarySystemFill: 'surfaceContainer',
	systemBackground: 'surface',
	secondarySystemBackground: 'surfaceContainer',
	tertiarySystemBackground: 'surfaceContainerHigh',
	systemGroupedBackground: 'surface',
	secondarySystemGroupedBackground: 'surfaceContainer',
	tertiarySystemGroupedBackground: 'surfaceContainerHigh',
	separator: 'outlineVariant',
	opaqueSeparator: 'outlineVariant',
	link: 'primary',
	systemBlue: 'primary',
	tint: 'primary',
	accentColor: 'primary',
	systemRed: 'error',
	systemGray: 'outline',
	systemGray2: 'outline',
	systemGray3: 'outlineVariant',
	systemGray4: 'surfaceContainerHighest',
	systemGray5: 'surfaceContainerHigh',
	systemGray6: 'surfaceContainer',
	// SwiftUI's own named colours that mean a role rather than a hue.
	primary: 'onSurface',
	secondary: 'onSurfaceVariant',
	gray: 'outline',
}

/**
 * SwiftUI's named hues, as the `ADAPTIVE_COLORS` entry each stands for. The
 * entries are iOS's system hues, which have no Material role: brand-neutral
 * accents (a green "open" dot, an orange warning) that keep their hue, in the
 * Material 3 baseline's tone for each scheme. React Native views get the same
 * values as colour resources, through `@frogpond/colors`.
 */
const SWIFTUI_HUES: Readonly<Record<string, AdaptiveColorName>> = {
	green: 'systemGreen',
	orange: 'systemOrange',
	yellow: 'systemYellow',
	pink: 'systemPink',
	purple: 'systemPurple',
	indigo: 'systemIndigo',
	teal: 'systemTeal',
	mint: 'systemMint',
	cyan: 'systemCyan',
	brown: 'systemBrown',
}

/**
 * SwiftUI's blue and red, which as named colours mean the hue itself rather
 * than the accent and error roles iOS's `systemBlue` and `systemRed` play.
 */
const FIXED_HUES: Readonly<Record<string, AdaptivePair>> = {
	blue: {light: '#1565C0', dark: '#90CAF9'},
	red: {light: '#C62828', dark: '#EF9A9A'},
}

/** Every adaptive colour by name, for a lookup by a string. */
const ADAPTIVE_BY_NAME: Readonly<Record<string, AdaptivePair | undefined>> = ADAPTIVE_COLORS

/** SwiftUI's hierarchical foreground levels, as Material roles. */
const HIERARCHY_ROLES: Readonly<Record<string, Role>> = {
	primary: 'onSurface',
	secondary: 'onSurfaceVariant',
	tertiary: 'outline',
	quaternary: 'outlineVariant',
	quinary: 'outlineVariant',
}

/** A palette and whether it is the dark one, which the fixed hues need. */
export type Palette = {colors: MaterialColors; dark: boolean}

/**
 * The current Host's palette. `useMaterialColors()` reads the palette the
 * nearest `Host` derived from its seed colour, so every role resolved here is
 * on-brand and follows light and dark.
 */
export function usePalette(): Palette {
	let colors = useMaterialColors()
	return React.useMemo(() => ({colors, dark: isDark(colors.surface)}), [colors])
}

/** Whether a `#RRGGBB[AA]` surface colour is a dark one. */
function isDark(hex: string): boolean {
	let value = Number.parseInt(hex.slice(1, 7), 16)
	if (Number.isNaN(value)) {
		return false
	}
	let r = (value >> 16) & 255
	let g = (value >> 8) & 255
	let b = value & 255
	return 0.299 * r + 0.587 * g + 0.114 * b < 128
}

/** The name an iOS `PlatformColor` or `DynamicColorIOS` carries, if it is one. */
function platformColorName(value: Record<string, unknown>): string | undefined {
	// iOS spells the lookup `semantic`, Android `resource_paths`.
	let names = value.semantic ?? value.resource_paths
	if (Array.isArray(names) && typeof names[0] === 'string') {
		return names[0]
	}
	return undefined
}

/** A name's colour, from the role and hue tables, if it has one. */
function namedColor(name: string, palette: Palette): string | undefined {
	let role = SEMANTIC_ROLES[name]
	if (role) {
		return palette.colors[role]
	}
	let hue = FIXED_HUES[name] ?? ADAPTIVE_BY_NAME[SWIFTUI_HUES[name] ?? name]
	if (hue) {
		return palette.dark ? hue.dark : hue.light
	}
	if (name === 'clear' || name === 'transparent') {
		return '#00000000'
	}
	return undefined
}

/** How an Android `PlatformColor` names a Material role: its theme attribute. */
const THEME_ROLE = '?attr/color'

/** How an Android `PlatformColor` names one of `ADAPTIVE_COLORS`: its colour resource. */
const COLOR_RESOURCE = '@color/'

/** Android's own transparent, which `@frogpond/colors` exports as `clear`. */
const TRANSPARENT = '@android:color/transparent'

/**
 * The colour a `PlatformColor`'s first name or resource path stands for. On
 * Android `@frogpond/colors` exports Material roles as theme attributes
 * (`?attr/colorOnSurface`), its fixed hues as colour resources, and `clear` as
 * Android's transparent; each resolves here to what the theme would give, so
 * Compose draws what a React Native view given the same colour draws. Anything
 * else is taken as an iOS name.
 */
function pathColor(path: string, palette: Palette): string | undefined {
	if (path.startsWith(THEME_ROLE)) {
		let attribute = path.slice(THEME_ROLE.length)
		let role = attribute.charAt(0).toLowerCase() + attribute.slice(1)
		return role in palette.colors ? palette.colors[role as Role] : undefined
	}
	if (path.startsWith(COLOR_RESOURCE)) {
		return namedColor(path.slice(COLOR_RESOURCE.length), palette)
	}
	if (path === TRANSPARENT) {
		return '#00000000'
	}
	return namedColor(path, palette)
}

/** An ARGB integer from `processColor` as the `#RRGGBBAA` string Compose parses. */
function argbToHex(argb: number): string {
	let unsigned = argb >>> 0
	let alpha = (unsigned >>> 24) & 255
	let rgb = unsigned & 16_777_215
	return `#${rgb.toString(16).padStart(6, '0')}${alpha.toString(16).padStart(2, '0')}`.toUpperCase()
}

/**
 * Resolves a colour the screens wrote for SwiftUI to a string Compose can
 * parse, or `undefined` for none. Semantic iOS colours become Material roles,
 * a `ShapeStyle` takes its colour (a gradient its first stop, a material the
 * surface it stands for), and anything Compose would refuse is dropped rather
 * than handed to native, where a malformed colour throws.
 */
export function resolveColor(input: unknown, palette: Palette): string | undefined {
	if (input == null) {
		return undefined
	}
	if (typeof input === 'string') {
		let named = namedColor(input, palette)
		if (named) {
			return named
		}
		let processed = processColor(input)
		return typeof processed === 'number' ? argbToHex(processed) : undefined
	}
	if (typeof input === 'number') {
		return argbToHex(input)
	}
	if (typeof input !== 'object') {
		return undefined
	}
	let value = input as Record<string, unknown>
	let platformName = platformColorName(value)
	if (platformName) {
		return pathColor(platformName, palette)
	}
	if (value.dynamic && typeof value.dynamic === 'object') {
		let dynamic = value.dynamic as {light?: unknown; dark?: unknown}
		return resolveColor(palette.dark ? dynamic.dark : dynamic.light, palette)
	}
	switch (value.type) {
		case 'color':
			return resolveColor(value.color, palette)
		case 'hierarchical': {
			let level = value.hierarchical ?? value.style
			let role = typeof level === 'string' ? HIERARCHY_ROLES[level] : undefined
			return role ? palette.colors[role] : undefined
		}
		case 'material':
			return palette.colors.surfaceContainerHigh
		case 'linearGradient':
		case 'radialGradient':
		case 'angularGradient':
			return Array.isArray(value.colors) ? resolveColor(value.colors[0], palette) : undefined
		default:
			return undefined
	}
}

/** The same colour at an opacity, for the faded states SwiftUI draws by opacity. */
export function withAlpha(hex: string, alpha: number): string {
	let rgb = hex.slice(1, 7)
	let base = hex.length >= 9 ? Number.parseInt(hex.slice(7, 9), 16) / 255 : 1
	let combined = Math.round(Math.min(1, Math.max(0, base * alpha)) * 255)
	return `#${rgb}${combined.toString(16).padStart(2, '0')}`.toUpperCase()
}
