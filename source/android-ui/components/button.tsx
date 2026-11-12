import * as React from 'react'

import {Button as UniversalButton} from '@expo/ui'
import type {ButtonProps} from '@expo/ui/swift-ui'
import {
	Box,
	Button as ComposeButton,
	FilledIconButton,
	FilledTonalButton,
	FilledTonalIconButton,
	IconButton,
	Row,
	Text as ComposeText,
	TextButton,
	type ButtonColors,
} from '@expo/ui/jetpack-compose'
import {clickable, combinedClickable, type ModifierConfig} from '@expo/ui/jetpack-compose/modifiers'

import {resolveColor, usePalette} from '../colors'
import {Claimed, LongPressContext, MenuContext} from '../context'
import {
	EnvironmentContext,
	labelOf,
	toCompose,
	useAxis,
	useEnvironment,
	useLifecycle,
} from '../modifiers'
import {Image, SymbolIcon} from './image'
import {MenuEntry} from './menu-entry'
import {RowCard, useRowSlot} from './row'
import {textOf} from './text'

/** Which Material button a SwiftUI button style becomes. */
type Variant = 'filled' | 'tonal' | 'text' | 'bare'

/** SwiftUI's button styles, as Material button kinds. */
function variantOf(style: string | undefined): Variant {
	switch (style) {
		case 'borderedProminent':
		case 'glassProminent':
			return 'filled'
		case 'bordered':
		case 'glass':
			return 'tonal'
		case 'plain':
			return 'bare'
		default:
			return 'text'
	}
}

/** Whether a button's content is a lone image, which Material draws as an icon button. */
function isIconOnly(props: ButtonProps): boolean {
	if (props.label) {
		return false
	}
	if (props.systemImage && !props.children) {
		return true
	}
	return React.isValidElement(props.children) && props.children.type === Image
}

/**
 * SwiftUI's `Button`.
 *
 * - In a menu: a Material menu item.
 * - As a list row's outermost view: the whole row is a clickable list item; a
 *   string label reads in the primary colour (the error colour for a
 *   destructive role), as an action row does.
 * - Elsewhere: the Material button its `buttonStyle` maps to -- filled for
 *   `borderedProminent`, filled tonal for `bordered`, a text button for
 *   `borderless`/`automatic`, and for `plain` no chrome at all, only a ripple
 *   over its label. An image-only button is the matching icon button.
 */
export function Button(props: ButtonProps): React.ReactNode {
	let {onPress, systemImage, role, label, children, modifiers} = props
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let slot = useRowSlot()
	let menu = React.useContext(MenuContext)
	let onLongPress = React.useContext(LongPressContext)
	useLifecycle(modifiers)

	let destructive = role === 'destructive'
	let enabled = env.disabled !== true
	let press = () => onPress?.()

	if (menu) {
		return (
			<MenuEntry
				destructive={destructive}
				label={label ?? textOf(children) ?? labelOf(modifiers) ?? ''}
				onPress={press}
				systemImage={systemImage}
			/>
		)
	}

	let tint =
		(destructive ? palette.colors.error : resolveColor(env.tint, palette)) ?? palette.colors.primary

	if (slot) {
		let headline = children ?? (
			<ComposeText color={tint} style={{typography: 'bodyLarge'}}>
				{label ?? ''}
			</ComposeText>
		)
		return (
			<EnvironmentContext.Provider value={env}>
				<RowCard
					enabled={enabled}
					leading={
						systemImage ? <SymbolIcon color={tint} name={systemImage} size={24} /> : undefined
					}
					modifiers={modifiers}
					onPress={press}
					slot={slot}
				>
					{headline}
				</RowCard>
			</EnvironmentContext.Provider>
		)
	}

	let chain = toCompose(modifiers, {palette, axis, skipTaps: true})
	let variant = variantOf(env.buttonStyle)
	let content = (
		<EnvironmentContext.Provider value={env}>
			<Claimed>
				{children ?? (
					<Row horizontalArrangement={{spacedBy: 8}} verticalAlignment="center">
						{systemImage ? <SymbolIcon name={systemImage} size={label ? 18 : 24} /> : null}
						{label ? <ComposeText>{label}</ComposeText> : null}
					</Row>
				)}
			</Claimed>
		</EnvironmentContext.Provider>
	)

	if (variant === 'bare') {
		let tap: ModifierConfig | null = enabled
			? onLongPress
				? combinedClickable({onClick: press, onLongClick: onLongPress})
				: clickable(press)
			: null
		return (
			<Box contentAlignment="center" modifiers={tap ? [...chain, tap] : chain}>
				{content}
			</Box>
		)
	}

	let explicitTint = env.tint !== undefined || destructive
	if (isIconOnly(props)) {
		let IconKind =
			variant === 'filled'
				? FilledIconButton
				: variant === 'tonal'
					? FilledTonalIconButton
					: IconButton
		let colors =
			explicitTint && variant === 'text'
				? {contentColor: tint}
				: explicitTint
					? {containerColor: tint}
					: undefined
		return (
			<IconKind colors={colors} enabled={enabled} modifiers={chain} onClick={press}>
				{content}
			</IconKind>
		)
	}

	if (variant === 'tonal') {
		let colors: ButtonColors | undefined = explicitTint ? {contentColor: tint} : undefined
		return (
			<FilledTonalButton colors={colors} enabled={enabled} modifiers={chain} onClick={press}>
				{content}
			</FilledTonalButton>
		)
	}
	if (explicitTint) {
		// The universal Button takes no colours, so a tinted one is Compose's own.
		return variant === 'filled' ? (
			<ComposeButton
				colors={{containerColor: tint}}
				enabled={enabled}
				modifiers={chain}
				onClick={press}
			>
				{content}
			</ComposeButton>
		) : (
			<TextButton colors={{contentColor: tint}} enabled={enabled} modifiers={chain} onClick={press}>
				{content}
			</TextButton>
		)
	}
	// Filled and text buttons are the universal Button's `filled` and `text` variants.
	return (
		<UniversalButton
			disabled={!enabled}
			modifiers={chain}
			onPress={press}
			variant={variant === 'filled' ? 'filled' : 'text'}
		>
			{content}
		</UniversalButton>
	)
}
