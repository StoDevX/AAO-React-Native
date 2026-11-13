import * as React from 'react'
import {Linking} from 'react-native'

import type {
	HangingTextProps,
	LabelProps,
	LinkProps,
	TextProps as SwiftTextProps,
} from '@expo/ui/swift-ui'
import {Row, Text as ComposeText} from '@expo/ui/jetpack-compose'
import {clickable, testID as testIDModifier} from '@expo/ui/jetpack-compose/modifiers'

import {contentColor, resolveColor, usePalette, type Palette} from '../colors'
import {Claimed, MenuContext} from '../context'
import {
	useAxis,
	identityOf,
	mergeEnvironment,
	toCompose,
	useEnvironment,
	useLifecycle,
	type Environment,
} from '../modifiers'
import {fontSizeOf, ROLE_SIZES, textStyleFor, type TextStyle} from '../typography'
import {MenuEntry} from './menu-entry'
import {asRow, RowCard, useRowSlot} from './row'
import {SymbolIcon} from './image'

/** A Compose text style for an environment: font role, weight, decoration and spacing. */
export function composeTextStyle(env: Environment): TextStyle {
	let style = textStyleFor(env.font)
	if (env.bold && (style.fontWeight === undefined || Number(style.fontWeight) < 700)) {
		style.fontWeight = '700'
	}
	if (env.italic) {
		style.fontStyle = 'italic'
	}
	if (env.underline) {
		style.textDecoration = 'underline'
	} else if (env.strikethrough) {
		style.textDecoration = 'lineThrough'
	}
	if (env.kerning !== undefined) {
		style.letterSpacing = env.kerning
	}
	if (env.lineHeight !== undefined) {
		style.lineHeight = env.lineHeight
	} else if (env.lineSpacing !== undefined) {
		style.lineHeight = Math.round(fontSizeOf(style) * 1.4 + env.lineSpacing)
	}
	if (env.textAlign) {
		style.textAlign = env.textAlign
	}
	return style
}

/** A span's style: a nested text cannot take a type role, so its role becomes a size. */
function spanStyle(env: Environment): TextStyle {
	let style = composeTextStyle(env)
	if (style.typography) {
		style.fontSize = style.fontSize ?? ROLE_SIZES[style.typography]
		delete style.typography
	}
	delete style.textAlign
	delete style.lineHeight
	return style
}

/** A string in the case `textCase(…)` asks for. */
function cased(text: string, env: Environment): string {
	if (env.textCase === 'uppercase') {
		return text.toUpperCase()
	}
	if (env.textCase === 'lowercase') {
		return text.toLowerCase()
	}
	return text
}

/** Inline Markdown's markers, in the order they are tried. */
const MARKDOWN =
	/(\*\*|__)(.+?)\1|(\*|_)(.+?)\3|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)|\\([\\`*_{}[\]()#+\-.!])/u

/**
 * Inline Markdown as Compose spans: strong, emphasis, code and links (drawn
 * in the primary colour, underlined). Links are not tappable inside a span;
 * SwiftUI's would be. Anything else is the literal text.
 */
function markdownSpans(source: string, palette: Palette, env: Environment): React.ReactNode[] {
	let out: React.ReactNode[] = []
	let rest = source
	let key = 0
	while (rest.length > 0) {
		let match = MARKDOWN.exec(rest)
		if (!match) {
			out.push(cased(rest, env))
			break
		}
		if (match.index > 0) {
			out.push(cased(rest.slice(0, match.index), env))
		}
		let [, , strong, , emphasis, code, linkText, , escaped] = match
		key += 1
		if (strong !== undefined) {
			out.push(
				<ComposeText key={key} style={{fontWeight: '700'}}>
					{markdownSpans(strong, palette, env)}
				</ComposeText>,
			)
		} else if (emphasis !== undefined) {
			out.push(
				<ComposeText key={key} style={{fontStyle: 'italic'}}>
					{markdownSpans(emphasis, palette, env)}
				</ComposeText>,
			)
		} else if (code !== undefined) {
			out.push(
				<ComposeText key={key} style={{fontFamily: 'monospace'}}>
					{code}
				</ComposeText>,
			)
		} else if (linkText !== undefined) {
			out.push(
				<ComposeText color={palette.colors.primary} key={key} style={{textDecoration: 'underline'}}>
					{cased(linkText, env)}
				</ComposeText>,
			)
		} else if (escaped !== undefined) {
			out.push(escaped)
		}
		rest = rest.slice(match.index + match[0].length)
	}
	return out
}

/**
 * A SwiftUI `Text`'s children as Compose text children: strings and numbers
 * as they are, a nested `Text` as a span carrying its own font and colour.
 * Anything else is dropped, as SwiftUI's `Text` concatenation drops it.
 */
function textChildren(
	children: React.ReactNode,
	env: Environment,
	palette: Palette,
	markdown: boolean,
): React.ReactNode[] {
	let out: React.ReactNode[] = []
	React.Children.forEach(children, (child) => {
		if (typeof child === 'string') {
			out.push(...(markdown ? markdownSpans(child, palette, env) : [cased(child, env)]))
		} else if (typeof child === 'number') {
			out.push(String(child))
		} else if (React.isValidElement<SwiftTextProps>(child) && child.type === Text) {
			let childEnv = mergeEnvironment({textCase: env.textCase}, child.props.modifiers)
			out.push(
				<ComposeText
					color={resolveColor(childEnv.foreground, palette)}
					key={out.length}
					style={spanStyle(childEnv)}
				>
					{textChildren(
						child.props.children,
						childEnv,
						palette,
						child.props.markdownEnabled === true,
					)}
				</ComposeText>,
			)
		}
	})
	return out
}

/** A date as SwiftUI's `Text(date, style:)` would print it, frozen at render. */
function formatDate(date: Date, style: SwiftTextProps['dateStyle']): string {
	switch (style) {
		case 'time':
			return date.toLocaleTimeString(undefined, {hour: 'numeric', minute: '2-digit'})
		case 'relative':
		case 'offset':
		case 'timer': {
			let minutes = Math.round((date.getTime() - Date.now()) / 60_000)
			let span = Math.abs(minutes)
			let amount = span >= 60 ? `${Math.round(span / 60)} hr` : `${span} min`
			return minutes >= 0 ? amount : `${amount} ago`
		}
		default:
			return date.toLocaleDateString(undefined, {dateStyle: 'medium'})
	}
}

/** The string a label view would say, for a menu item or an accessible name. */
export function textOf(node: React.ReactNode): string | undefined {
	if (typeof node === 'string' || typeof node === 'number') {
		return String(node)
	}
	if (Array.isArray(node)) {
		let parts = node.map(textOf).filter((part): part is string => Boolean(part))
		return parts.length > 0 ? parts.join(' ') : undefined
	}
	if (React.isValidElement<{children?: React.ReactNode; title?: unknown; label?: unknown}>(node)) {
		if (typeof node.props.title === 'string') {
			return node.props.title
		}
		if (typeof node.props.label === 'string') {
			return node.props.label
		}
		return textOf(node.props.children)
	}
	return undefined
}

/**
 * SwiftUI's `Text`, as Compose's `Text` in the Material type role its font
 * maps to. Inherits font, colour, line limit and alignment from the
 * environment its containers set.
 */
export function Text(props: SwiftTextProps): React.ReactNode {
	let {children, markdownEnabled, modifiers, testID, date, dateStyle} = props
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let slot = useRowSlot()
	let menu = React.useContext(MenuContext)
	useLifecycle(modifiers)

	let content =
		date instanceof Date
			? [cased(formatDate(date, dateStyle), env)]
			: textChildren(children, env, palette, markdownEnabled === true)

	if (menu) {
		return (
			<MenuEntry label={content.map((part) => (typeof part === 'string' ? part : '')).join('')} />
		)
	}

	let chain = toCompose(modifiers, {palette, axis})
	if (testID) {
		chain.push(testIDModifier(testID))
	}
	let maxLines = env.lineLimit?.max
	let element = (
		<ComposeText
			color={contentColor(env.foreground, palette, env.colorScheme)}
			key={identityOf(modifiers)}
			maxLines={maxLines}
			minLines={env.lineLimit?.min}
			modifiers={chain}
			overflow={maxLines !== undefined || env.truncate ? 'ellipsis' : undefined}
			style={composeTextStyle(env)}
		>
			{content}
		</ComposeText>
	)
	return asRow(slot, element, modifiers)
}

/**
 * The patched `HangingText`: a Markdown string with a hanging indent. Compose
 * text has no paragraph indent, so it draws as body Markdown text in the
 * given colour and face, without the indent.
 */
export function HangingText(props: HangingTextProps): React.ReactNode {
	let {children, modifiers, color, linkColor: _linkColor, serif, lineSpacing} = props
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let slot = useRowSlot()
	let style: TextStyle = {typography: 'bodyLarge'}
	if (serif) {
		style.fontFamily = 'serif'
	}
	if (typeof lineSpacing === 'number') {
		style.lineHeight = Math.round(ROLE_SIZES.bodyLarge * 1.4 + lineSpacing)
	}
	let element = (
		<ComposeText
			color={contentColor(color ?? env.foreground, palette, env.colorScheme)}
			modifiers={toCompose(modifiers, {palette, axis})}
			style={style}
		>
			{markdownSpans(typeof children === 'string' ? children : '', palette, env)}
		</ComposeText>
	)
	return asRow(slot, element, modifiers)
}

/** Opens a link, swallowing a refusal: there is nothing more a tap can do. */
function open(destination: string): void {
	Linking.openURL(destination).catch(() => undefined)
}

/**
 * SwiftUI's `Link`: in a list, a row that opens the address with the
 * open-in-new glyph trailing; elsewhere, its label in the primary colour.
 */
export function Link(props: LinkProps): React.ReactNode {
	let {label, destination, children, modifiers} = props
	let palette = usePalette()
	let axis = useAxis()
	let slot = useRowSlot()
	let menu = React.useContext(MenuContext)
	let title = label ?? destination
	let onPress = () => open(destination)

	if (menu) {
		return (
			<MenuEntry label={textOf(children) ?? title} onPress={onPress} systemImage="arrow.up.right" />
		)
	}
	let body = children ?? (
		<ComposeText color={palette.colors.primary} style={{typography: 'bodyLarge'}}>
			{title}
		</ComposeText>
	)
	if (slot) {
		return (
			<RowCard
				modifiers={modifiers}
				onPress={onPress}
				slot={slot}
				trailing={
					<SymbolIcon color={palette.colors.onSurfaceVariant} name="arrow.up.right" size={20} />
				}
			>
				{body}
			</RowCard>
		)
	}
	return (
		<Row modifiers={[...toCompose(modifiers, {palette, axis}), clickable(onPress)]}>
			<Claimed>{body}</Claimed>
		</Row>
	)
}

/**
 * SwiftUI's `Label`: an icon before a title. In a list row the icon is the
 * list item's leading content, as Material's settings rows draw it.
 */
export function Label(props: LabelProps): React.ReactNode {
	let {title, systemImage, icon, children, modifiers} = props
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let slot = useRowSlot()
	let menu = React.useContext(MenuContext)
	let tint = contentColor(env.foreground, palette, env.colorScheme)
	let size = Math.round(fontSizeOf(composeTextStyle(env)) * 1.4)

	if (menu) {
		return <MenuEntry label={textOf(children) ?? title ?? ''} systemImage={systemImage} />
	}
	let glyph =
		icon ?? (systemImage ? <SymbolIcon color={tint} name={systemImage} size={size} /> : null)
	let text = children ?? (
		<ComposeText color={tint} style={composeTextStyle(env)}>
			{title ?? ''}
		</ComposeText>
	)
	if (slot) {
		return (
			<RowCard leading={glyph} modifiers={modifiers} slot={slot}>
				{text}
			</RowCard>
		)
	}
	return (
		<Row
			horizontalArrangement={{spacedBy: 12}}
			modifiers={toCompose(modifiers, {palette, axis})}
			verticalAlignment="center"
		>
			<Claimed>
				{glyph}
				{text}
			</Claimed>
		</Row>
	)
}
