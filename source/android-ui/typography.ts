import type {TextFontWeight, TextStyle, TypographyStyle} from '@expo/ui/jetpack-compose'

/** The parameters of a SwiftUI `font(…)` modifier, as its payload carries them. */
export type FontParams = {
	family?: string
	size?: number
	weight?: string
	design?: string
	textStyle?: string
	smallCaps?: boolean
	leading?: string
}

/**
 * SwiftUI's Dynamic Type text styles, as the Material type scale role that
 * plays the same part on a screen. Material's roles scale with the system
 * font size the way Dynamic Type does.
 */
export const TEXT_STYLE_ROLES: Readonly<Record<string, TypographyStyle>> = {
	largeTitle: 'displaySmall',
	title: 'headlineMedium',
	title2: 'headlineSmall',
	title3: 'titleLarge',
	headline: 'titleMedium',
	body: 'bodyLarge',
	callout: 'bodyMedium',
	subheadline: 'bodyMedium',
	footnote: 'bodySmall',
	caption: 'labelMedium',
	caption2: 'labelSmall',
}

/** Each Material role's font size in sp, from the Material 3 type scale. */
export const ROLE_SIZES: Readonly<Record<TypographyStyle, number>> = {
	displayLarge: 57,
	displayMedium: 45,
	displaySmall: 36,
	headlineLarge: 32,
	headlineMedium: 28,
	headlineSmall: 24,
	titleLarge: 22,
	titleMedium: 16,
	titleSmall: 14,
	bodyLarge: 16,
	bodyMedium: 14,
	bodySmall: 12,
	labelLarge: 14,
	labelMedium: 12,
	labelSmall: 11,
}

/** SwiftUI's weights, as the numeric weights Compose takes. */
const WEIGHTS: Readonly<Record<string, TextFontWeight>> = {
	ultraLight: '100',
	thin: '200',
	light: '300',
	regular: '400',
	medium: '500',
	semibold: '600',
	bold: '700',
	heavy: '800',
	black: '900',
}

/** SwiftUI's font designs, as Compose's generic font families. */
const DESIGNS: Readonly<Record<string, TextStyle['fontFamily']>> = {
	serif: 'serif',
	monospaced: 'monospace',
	rounded: 'sansSerif',
	default: 'default',
}

/**
 * A SwiftUI font as a Compose text style: the text style becomes the Material
 * role, and an explicit size, weight, design or family overrides it. With
 * neither a text style nor a size the role is `bodyLarge`, as SwiftUI's
 * default is `body`.
 */
export function textStyleFor(font: FontParams | undefined): TextStyle {
	let style: TextStyle = {}
	if (!font) {
		return style
	}
	if (font.textStyle && TEXT_STYLE_ROLES[font.textStyle]) {
		style.typography = TEXT_STYLE_ROLES[font.textStyle]
	}
	if (typeof font.size === 'number' && !font.textStyle) {
		style.fontSize = font.size
	}
	if (font.weight && WEIGHTS[font.weight]) {
		style.fontWeight = WEIGHTS[font.weight]
	}
	if (font.family) {
		style.fontFamily = font.family
	} else if (font.design && DESIGNS[font.design]) {
		style.fontFamily = DESIGNS[font.design]
	}
	if (font.leading === 'loose' || font.leading === 'tight') {
		let size = style.fontSize ?? ROLE_SIZES[style.typography ?? 'bodyLarge']
		style.lineHeight = Math.round(size * (font.leading === 'loose' ? 1.6 : 1.15))
	}
	return style
}

/** The font size, in sp, a text style resolves to. */
export function fontSizeOf(style: TextStyle): number {
	return style.fontSize ?? ROLE_SIZES[style.typography ?? 'bodyLarge']
}
