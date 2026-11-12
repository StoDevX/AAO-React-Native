import * as React from 'react'

import {gold} from '@frogpond/colors'
import type {
	CircleProps,
	DividerProps,
	GridProps,
	GroupProps,
	HostProps,
	HStackProps,
	LazyHStackProps,
	LazyVStackProps,
	RectangleProps,
	RoundedRectangleProps,
	RNHostViewProps,
	ScrollViewProps,
	SpacerProps,
	VStackProps,
	ZStackProps,
} from '@expo/ui/swift-ui'
import {
	Box,
	Column,
	Host as ComposeHost,
	HorizontalDivider,
	isDynamicColorAvailable,
	LazyColumn,
	LazyRow,
	PullToRefreshBox,
	RNHostView as ComposeRNHostView,
	Row,
	Spacer as ComposeSpacer,
	VerticalDivider,
} from '@expo/ui/jetpack-compose'
import {
	background,
	clip,
	fillMaxSize,
	fillMaxWidth,
	height,
	horizontalScroll,
	matchParentSize,
	verticalScroll,
	weight,
	width,
	type BuiltinShape,
	type ModifierConfig,
} from '@expo/ui/jetpack-compose/modifiers'

import {resolveColor, usePalette} from '../colors'
import {ListStyleContext, MenuContext, RowSlotContext} from '../context'
import {
	AxisContext,
	EnvironmentContext,
	find,
	runRefresh,
	shapeOf,
	toCompose,
	UnboundedContext,
	useAxis,
	useEnvironment,
	useLifecycle,
	type Axis,
	type Environment,
	type ModifierList,
	type SwiftModifier,
} from '../modifiers'
import {asRow, useRowSlot} from './row'

/** A Host starts with an empty SwiftUI environment. */
const NO_ENVIRONMENT: Environment = {}

/** SwiftUI's default spacing between a stack's children. */
const DEFAULT_SPACING = 8

/**
 * Provides what a container's children inherit: its environment, and the axis
 * their frames grow along.
 */
export function Inherit({
	env,
	axis,
	children,
}: {
	env: Environment
	axis: Axis
	children?: React.ReactNode
}): React.ReactNode {
	return (
		<EnvironmentContext.Provider value={env}>
			<AxisContext.Provider value={axis}>
				<RowSlotContext.Provider value={null}>{children}</RowSlotContext.Provider>
			</AxisContext.Provider>
		</EnvironmentContext.Provider>
	)
}

/**
 * Marks the views inside as measured without a bound along an axis -- inside
 * a scroll or a lazy list -- adding to whatever the parent already marked.
 */
export function Unbounded({
	vertical = false,
	horizontal = false,
	children,
}: {
	vertical?: boolean
	horizontal?: boolean
	children?: React.ReactNode
}): React.ReactNode {
	let parent = React.useContext(UnboundedContext)
	let value = React.useMemo(
		() => ({vertical: parent.vertical || vertical, horizontal: parent.horizontal || horizontal}),
		[parent, vertical, horizontal],
	)
	return <UnboundedContext.Provider value={value}>{children}</UnboundedContext.Provider>
}

/** The shared preamble of a container: palette, environment, lifecycle, chain. */
function useContainer(modifiers: ModifierList): {
	env: Environment
	chain: ModifierConfig[]
	slot: ReturnType<typeof useRowSlot>
} {
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let slot = useRowSlot()
	useLifecycle(modifiers)
	return {env, chain: toCompose(modifiers, {palette, axis}), slot}
}

/**
 * The seed a `Host` derives its palette from when the screen gives none:
 * none where the system has dynamic colour, so Compose takes the wallpaper's
 * as the theme does, and the brand gold where it has not, which the theme
 * plugin seeds the same palette from.
 */
const FALLBACK_SEED = isDynamicColorAvailable ? undefined : gold

/**
 * SwiftUI's `Host`, as Expo UI's Compose `Host`. Its palette is the one the
 * app's theme has (plugins/with-material-theme): the wallpaper's dynamic
 * colours on Android 12 and later, and below that a palette seeded from the
 * brand gold. Either way every Material role below it follows light and dark,
 * and matches the React Native views and navigation bars around it, which read
 * the same roles from the theme. `@expo/ui`'s `useMaterialColors()` reads it.
 */
export function Host(props: HostProps): React.ReactNode {
	let {
		children,
		modifiers: _modifiers,
		alignment: _alignment,
		ignoreSafeArea: _ignoreSafeArea,
		seedColor,
		...rest
	} = props
	return (
		<ComposeHost {...rest} seedColor={seedColor ?? FALLBACK_SEED}>
			<Inherit axis="none" env={NO_ENVIRONMENT}>
				<ListStyleContext.Provider value={null}>
					<MenuContext.Provider value={null}>{children}</MenuContext.Provider>
				</ListStyleContext.Provider>
			</Inherit>
		</ComposeHost>
	)
}

/** SwiftUI's vertical alignments, as Row's. */
const ROW_ALIGNMENT = {
	top: 'top',
	center: 'center',
	bottom: 'bottom',
	firstTextBaseline: 'top',
	lastTextBaseline: 'bottom',
} as const

/** SwiftUI's horizontal alignments, as Column's. */
const COLUMN_ALIGNMENT = {leading: 'start', center: 'center', trailing: 'end'} as const

/** SwiftUI's `VStack`, as a Compose `Column`. */
export function VStack({children, modifiers, alignment, spacing}: VStackProps): React.ReactNode {
	let {env, chain, slot} = useContainer(modifiers)
	let element = (
		<Column
			horizontalAlignment={COLUMN_ALIGNMENT[alignment ?? 'center']}
			modifiers={chain}
			verticalArrangement={{spacedBy: spacing ?? DEFAULT_SPACING}}
		>
			<Inherit axis="column" env={env}>
				{children}
			</Inherit>
		</Column>
	)
	return asRow(slot, element, modifiers)
}

/** SwiftUI's `HStack`, as a Compose `Row`. */
export function HStack({children, modifiers, alignment, spacing}: HStackProps): React.ReactNode {
	let {env, chain, slot} = useContainer(modifiers)
	let element = (
		<Row
			horizontalArrangement={{spacedBy: spacing ?? DEFAULT_SPACING}}
			modifiers={chain}
			verticalAlignment={ROW_ALIGNMENT[alignment ?? 'center']}
		>
			<Inherit axis="row" env={env}>
				{children}
			</Inherit>
		</Row>
	)
	return asRow(slot, element, modifiers)
}

/** Where a Compose `Box` puts its children. */
type ContentAlignment = NonNullable<React.ComponentProps<typeof Box>['contentAlignment']>

/** SwiftUI's alignments, as a Box's content alignment. */
const BOX_ALIGNMENT: Readonly<Record<string, ContentAlignment>> = {
	center: 'center',
	leading: 'centerStart',
	trailing: 'centerEnd',
	top: 'topCenter',
	bottom: 'bottomCenter',
	topLeading: 'topStart',
	topTrailing: 'topEnd',
	bottomLeading: 'bottomStart',
	bottomTrailing: 'bottomEnd',
}

/** SwiftUI's `ZStack`, as a Compose `Box` that layers its children. */
export function ZStack({children, modifiers, alignment}: ZStackProps): React.ReactNode {
	let {env, chain, slot} = useContainer(modifiers)
	let element = (
		<Box contentAlignment={BOX_ALIGNMENT[alignment ?? 'center'] ?? 'center'} modifiers={chain}>
			<Inherit axis="box" env={env}>
				{children}
			</Inherit>
		</Box>
	)
	return asRow(slot, element, modifiers)
}

/**
 * SwiftUI's `Group`: no view of its own, only an environment for its
 * children. Its layout modifiers need a view to sit on, so outside a list a
 * Group that carries any becomes a `Box`; in a list that would merge its rows
 * into one, so there they are dropped.
 */
export function Group({children, modifiers}: GroupProps): React.ReactNode {
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let list = React.useContext(ListStyleContext)
	let menu = React.useContext(MenuContext)
	useLifecycle(modifiers)
	let chain = toCompose(modifiers, {palette, axis})
	let inner = <EnvironmentContext.Provider value={env}>{children}</EnvironmentContext.Provider>
	if (list || menu || chain.length === 0) {
		return inner
	}
	return <Box modifiers={chain}>{inner}</Box>
}

/**
 * SwiftUI's `Spacer`: in a stack, a weighted Compose `Spacer` that takes the
 * stack's spare room, at least `minLength` long.
 */
export function Spacer({minLength, modifiers}: SpacerProps): React.ReactNode {
	let palette = usePalette()
	let axis = useAxis()
	let chain = toCompose(modifiers, {palette, axis})
	if (axis === 'row' || axis === 'column') {
		chain.push(weight(1))
	}
	if (typeof minLength === 'number') {
		chain.push(axis === 'row' ? width(minLength) : height(minLength))
	}
	return <ComposeSpacer modifiers={chain} />
}

/** SwiftUI's `Divider`: a Material divider, vertical in a row. */
export function Divider({modifiers}: DividerProps): React.ReactNode {
	let palette = usePalette()
	let axis = React.useContext(AxisContext)
	let chain = toCompose(modifiers, {palette, axis})
	if (axis === 'row') {
		return <VerticalDivider color={palette.colors.outlineVariant} modifiers={chain} />
	}
	return <HorizontalDivider color={palette.colors.outlineVariant} modifiers={chain} />
}

/** A pull-to-refresh wrapper for a `refreshable(…)` modifier, or nothing without one. */
export function Refreshable({
	modifier,
	children,
}: {
	modifier: SwiftModifier | undefined
	children: React.ReactNode
}): React.ReactNode {
	let [isRefreshing, setIsRefreshing] = React.useState(false)
	if (!modifier) {
		return children
	}
	return (
		<PullToRefreshBox
			contentAlignment="topCenter"
			isRefreshing={isRefreshing}
			modifiers={[fillMaxSize()]}
			onRefresh={() => {
				setIsRefreshing(true)
				void runRefresh(modifier).finally(() => setIsRefreshing(false))
			}}
		>
			{children}
		</PullToRefreshBox>
	)
}

/**
 * SwiftUI's `ScrollView`, as a Column or Row with Compose's scroll modifier,
 * inside a PullToRefreshBox when it is `refreshable`.
 */
export function ScrollView({children, modifiers, axes}: ScrollViewProps): React.ReactNode {
	let {env, chain, slot} = useContainer(modifiers)
	let axis = useAxis()
	let horizontal = axes === 'horizontal'
	let element: React.ReactNode
	if (horizontal) {
		element = (
			<Row modifiers={[...chain, fillMaxWidth(), horizontalScroll()]} verticalAlignment="center">
				<Unbounded horizontal={true}>
					<Inherit axis="row" env={env}>
						{children}
					</Inherit>
				</Unbounded>
			</Row>
		)
	} else {
		let fill = axis === 'column' ? [weight(1), fillMaxWidth()] : [fillMaxSize()]
		element = (
			<Column modifiers={[...chain, ...fill, verticalScroll()]}>
				<Unbounded vertical={true}>
					<Inherit axis="column" env={env}>
						{children}
					</Inherit>
				</Unbounded>
			</Column>
		)
	}
	return asRow(
		slot,
		<Refreshable modifier={find(modifiers, 'refreshable')}>{element}</Refreshable>,
		modifiers,
	)
}

/** The data form of a lazy stack's `ForEach`. */
type LazyForEachProps<T> = {
	data: readonly T[]
	keyExtractor: (item: T, index: number) => string
	children: (info: {item: T; index: number}) => React.ReactElement
}

/** A lazy stack's `ForEach`: each item, keyed, in place. */
function LazyForEach<T>({data, keyExtractor, children}: LazyForEachProps<T>): React.ReactNode {
	return data.map((item, index) => (
		<React.Fragment key={keyExtractor(item, index)}>{children({item, index})}</React.Fragment>
	))
}

/**
 * SwiftUI's `LazyVStack`: a `LazyColumn`, unless it already sits in a
 * vertical scroll (the usual `ScrollView { LazyVStack }`), where a second
 * scrolling list would be measured without a height and throw, so it is a
 * plain `Column` there.
 */
export function LazyVStack({
	children,
	modifiers,
	alignment,
	spacing,
}: LazyVStackProps): React.ReactNode {
	let {env, chain, slot} = useContainer(modifiers)
	let unbounded = React.useContext(UnboundedContext)
	let arrangement = {spacedBy: spacing ?? DEFAULT_SPACING}
	let align = COLUMN_ALIGNMENT[alignment ?? 'center']
	let inner = (
		<Unbounded vertical={true}>
			<Inherit axis="column" env={env}>
				{children}
			</Inherit>
		</Unbounded>
	)
	let element = unbounded.vertical ? (
		<Column horizontalAlignment={align} modifiers={chain} verticalArrangement={arrangement}>
			{inner}
		</Column>
	) : (
		<LazyColumn horizontalAlignment={align} modifiers={chain} verticalArrangement={arrangement}>
			{inner}
		</LazyColumn>
	)
	return asRow(slot, element, modifiers)
}
LazyVStack.ForEach = LazyForEach

/** SwiftUI's `LazyHStack`: a `LazyRow`, or a `Row` inside a horizontal scroll. */
export function LazyHStack({
	children,
	modifiers,
	alignment,
	spacing,
}: LazyHStackProps): React.ReactNode {
	let {env, chain, slot} = useContainer(modifiers)
	let unbounded = React.useContext(UnboundedContext)
	let arrangement = {spacedBy: spacing ?? DEFAULT_SPACING}
	let align = ROW_ALIGNMENT[alignment ?? 'center']
	let inner = (
		<Unbounded horizontal={true}>
			<Inherit axis="row" env={env}>
				{children}
			</Inherit>
		</Unbounded>
	)
	let element = unbounded.horizontal ? (
		<Row horizontalArrangement={arrangement} modifiers={chain} verticalAlignment={align}>
			{inner}
		</Row>
	) : (
		<LazyRow horizontalArrangement={arrangement} modifiers={chain} verticalAlignment={align}>
			{inner}
		</LazyRow>
	)
	return asRow(slot, element, modifiers)
}
LazyHStack.ForEach = LazyForEach

/** The spacing a `Grid` sets between its rows and cells. */
const GridSpacing = React.createContext<number>(DEFAULT_SPACING)

/**
 * SwiftUI's `Grid`, as a Column of Rows whose cells share each row's width
 * equally -- the even columns the app's grids are. Cells that are Compose
 * views filling their width (the newspaper's issue tiles) need that weighted
 * box around them in any case.
 */
export function Grid({
	children,
	modifiers,
	horizontalSpacing,
	verticalSpacing,
}: GridProps): React.ReactNode {
	let {env, chain, slot} = useContainer(modifiers)
	let element = (
		<Column modifiers={chain} verticalArrangement={{spacedBy: verticalSpacing ?? DEFAULT_SPACING}}>
			<GridSpacing.Provider value={horizontalSpacing ?? DEFAULT_SPACING}>
				<Inherit axis="column" env={env}>
					{children}
				</Inherit>
			</GridSpacing.Provider>
		</Column>
	)
	return asRow(slot, element, modifiers)
}

/** One `Grid` row: each child in an equal share of the width. */
Grid.Row = function GridRow({children}: {children: React.ReactNode}): React.ReactNode {
	let spacing = React.useContext(GridSpacing)
	return (
		<Row
			horizontalArrangement={{spacedBy: spacing}}
			modifiers={[fillMaxWidth()]}
			verticalAlignment="center"
		>
			{React.Children.toArray(children).map((child, index) => (
				// oxlint-disable-next-line react/no-array-index-key -- a cell's column is its identity
				<Box contentAlignment="center" key={index} modifiers={[weight(1)]}>
					<AxisContext.Provider value="box">{child}</AxisContext.Provider>
				</Box>
			))}
		</Row>
	)
}

/**
 * A SwiftUI shape as a filled Compose `Box`: the shape's clip and fill, in the
 * foreground colour SwiftUI fills shapes with. A shape takes all the room its
 * frame or parent offers.
 */
function ShapeView({
	modifiers,
	shape,
}: {
	modifiers: ModifierList
	shape: BuiltinShape
}): React.ReactNode {
	let palette = usePalette()
	let env = useEnvironment(modifiers)
	let axis = useAxis()
	let chain = toCompose(modifiers, {palette, axis})
	// Inside a ZStack a shape is a layer the size of its siblings; elsewhere it
	// fills what its frame (or its parent) offers.
	let framed = find(modifiers, 'frame') !== undefined
	chain.push(
		axis === 'box' && !framed ? matchParentSize() : fillMaxSize(),
		clip(shape),
		background(resolveColor(env.foreground, palette) ?? palette.colors.onSurface),
	)
	return <Box modifiers={chain} />
}

/** SwiftUI's `Rectangle`. */
export function Rectangle({modifiers}: RectangleProps): React.ReactNode {
	return <ShapeView modifiers={modifiers} shape={shapeOf('rectangle')} />
}

/** SwiftUI's `RoundedRectangle`. */
export function RoundedRectangle({
	modifiers,
	cornerRadius,
}: RoundedRectangleProps): React.ReactNode {
	return <ShapeView modifiers={modifiers} shape={shapeOf('roundedRectangle', cornerRadius)} />
}

/** SwiftUI's `Circle`. */
export function Circle({modifiers}: CircleProps): React.ReactNode {
	return <ShapeView modifiers={modifiers} shape={shapeOf('circle')} />
}

/** SwiftUI's `RNHostView`: React Native views hosted in the Compose tree, as is. */
export function RNHostView({children, matchContents, onLayout}: RNHostViewProps): React.ReactNode {
	let slot = useRowSlot()
	let element = (
		<ComposeRNHostView matchContents={matchContents} onLayout={onLayout}>
			{children}
		</ComposeRNHostView>
	)
	return asRow(slot, element)
}
