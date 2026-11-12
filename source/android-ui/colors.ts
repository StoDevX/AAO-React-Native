import * as React from 'react'
import {processColor, type ColorValue} from 'react-native'

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
 * iOS's semantic colours, which `@frogpond/colors` exports as
 * `PlatformColor`s, mapped to the Material roles that play the same part. On
 * Android a `PlatformColor('label')` is a resource lookup that resolves to
 * nothing, so every one the app uses is translated here instead.
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
 * iOS's system hues that have no Material role, as fixed colours. They are
 * brand-neutral accents (a green "open" dot, an orange warning), so they keep
 * their hue, in the Material 3 baseline's tone for each scheme.
 */
const SYSTEM_HUES: Readonly<Record<string, readonly [light: string, dark: string]>> = {
	systemGreen: ['#2E7D32', '#81C784'],
	green: ['#2E7D32', '#81C784'],
	systemOrange: ['#E65100', '#FFB74D'],
	orange: ['#E65100', '#FFB74D'],
	systemYellow: ['#F9A825', '#FFF176'],
	yellow: ['#F9A825', '#FFF176'],
	systemPink: ['#C2185B', '#F48FB1'],
	pink: ['#C2185B', '#F48FB1'],
	systemPurple: ['#7B1FA2', '#CE93D8'],
	purple: ['#7B1FA2', '#CE93D8'],
	systemIndigo: ['#3949AB', '#9FA8DA'],
	indigo: ['#3949AB', '#9FA8DA'],
	systemTeal: ['#00796B', '#80CBC4'],
	teal: ['#00796B', '#80CBC4'],
	systemMint: ['#00897B', '#80CBC4'],
	mint: ['#00897B', '#80CBC4'],
	systemCyan: ['#0097A7', '#80DEEA'],
	cyan: ['#0097A7', '#80DEEA'],
	systemBrown: ['#6D4C41', '#BCAAA4'],
	brown: ['#6D4C41', '#BCAAA4'],
	blue: ['#1565C0', '#90CAF9'],
	red: ['#C62828', '#EF9A9A'],
}

/** SwiftUI's hierarchical foreground levels, as Material roles. */
const HIERARCHY_ROLES: Readonly<Record<string, Role>> = {
	primary: 'onSurface',
	secondary: 'onSurfaceVariant',
	tertiary: 'outline',
	quaternary: 'outlineVariant',
	quinary: 'outlineVariant',
}

/** A palette and whether it is the dark one, which `SYSTEM_HUES` needs. */
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
	let r = (value >> 16) & 0xff
	let g = (value >> 8) & 0xff
	let b = value & 0xff
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
	let hue = SYSTEM_HUES[name]
	if (hue) {
		return palette.dark ? hue[1] : hue[0]
	}
	if (name === 'clear' || name === 'transparent') {
		return '#00000000'
	}
	return undefined
}

/** An ARGB integer from `processColor` as the `#RRGGBBAA` string Compose parses. */
function argbToHex(argb: number): string {
	let unsigned = argb >>> 0
	let alpha = (unsigned >>> 24) & 0xff
	let rgb = unsigned & 0xffffff
	return `#${rgb.toString(16).padStart(6, '0')}${alpha.toString(16).padStart(2, '0')}`.toUpperCase()
}

/**
 * Resolves a colour the screens wrote for SwiftUI to a string Compose can
 * parse, or `undefined` for none. Semantic iOS colours become Material roles,
 * a `ShapeStyle` takes its colour (a gradient its first stop, a material the
 * surface it stands for), and anything Compose would refuse is dropped rather
 * than handed to native, where a malformed colour throws.
 */
export function resolveColor(input: ColorInput | unknown, palette: Palette): string | undefined {
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
		return namedColor(platformName, palette)
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
