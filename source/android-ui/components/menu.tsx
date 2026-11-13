import * as React from 'react'

import type {MenuProps, SwipeActionsProps} from '@expo/ui/swift-ui'
import {
	Box,
	DropdownMenu,
	IconButton,
	Row,
	Text as ComposeText,
	TextButton,
} from '@expo/ui/jetpack-compose'
import {clickable, combinedClickable} from '@expo/ui/jetpack-compose/modifiers'

import {resolveColor, usePalette} from '../colors'
import {Claimed, LongPressContext, MenuContext, type MenuScope} from '../context'
import {EnvironmentContext, toCompose, useAxis, useEnvironment, useLifecycle} from '../modifiers'
import {Image, SymbolIcon} from './image'
import {MenuEntry} from './menu-entry'
import {RowCard, useRowSlot} from './row'
import {textOf} from './text'

/**
 * A menu's items, each told its place (a section after the first draws a
 * divider above itself) and how to close the menu.
 */
function MenuItems({
	children,
	close,
}: {
	children: React.ReactNode
	close: () => void
}): React.ReactNode {
	return React.Children.toArray(children).map((child, index) => {
		let key = React.isValidElement(child) && child.key !== null ? child.key : index
		return (
			<MenuSlot close={close} index={index} key={key}>
				{child}
			</MenuSlot>
		)
	})
}

/** Provides one menu item's scope, rebuilt only when it changes. */
function MenuSlot({
	close,
	index,
	children,
}: MenuScope & {children: React.ReactNode}): React.ReactNode {
	let scope = React.useMemo<MenuScope>(() => ({close, index}), [close, index])
	return <MenuContext.Provider value={scope}>{children}</MenuContext.Provider>
}

/**
 * SwiftUI's `Menu`, as a Material `DropdownMenu` anchored to its label. A
 * string label is a text button, an image label an icon button, and in a list
 * the menu is a row that opens it. Inside another menu it is a submenu item
 * that opens a second dropdown beside it. `onPrimaryAction` takes the tap and
 * leaves the long press to open the menu, as SwiftUI does.
 */
export function Menu(props: MenuProps): React.ReactNode {
	let {label, systemImage, onPrimaryAction, children, modifiers} = props
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let slot = useRowSlot()
	let parent = React.useContext(MenuContext)
	let [expanded, setExpanded] = React.useState(false)
	useLifecycle(modifiers)
	let open = React.useCallback(() => setExpanded(true), [])
	let close = React.useCallback(() => {
		setExpanded(false)
		parent?.close()
	}, [parent])
	let items = (
		<DropdownMenu.Items>
			<EnvironmentContext.Provider value={env}>
				<MenuItems close={close}>{children}</MenuItems>
			</EnvironmentContext.Provider>
		</DropdownMenu.Items>
	)

	if (parent) {
		return (
			<DropdownMenu expanded={expanded} onDismissRequest={() => setExpanded(false)}>
				<DropdownMenu.Trigger>
					<MenuEntry
						label={textOf(label) ?? ''}
						onPress={open}
						systemImage={systemImage}
						trailingSymbol="chevron.right"
					/>
				</DropdownMenu.Trigger>
				{items}
			</DropdownMenu>
		)
	}

	let press = onPrimaryAction ?? open
	let longPress = onPrimaryAction ? open : undefined
	let tint = resolveColor(env.tint, palette) ?? palette.colors.primary
	let chain = toCompose(modifiers, {palette, axis})
	let labelNode = typeof label === 'string' ? <ComposeText>{label}</ComposeText> : label

	let trigger: React.ReactNode
	if (slot) {
		trigger = (
			<LongPressContext.Provider value={longPress ?? null}>
				<RowCard
					leading={systemImage ? <SymbolIcon name={systemImage} size={24} /> : undefined}
					modifiers={modifiers}
					onPress={press}
					slot={slot}
				>
					{labelNode}
				</RowCard>
			</LongPressContext.Provider>
		)
	} else if (typeof label === 'string') {
		trigger = (
			<TextButton colors={{contentColor: tint}} onClick={press}>
				<Row horizontalArrangement={{spacedBy: 8}} verticalAlignment="center">
					{systemImage ? <SymbolIcon name={systemImage} size={18} /> : null}
					<ComposeText>{label}</ComposeText>
				</Row>
			</TextButton>
		)
	} else if (React.isValidElement(label) && label.type === Image) {
		trigger = (
			<IconButton colors={{contentColor: tint}} onClick={press}>
				<Claimed>{label}</Claimed>
			</IconButton>
		)
	} else {
		trigger = (
			<Box
				contentAlignment="center"
				modifiers={[
					longPress
						? combinedClickable({onClick: press, onLongClick: longPress})
						: clickable(press),
				]}
			>
				<Claimed>{label}</Claimed>
			</Box>
		)
	}
	return (
		<DropdownMenu expanded={expanded} modifiers={chain} onDismissRequest={() => setExpanded(false)}>
			<DropdownMenu.Trigger>{trigger}</DropdownMenu.Trigger>
			{items}
		</DropdownMenu>
	)
}

/**
 * A view whose long press opens a menu of actions: how a `ContextMenu`, a
 * row's `SwipeActions` and a deletable `List.ForEach` row draw on Android,
 * where a list row has no swipe. A button inside takes the long press itself
 * through `LongPressContext`, so its own tap still works.
 */
export function ActionsMenu({
	actions,
	children,
}: {
	actions: React.ReactNode
	children: React.ReactNode
}): React.ReactNode {
	let [expanded, setExpanded] = React.useState(false)
	let open = React.useCallback(() => setExpanded(true), [])
	let close = React.useCallback(() => setExpanded(false), [])
	return (
		<DropdownMenu
			expanded={expanded}
			modifiers={[combinedClickable({onLongClick: open}, {indication: false})]}
			onDismissRequest={close}
		>
			<DropdownMenu.Trigger>
				<LongPressContext.Provider value={open}>{children}</LongPressContext.Provider>
			</DropdownMenu.Trigger>
			<DropdownMenu.Items>
				<MenuItems close={close}>{actions}</MenuItems>
			</DropdownMenu.Items>
		</DropdownMenu>
	)
}

/** `ContextMenu.Trigger`, read by `ContextMenu`. */
function ContextTrigger({children}: {children: React.ReactNode}): React.ReactNode {
	return children
}

/** `ContextMenu.Items`, read by `ContextMenu`. */
function ContextItems({children}: {children: React.ReactNode}): React.ReactNode {
	return children
}

/** `ContextMenu.Preview`: Android menus draw no preview. */
function ContextPreview(_props: {children: React.ReactNode}): React.ReactNode {
	return null
}

/** The children of a given slot component among a compound component's children. */
function slotChildren(children: React.ReactNode, type: React.ElementType): React.ReactNode[] {
	let out: React.ReactNode[] = []
	React.Children.forEach(children, (child) => {
		if (React.isValidElement<{children?: React.ReactNode}>(child) && child.type === type) {
			out.push(child.props.children)
		}
	})
	return out
}

/** SwiftUI's `ContextMenu`: its trigger, with its items a long press away. */
export function ContextMenu({children}: {children: React.ReactNode}): React.ReactNode {
	return (
		<ActionsMenu actions={slotChildren(children, ContextItems)}>
			{slotChildren(children, ContextTrigger)}
		</ActionsMenu>
	)
}
ContextMenu.Trigger = ContextTrigger
ContextMenu.Items = ContextItems
ContextMenu.Preview = ContextPreview

/** `SwipeActions.Actions`: one edge's actions, read by `SwipeActions`. */
function SwipeActionsGroup(_props: {
	edge?: 'leading' | 'trailing'
	allowsFullSwipe?: boolean
	children: React.ReactNode
}): React.ReactNode {
	return null
}

/**
 * SwiftUI's `SwipeActions`. Android lists have no swipe actions, so a row's
 * actions -- both edges' -- open from its long press instead.
 */
export function SwipeActions({children}: SwipeActionsProps): React.ReactNode {
	let content: React.ReactNode[] = []
	React.Children.forEach(children, (child) => {
		if (!(React.isValidElement(child) && child.type === SwipeActionsGroup)) {
			content.push(child)
		}
	})
	let actions = slotChildren(children, SwipeActionsGroup)
	if (actions.length === 0) {
		return content
	}
	return <ActionsMenu actions={actions}>{content}</ActionsMenu>
}
SwipeActions.Actions = SwipeActionsGroup
