import * as React from 'react'
import {processColor, type ColorValue} from 'react-native'

import {ADAPTIVE_COLORS, type AdaptiveColorName, type AdaptivePair} from '@frogpond/colors'
import {type MaterialColors, useMaterialColors} from '@expo/ui/jetpack-compose'
import {type Gradient} from '@expo/ui/jetpack-compose/modifiers'

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
 * nearest `Host` has: the wallpaper's dynamic colours where the system has
 * them, and the brand gold's otherwise, as the app's theme has. Every role
 * resolved here follows light and dark.
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
	if (Array.isArray(input)) {
		return componentsToHex(input)
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

/**
 * A colour given as `[red, green, blue, alpha?]` components from 0 to 1, as
 * `displayP3` in `@frogpond/colors` hands one over: extended sRGB, which Expo
 * UI passes to iOS unclamped to reach Display P3. Compose takes sRGB, so the
 * components are clamped into it, the nearest colour Android draws without a
 * wide-gamut window.
 */
function componentsToHex(components: readonly unknown[]): string | undefined {
	let [red, green, blue, alpha = 1] = components
	let channels = [red, green, blue, alpha]
	if (!channels.every((value) => typeof value === 'number' && Number.isFinite(value))) {
		return undefined
	}
	let hex = (channels as number[])
		.map((value) =>
			Math.round(Math.min(1, Math.max(0, value)) * 255)
				.toString(16)
				.padStart(2, '0'),
		)
		.join('')
	return `#${hex}`.toUpperCase()
}

/** A SwiftUI `UnitPoint` as the shape styles carry it, or undefined. */
function unitPoint(value: unknown): {x: number; y: number} | undefined {
	if (typeof value !== 'object' || value === null) {
		return undefined
	}
	let {x, y} = value as {x?: unknown; y?: unknown}
	return typeof x === 'number' && typeof y === 'number' ? {x, y} : undefined
}

/**
 * A SwiftUI gradient `ShapeStyle` as the Compose gradient Expo UI's patched
 * `gradientBackground` modifier paints, or undefined for anything else (a plain
 * colour, a hierarchical style, an angular gradient, which has no Compose brush
 * here and draws its first colour through `resolveColor`).
 *
 * SwiftUI gives a radial gradient's radii in points, which are Compose's dp,
 * so the end radius passes as is. Its start radius has no Compose counterpart:
 * the colours start that far out instead, by pushing every stop outwards.
 */
export function resolveGradient(input: unknown, palette: Palette): Gradient | undefined {
	if (typeof input !== 'object' || input === null || Array.isArray(input)) {
		return undefined
	}
	let value = input as Record<string, unknown>
	if (value.type !== 'linearGradient' && value.type !== 'radialGradient') {
		return undefined
	}
	let colors = (Array.isArray(value.colors) ? value.colors : [])
		.map((color) => resolveColor(color, palette))
		.filter((color): color is string => color !== undefined)
	if (colors.length === 0) {
		return undefined
	}
	if (value.type === 'linearGradient') {
		return {
			type: 'linear',
			colors,
			start: unitPoint(value.startPoint) ?? {x: 0.5, y: 0},
			end: unitPoint(value.endPoint) ?? {x: 0.5, y: 1},
		}
	}
	let endRadius = typeof value.endRadius === 'number' ? value.endRadius : undefined
	let startRadius = typeof value.startRadius === 'number' ? value.startRadius : 0
	let inner = endRadius && endRadius > 0 ? Math.min(1, Math.max(0, startRadius / endRadius)) : 0
	let last = Math.max(1, colors.length - 1)
	return {
		type: 'radial',
		colors,
		stops: inner > 0 ? colors.map((_, index) => inner + (index / last) * (1 - inner)) : undefined,
		center: unitPoint(value.center) ?? {x: 0.5, y: 0.5},
		radius: endRadius && endRadius > 0 ? endRadius : undefined,
	}
}

/** A colour scheme a view can be forced into, as SwiftUI's `environment(\.colorScheme)` does. */
export type Scheme = 'light' | 'dark'

/**
 * iOS's label colours in each scheme: white or black, with the secondary to
 * quaternary levels at the opacities iOS gives them. A view forced into the
 * other scheme sits on a fill of its own (a home card's gradient), which is
 * what those levels were drawn for.
 */
const SCHEME_CONTENT: Readonly<Record<Scheme, Partial<MaterialColors>>> = {
	dark: {
		onSurface: '#FFFFFFFF',
		onSurfaceVariant: '#EBEBF599',
		outline: '#EBEBF54D',
		outlineVariant: '#EBEBF52E',
	},
	light: {
		onSurface: '#000000FF',
		onSurfaceVariant: '#3C3C4399',
		outline: '#3C3C434D',
		outlineVariant: '#3C3C432E',
	},
}

/** Each palette's forced-scheme variants, so a forced palette keeps one identity. */
const schemedPalettes = new WeakMap<Palette, Palette>()

/**
 * The palette for content forced into a colour scheme. In the palette's own
 * scheme that is the palette itself; in the other, its content roles become
 * that scheme's label colours, so `foregroundStyle(.primary)` reads white on
 * a card that asks for dark content, as on iOS.
 */
export function inScheme(palette: Palette, scheme: Scheme | undefined): Palette {
	if (scheme === undefined || (scheme === 'dark') === palette.dark) {
		return palette
	}
	let cached = schemedPalettes.get(palette)
	if (!cached) {
		cached = {colors: {...palette.colors, ...SCHEME_CONTENT[scheme]}, dark: scheme === 'dark'}
		schemedPalettes.set(palette, cached)
	}
	return cached
}

/**
 * A view's content colour: its foreground resolved in the scheme it was
 * forced into, or that scheme's primary label when it names none, since
 * Compose's own default follows the Host's scheme instead.
 */
export function contentColor(
	input: unknown,
	palette: Palette,
	scheme: Scheme | undefined,
): string | undefined {
	let schemed = inScheme(palette, scheme)
	return (
		resolveColor(input, schemed) ?? (schemed === palette ? undefined : schemed.colors.onSurface)
	)
}

/** The same colour at an opacity, for the faded states SwiftUI draws by opacity. */
export function withAlpha(hex: string, alpha: number): string {
	let rgb = hex.slice(1, 7)
	let base = hex.length >= 9 ? Number.parseInt(hex.slice(7, 9), 16) / 255 : 1
	let combined = Math.round(Math.min(1, Math.max(0, base * alpha)) * 255)
	return `#${rgb}${combined.toString(16).padStart(2, '0')}`.toUpperCase()
}
