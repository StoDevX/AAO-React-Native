import type {ColorValue} from 'react-native'
import {
	buttonBorderShape,
	buttonStyle,
	controlSize,
	disabled,
	tint,
	type ModifierConfig,
} from '@expo/ui/swift-ui/modifiers'
import type {SFSymbol} from 'sf-symbols-typescript'
import * as c from '@frogpond/colors'
import {sto} from '../../../../lib/colors'

/** The styles SwiftUI offers a button, in the order the sheet lists them. */
export const BUTTON_STYLES = [
	'automatic',
	'bordered',
	'borderedProminent',
	'borderless',
	'plain',
	'glass',
	'glassProminent',
] as const

export const CONTROL_SIZES = ['mini', 'small', 'regular', 'large', 'extraLarge'] as const

export const BUTTON_ROLES = ['default', 'cancel', 'destructive'] as const

export const BORDER_SHAPES = ['automatic', 'capsule', 'roundedRectangle', 'circle'] as const

/** Colours to tint with: the system's own, and the app's accent. */
export const TINTS: Record<string, {name: string; color: ColorValue | null}> = {
	default: {name: 'Default', color: null},
	gold: {name: 'St. Olaf Gold', color: sto.gold},
	red: {name: 'Red', color: c.systemRed},
	green: {name: 'Green', color: c.systemGreen},
	purple: {name: 'Purple', color: c.systemPurple},
}

/** Symbols to try before the label; `none` draws the label alone. */
export const PLAYGROUND_SYMBOLS = [
	'none',
	'star.fill',
	'arrow.clockwise',
	'plus',
	'trash',
	'square.and.arrow.up',
] as const

export type ButtonPlayground = {
	label: string
	/** Drawn before the label when set. */
	systemImage: SFSymbol | null
	style: (typeof BUTTON_STYLES)[number]
	size: (typeof CONTROL_SIZES)[number]
	role: (typeof BUTTON_ROLES)[number]
	shape: (typeof BORDER_SHAPES)[number]
	tint: keyof typeof TINTS
	disabled: boolean
}

export const DEFAULT_BUTTON: ButtonPlayground = {
	label: 'Tap Me',
	systemImage: null,
	style: 'bordered',
	size: 'regular',
	role: 'default',
	shape: 'automatic',
	tint: 'default',
	disabled: false,
}

/** The modifiers that draw the playground's button as it is set. */
export function playgroundModifiers(button: ButtonPlayground): ModifierConfig[] {
	let color = TINTS[button.tint]?.color ?? null
	return [
		buttonStyle(button.style),
		controlSize(button.size),
		buttonBorderShape(button.shape),
		...(color ? [tint(color)] : []),
		disabled(button.disabled),
	]
}
