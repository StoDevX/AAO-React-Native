import * as React from 'react'

import {Collapsible} from '@expo/ui'
import type {
	DisclosureGroupProps,
	FormProps,
	LabeledContentProps,
	ListProps,
	SectionProps,
} from '@expo/ui/swift-ui'
import {
	Column,
	HorizontalDivider,
	LazyColumn,
	Row,
	Spacer as ComposeSpacer,
} from '@expo/ui/jetpack-compose'
import {
	background,
	clickable,
	fillMaxSize,
	fillMaxWidth,
	graphicsLayer,
	height,
	padding,
	weight,
	type ModifierConfig,
} from '@expo/ui/jetpack-compose/modifiers'

import {usePalette} from '../colors'
import {
	Claimed,
	ListSelectionContext,
	ListStyleContext,
	MenuContext,
	RowSlotContext,
	type RowPosition,
	type RowSlot,
	type RowStyle,
} from '../context'
import {
	AxisContext,
	EnvironmentContext,
	find,
	stringParam,
	toCompose,
	UnboundedContext,
	useAxis,
	useEnvironment,
	useLifecycle,
	type Environment,
	type ModifierList,
} from '../modifiers'
import {Inherit, Refreshable, Unbounded} from './layout'
import {ActionsMenu} from './menu'
import {MenuEntry} from './menu-entry'
import {RowCard, useRowSlot} from './row'
import {SymbolIcon} from './image'
import {Text} from './text'

/** Where the row at `index` of `count` sits. */
function positionOf(index: number, count: number): RowPosition {
	if (count <= 1) {
		return 'only'
	}
	if (index === 0) {
		return 'first'
	}
	return index === count - 1 ? 'last' : 'middle'
}

/** The data form of `List.ForEach`. */
type DataForEachProps<T> = {
	data: readonly T[]
	keyExtractor: (item: T, index: number) => string
	children: (info: {item: T; index: number}) => React.ReactElement
	onDelete?: (indices: number[]) => void
	onMove?: (sourceIndices: number[], destination: number) => void
}

/** The elements form of `List.ForEach`. */
type ElementsForEachProps = {
	data?: undefined
	children: React.ReactNode
	onDelete?: (indices: number[]) => void
	onMove?: (sourceIndices: number[], destination: number) => void
}

/** Either form of `List.ForEach`. */
type ForEachProps<T> = DataForEachProps<T> | ElementsForEachProps

/**
 * A row that can be deleted. Android lists have no swipe-to-delete, so the
 * row's long press opens a menu with Delete, the way a Material list offers
 * an item's actions.
 */
function deletable(row: React.ReactNode, key: React.Key, onDelete: () => void): React.ReactElement {
	return (
		<ActionsMenu
			actions={
				<MenuEntry destructive={true} label="Delete" onPress={onDelete} systemImage="trash" />
			}
			key={key}
		>
			{row}
		</ActionsMenu>
	)
}

/** A `List.ForEach`'s rows, keyed, with Delete on their long press when it has `onDelete`. */
function forEachRows<T>(props: ForEachProps<T>): React.ReactElement[] {
	let {onDelete} = props
	if (props.data) {
		let {data, keyExtractor, children: render} = props
		return data.map((item, index) => {
			let key = keyExtractor(item, index)
			let row = render({item, index})
			return onDelete ? (
				deletable(row, key, () => onDelete([index]))
			) : (
				<React.Fragment key={key}>{row}</React.Fragment>
			)
		})
	}
	return React.Children.toArray(props.children).map((row, index) => {
		let key = React.isValidElement(row) && row.key !== null ? row.key : index
		return onDelete ? (
			deletable(row, key, () => onDelete([index]))
		) : (
			<React.Fragment key={key}>{row}</React.Fragment>
		)
	})
}

/**
 * A section's (or a list's) rows, one entry per row: fragments opened, and a
 * `List.ForEach` expanded into its rows, so each gets its own slot.
 */
function flattenRows(children: React.ReactNode): React.ReactNode[] {
	let out: React.ReactNode[] = []
	React.Children.forEach(children, (child) => {
		if (child === null || child === undefined || typeof child === 'boolean') {
			return
		}
		if (
			React.isValidElement<{children?: React.ReactNode}>(child) &&
			child.type === React.Fragment
		) {
			out.push(...flattenRows(child.props.children))
			return
		}
		if (React.isValidElement<ForEachProps<unknown>>(child) && child.type === ListForEach) {
			out.push(...forEachRows(child.props))
			return
		}
		out.push(child)
	})
	return out
}

/** Provides one row's slot, rebuilt only when what it says changes. */
function SlotProvider({
	position,
	style,
	divider,
	spaced,
	background,
	children,
}: RowSlot & {children: React.ReactNode}): React.ReactNode {
	let slot = React.useMemo<RowSlot>(
		() => ({position, style, divider, spaced, background}),
		[position, style, divider, spaced, background],
	)
	return <RowSlotContext.Provider value={slot}>{children}</RowSlotContext.Provider>
}

/** Gives each row its slot: where it sits, and whether a divider follows it. */
function slotted(
	rows: React.ReactNode[],
	base: Omit<RowSlot, 'position' | 'divider'>,
): React.ReactNode[] {
	return rows.map((row, index) => {
		let key = React.isValidElement(row) && row.key !== null ? row.key : index
		return (
			<SlotProvider
				background={base.background}
				divider={base.style === 'plain' && index < rows.length - 1}
				key={key}
				position={positionOf(index, rows.length)}
				spaced={base.spaced === true && index === 0}
				style={base.style}
			>
				{row}
			</SlotProvider>
		)
	})
}

/**
 * SwiftUI's `List.ForEach`. Inside a `Section` its rows are expanded there;
 * standing in a list on its own, it hands each row a slot of its own.
 */
export function ListForEach<T>(props: ForEachProps<T>): React.ReactNode {
	let slot = useRowSlot()
	let rows = forEachRows(props)
	if (!slot) {
		return rows
	}
	return slotted(rows, {style: slot.style, spaced: slot.spaced, background: slot.background})
}

/** The insets of a grouped list, as FieldGroup sets them. */
const GROUPED_PADDING = {start: 16, end: 16, top: 0, bottom: 24}
/** A plain list's insets: full bleed, with room under the last row. */
const PLAIN_PADDING = {start: 0, end: 0, top: 0, bottom: 16}

/**
 * SwiftUI's `List` (and `Form`): a Material list. `insetGrouped` -- and every
 * style but `plain` -- draws FieldGroup's look: sections of rounded
 * `surfaceContainer` cards with 16dp margins on the `surface`. `plain` draws
 * full-bleed rows with dividers. Lazy, as a `LazyColumn`, unless it already
 * sits inside a vertical scroll; `refreshable` wraps it in a PullToRefreshBox.
 */
export function List(props: ListProps): React.ReactNode {
	let {children, modifiers, selection, onSelectionChange} = props
	return (
		<ListBody
			modifiers={modifiers}
			onSelectionChange={onSelectionChange}
			selection={selection}
			style={stringParam(modifiers, 'listStyle', 'style') === 'plain' ? 'plain' : 'grouped'}
		>
			{children}
		</ListBody>
	)
}
List.ForEach = ListForEach

/** SwiftUI's `Form`: a grouped `List`. */
export function Form({children, modifiers}: FormProps): React.ReactNode {
	return (
		<ListBody modifiers={modifiers} style="grouped">
			{children}
		</ListBody>
	)
}

/** What `List` and `Form` share. */
function ListBody({
	children,
	modifiers,
	selection,
	onSelectionChange,
	style,
}: {
	children?: React.ReactNode
	modifiers: ModifierList
	selection?: (string | number)[]
	onSelectionChange?: (selection: (string | number)[]) => void
	style: RowStyle
}): React.ReactNode {
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let unbounded = React.useContext(UnboundedContext)
	useLifecycle(modifiers)

	let chain: ModifierConfig[] = toCompose(modifiers, {palette, axis})
	if (!unbounded.vertical) {
		chain.push(...(axis === 'column' ? [weight(1), fillMaxWidth()] : [fillMaxSize()]))
	}
	if (stringParam(modifiers, 'scrollContentBackground', 'visible') !== 'hidden') {
		chain.push(background(palette.colors.surface))
	}

	let selecting = React.useMemo(
		() => (selection && onSelectionChange ? {selection, onSelectionChange} : null),
		[selection, onSelectionChange],
	)
	let rootSlot = React.useMemo<RowSlot>(
		() => ({position: 'only', style, divider: style === 'plain', spaced: style === 'grouped'}),
		[style],
	)
	let content = (
		<ListStyleContext.Provider value={style}>
			<ListSelectionContext.Provider value={selecting}>
				<Unbounded vertical={true}>
					<EnvironmentContext.Provider value={env}>
						<AxisContext.Provider value="none">
							<RowSlotContext.Provider value={rootSlot}>{children}</RowSlotContext.Provider>
						</AxisContext.Provider>
					</EnvironmentContext.Provider>
				</Unbounded>
			</ListSelectionContext.Provider>
		</ListStyleContext.Provider>
	)

	let contentPadding = style === 'grouped' ? GROUPED_PADDING : PLAIN_PADDING
	let list = unbounded.vertical ? (
		<Column
			modifiers={[
				...chain,
				padding(contentPadding.start, 0, contentPadding.end, contentPadding.bottom),
			]}
		>
			{content}
		</Column>
	) : (
		<LazyColumn contentPadding={contentPadding} modifiers={chain}>
			{content}
		</LazyColumn>
	)
	return <Refreshable modifier={find(modifiers, 'refreshable')}>{list}</Refreshable>
}

/** A section header's look: Material's list subheader, in the primary colour. */
function headerEnvironment(env: Environment, primary: string): Environment {
	return {...env, font: {textStyle: 'subheadline', weight: 'semibold'}, foreground: primary}
}

/** A section footer's look: supporting text. */
function footerEnvironment(env: Environment, secondary: string): Environment {
	return {...env, font: {textStyle: 'footnote'}, foreground: secondary}
}

/**
 * SwiftUI's `Section`. In a list it is not a view but a run of the list's
 * items -- its header, each row, its footer -- so a long section stays lazy;
 * each row is handed a slot for its card. In a menu it is a labelled group of
 * items. Anywhere else it draws as a short grouped list of its own.
 */
export function Section(props: SectionProps): React.ReactNode {
	let {title, header, footer, children, modifiers, isExpanded, onIsExpandedChange} = props
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let listStyle = React.useContext(ListStyleContext)
	let menu = React.useContext(MenuContext)
	let [ownExpanded, setOwnExpanded] = React.useState(true)
	useLifecycle(modifiers)

	if (menu) {
		return (
			<EnvironmentContext.Provider value={env}>
				{menu.index > 0 ? <MenuDivider /> : null}
				{title ? <MenuEntry label={title} /> : null}
				<RowSlotContext.Provider value={null}>{children}</RowSlotContext.Provider>
			</EnvironmentContext.Provider>
		)
	}

	let style: RowStyle = listStyle ?? 'grouped'
	let collapsible = onIsExpandedChange !== undefined || isExpanded !== undefined
	let expanded = isExpanded ?? ownExpanded
	let toggle = () => {
		setOwnExpanded(!expanded)
		onIsExpandedChange?.(!expanded)
	}

	let headerContent = header ?? (title ? <Text>{title}</Text> : null)
	let headerItem = headerContent ? (
		<Row
			key="header"
			modifiers={[fillMaxWidth(), padding(style === 'grouped' ? 16 : 16, 20, 16, 8)]}
			verticalAlignment="center"
		>
			<Inherit axis="row" env={headerEnvironment(env, palette.colors.primary)}>
				<Column modifiers={[weight(1)]}>{headerContent}</Column>
				{collapsible ? (
					<SymbolIcon
						color={palette.colors.primary}
						modifiers={[graphicsLayer({rotationZ: expanded ? 0 : -90})]}
						name="chevron.down"
						size={20}
					/>
				) : null}
			</Inherit>
		</Row>
	) : (
		<ComposeSpacer key="gap" modifiers={[height(style === 'grouped' ? 16 : 8)]} />
	)
	let footerItem = footer ? (
		<Column key="footer" modifiers={[fillMaxWidth(), padding(16, 8, 16, 0)]}>
			<Inherit axis="column" env={footerEnvironment(env, palette.colors.onSurfaceVariant)}>
				{footer}
			</Inherit>
		</Column>
	) : null

	let rows = expanded
		? slotted(flattenRows(children), {
				style,
				background: find(modifiers, 'listRowBackground')?.color,
			})
		: []
	let items = (
		<EnvironmentContext.Provider value={env}>
			{collapsible && headerContent ? (
				<CollapsibleHeader onPress={toggle}>{headerItem}</CollapsibleHeader>
			) : (
				headerItem
			)}
			{rows}
			{footerItem}
		</EnvironmentContext.Provider>
	)
	if (listStyle) {
		return items
	}
	// A section outside any list: its own short grouped list.
	return (
		<Column modifiers={[fillMaxWidth(), padding(16, 0, 16, 0)]}>
			<ListStyleContext.Provider value="grouped">
				<AxisContext.Provider value="none">{items}</AxisContext.Provider>
			</ListStyleContext.Provider>
		</Column>
	)
}

/** A collapsible section's header, which toggles the section when tapped. */
function CollapsibleHeader({
	children,
	onPress,
}: {
	children: React.ReactNode
	onPress: () => void
}): React.ReactNode {
	return (
		<RowSlotContext.Provider value={null}>
			<ClickableBox onPress={onPress}>{children}</ClickableBox>
		</RowSlotContext.Provider>
	)
}

/** A full-width box that runs `onPress` when tapped. */
function ClickableBox({
	children,
	onPress,
}: {
	children: React.ReactNode
	onPress: () => void
}): React.ReactNode {
	return <Column modifiers={[fillMaxWidth(), clickable(onPress)]}>{children}</Column>
}

/** The divider between two groups of a menu. */
function MenuDivider(): React.ReactNode {
	let palette = usePalette()
	return (
		<HorizontalDivider color={palette.colors.outlineVariant} modifiers={[padding(0, 8, 0, 8)]} />
	)
}

/** Whether a node is plain text, which a labelled row draws trailing. */
function isPlainValue(node: React.ReactNode): boolean {
	if (typeof node === 'string' || typeof node === 'number') {
		return true
	}
	return React.isValidElement(node) && node.type === Text
}

/**
 * SwiftUI's `LabeledContent`. In a list it is a Material list item: a short
 * text value trails the label, as a settings row shows it; any other content
 * (a field, a control) sits under the label as the item's supporting content,
 * where it has the row's width. Elsewhere, the label and value side by side.
 */
export function LabeledContent({label, children, modifiers}: LabeledContentProps): React.ReactNode {
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let slot = useRowSlot()
	let labelNode = typeof label === 'string' ? <Text>{label}</Text> : label
	let secondary = palette.colors.onSurfaceVariant
	let valueEnv = React.useMemo<Environment>(
		() => ({...env, foreground: secondary}),
		[env, secondary],
	)
	let value =
		typeof children === 'string' || typeof children === 'number' ? (
			<Text>{children}</Text>
		) : (
			children
		)

	if (slot) {
		let trailing = isPlainValue(children)
		let valueNode = (
			<EnvironmentContext.Provider value={trailing ? valueEnv : env}>
				{value}
			</EnvironmentContext.Provider>
		)
		return (
			<EnvironmentContext.Provider value={env}>
				<RowCard
					modifiers={modifiers}
					slot={slot}
					supporting={trailing ? undefined : valueNode}
					trailing={trailing ? valueNode : undefined}
				>
					{labelNode}
				</RowCard>
			</EnvironmentContext.Provider>
		)
	}
	return (
		<Row
			horizontalArrangement={{spacedBy: 16}}
			modifiers={toCompose(modifiers, {palette, axis})}
			verticalAlignment="center"
		>
			<Inherit axis="row" env={env}>
				<Column modifiers={[weight(1)]}>{labelNode}</Column>
				<EnvironmentContext.Provider value={valueEnv}>{value}</EnvironmentContext.Provider>
			</Inherit>
		</Row>
	)
}

/** `DisclosureGroup.Label`: the group's custom label, read by `DisclosureGroup`. */
function DisclosureLabel({children}: {children: React.ReactNode}): React.ReactNode {
	return children
}

/**
 * SwiftUI's `DisclosureGroup`. A plain string label draws as the universal
 * `Collapsible`, Expo's Material expandable section; a custom label (the JSON
 * tree's rows) draws the same way by hand: a list item with a turning chevron,
 * its content indented beneath when open.
 */
export function DisclosureGroup(props: DisclosureGroupProps): React.ReactNode {
	let {label, children, isExpanded, onIsExpandedChange, modifiers} = props
	let palette = usePalette()
	let slot = useRowSlot()
	let listStyle = React.useContext(ListStyleContext)
	let [ownOpen, setOwnOpen] = React.useState(false)
	let open = isExpanded ?? ownOpen
	let setOpen = (next: boolean) => {
		setOwnOpen(next)
		onIsExpandedChange?.(next)
	}

	let customLabel: React.ReactNode = null
	let content: React.ReactNode[] = []
	React.Children.forEach(children, (child) => {
		if (
			React.isValidElement<{children: React.ReactNode}>(child) &&
			child.type === DisclosureLabel
		) {
			customLabel = child.props.children
		} else {
			content.push(child)
		}
	})

	if (!customLabel && !slot) {
		return (
			<Collapsible isOpen={open} label={label ?? ''} onOpenChange={setOpen}>
				<Claimed>{content}</Claimed>
			</Collapsible>
		)
	}

	let chevron = (
		<SymbolIcon
			color={palette.colors.onSurfaceVariant}
			modifiers={[graphicsLayer({rotationZ: open ? 180 : 0})]}
			name="chevron.down"
			size={24}
		/>
	)
	let header = (
		<RowCard
			modifiers={modifiers}
			onPress={() => setOpen(!open)}
			slot={slot ?? {position: 'only', style: listStyle ?? 'grouped', divider: false}}
			trailing={chevron}
		>
			{customLabel ?? <Text>{label ?? ''}</Text>}
		</RowCard>
	)
	if (!open) {
		return header
	}
	let style = listStyle ?? 'grouped'
	return (
		<Column modifiers={[fillMaxWidth()]}>
			{header}
			<Column modifiers={[fillMaxWidth(), padding(16, 2, 0, 0)]}>
				{slotted(flattenRows(content), {style})}
			</Column>
		</Column>
	)
}
DisclosureGroup.Label = DisclosureLabel
