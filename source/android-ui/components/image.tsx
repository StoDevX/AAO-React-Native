import * as React from 'react'

import {Icon as UniversalIcon} from '@expo/ui'
import type {ImageProps} from '@expo/ui/swift-ui'
import {Image as ComposeImage} from '@expo/ui/jetpack-compose'
import {clickable, type ModifierConfig} from '@expo/ui/jetpack-compose/modifiers'

import {resolveColor, usePalette} from '../colors'
import {MenuContext} from '../context'
import {
	useAxis,
	find,
	labelOf,
	stringParam,
	toCompose,
	useEnvironment,
	useLifecycle,
} from '../modifiers'
import {fontSizeOf, textStyleFor} from '../typography'
import {asRow, useRowSlot} from './row'
import {symbolSource} from './symbol'

/** Material's standard icon size, and SwiftUI's body-sized symbol. */
const DEFAULT_ICON_SIZE = 24

/** `imageScale(…)`'s steps, as a factor of the icon size. */
const IMAGE_SCALES: Readonly<Record<string, number>> = {small: 0.75, medium: 1, large: 1.25}

/** Props for a bare Material Symbol drawn for an SF Symbol name. */
type SymbolIconProps = {
	name: string | undefined
	size?: number
	color?: string
	contentDescription?: string
	modifiers?: ModifierConfig[]
}

/**
 * The Material Symbol standing in for an SF Symbol, through the universal
 * `Icon` with the bundled vector drawable as its Android source. With no
 * colour it takes the content colour of whatever it sits in.
 */
export function SymbolIcon({
	name,
	size,
	color,
	contentDescription,
	modifiers,
}: SymbolIconProps): React.ReactNode {
	return (
		<UniversalIcon
			accessibilityLabel={contentDescription}
			color={color}
			modifiers={modifiers}
			name={symbolSource(name)}
			size={size}
		/>
	)
}

/**
 * SwiftUI's `Image`. An SF Symbol (`systemName`) or custom symbol
 * (`assetName`) draws as its Material Symbol, sized from the font in effect
 * the way SwiftUI sizes a symbol to its text; `uiImage` draws the file. A
 * `resizable()` image takes the size its frame gives it.
 */
export function Image(props: ImageProps): React.ReactNode {
	let {systemName, assetName, uiImage, size, color, onPress, modifiers} = props
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let slot = useRowSlot()
	let menu = React.useContext(MenuContext)
	useLifecycle(modifiers)
	if (menu) {
		return null
	}

	let chain = toCompose(modifiers, {palette, axis})
	if (onPress) {
		chain.push(clickable(onPress))
	}
	let label = labelOf(modifiers)

	if (uiImage && !systemName && !assetName) {
		let element = (
			<ComposeImage
				contentDescription={label ?? null}
				contentScale="fit"
				modifiers={chain}
				source={{uri: uiImage}}
			/>
		)
		return asRow(slot, element, modifiers)
	}

	let frame = find(modifiers, 'frame')
	let frameSize = [frame?.width, frame?.height].filter(
		(value): value is number => typeof value === 'number',
	)
	let iconSize = size
	if (iconSize === undefined && find(modifiers, 'resizable') && frameSize.length > 0) {
		iconSize = Math.min(...frameSize)
	}
	if (iconSize === undefined) {
		let scale = IMAGE_SCALES[stringParam(modifiers, 'imageScale', 'scale') ?? 'medium'] ?? 1
		let base = env.font ? Math.round(fontSizeOf(textStyleFor(env.font)) * 1.3) : DEFAULT_ICON_SIZE
		iconSize = Math.round(base * scale)
	}

	let element = (
		<SymbolIcon
			color={resolveColor(color ?? env.foreground, palette)}
			contentDescription={label}
			modifiers={chain}
			name={systemName ?? assetName}
			size={iconSize}
		/>
	)
	return asRow(slot, element, modifiers)
}
