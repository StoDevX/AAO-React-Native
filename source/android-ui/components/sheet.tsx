import * as React from 'react'

import {BottomSheet as UniversalBottomSheet, type SnapPoint} from '@expo/ui'
import type {BottomSheetProps, TabProps, TabViewProps} from '@expo/ui/swift-ui'
import {Box, HorizontalPager, type HorizontalPagerHandle} from '@expo/ui/jetpack-compose'
import {fillMaxSize} from '@expo/ui/jetpack-compose/modifiers'

import {resolveColor, usePalette} from '../colors'
import {ListStyleContext, MenuContext, RowSlotContext} from '../context'
import {
	AxisContext,
	EnvironmentContext,
	find,
	modifiersOf,
	toCompose,
	UnboundedContext,
	useAxis,
	type ModifierList,
	type SwiftModifier,
} from '../modifiers'

/** A sheet or a page measures its content within its own bounds. */
const BOUNDED = {vertical: false, horizontal: false}

/** A sheet starts a fresh SwiftUI environment, as a presentation does. */
const NO_ENVIRONMENT = {}

/** The presentation modifiers on a sheet's content, which SwiftUI reads from there. */
function presentationOf(children: React.ReactNode): SwiftModifier[] {
	let out: SwiftModifier[] = []
	React.Children.forEach(children, (child) => {
		if (React.isValidElement<{modifiers?: ModifierList}>(child)) {
			out.push(
				...modifiersOf(child.props.modifiers).filter(
					(modifier) =>
						modifier.$type.startsWith('presentation') ||
						modifier.$type === 'interactiveDismissDisabled',
				),
			)
		}
	})
	return out
}

/** SwiftUI's detents, as the universal sheet's snap points. */
function snapPointsOf(detents: unknown): SnapPoint[] | undefined {
	if (!Array.isArray(detents)) {
		return undefined
	}
	let points: SnapPoint[] = []
	for (let detent of detents) {
		if (detent === 'large') {
			points.push('full')
		} else if (detent === 'medium') {
			points.push('half')
		} else if (detent && typeof detent === 'object') {
			let {fraction, height} = detent as {fraction?: unknown; height?: unknown}
			if (typeof fraction === 'number') {
				points.push({fraction})
			} else if (typeof height === 'number') {
				points.push({height})
			}
		}
	}
	return points.length > 0 ? points : undefined
}

/**
 * SwiftUI's `BottomSheet`, as the universal `BottomSheet` -- Expo's Material
 * `ModalBottomSheet`. The detents, drag indicator, background and
 * dismissability the screens set with presentation modifiers on the sheet's
 * content become the sheet's own props. A sheet dismissed by drag, back or
 * scrim reports `onIsPresentedChange(false)` then `onDismiss`, as SwiftUI does.
 */
export function BottomSheet(props: BottomSheetProps): React.ReactNode {
	let {children, anchor, isPresented, onIsPresentedChange, onDismiss} = props
	let palette = usePalette()
	let presentation = presentationOf(children)
	let detents = find(presentation, 'presentationDetents')?.detents
	let indicator = find(presentation, 'presentationDragIndicator')?.visibility
	let sheetBackground = find(presentation, 'presentationBackground')?.style
	let locked = find(presentation, 'interactiveDismissDisabled')?.isDisabled === true

	// SwiftUI calls onDismiss whenever the sheet goes away, including when the
	// screen sets isPresented false itself.
	let wasPresented = React.useRef(isPresented)
	let dismissed = React.useRef(false)
	React.useEffect(() => {
		if (wasPresented.current && !isPresented && !dismissed.current) {
			onDismiss?.()
		}
		dismissed.current = false
		wasPresented.current = isPresented
	}, [isPresented, onDismiss])

	return (
		<>
			{anchor}
			<UniversalBottomSheet
				containerColor={
					resolveColor(sheetBackground, palette) ?? palette.colors.surfaceContainerLow
				}
				contentPadding={0}
				isPresented={isPresented}
				onDismiss={() => {
					dismissed.current = true
					onIsPresentedChange(false)
					onDismiss?.()
				}}
				shouldDismissOnBackPress={!locked}
				shouldDismissOnClickOutside={!locked}
				showDragIndicator={indicator !== 'hidden'}
				snapPoints={snapPointsOf(detents)}
			>
				<EnvironmentContext.Provider value={NO_ENVIRONMENT}>
					<AxisContext.Provider value="none">
						<UnboundedContext.Provider value={BOUNDED}>
							<ListStyleContext.Provider value={null}>
								<MenuContext.Provider value={null}>
									<RowSlotContext.Provider value={null}>{children}</RowSlotContext.Provider>
								</MenuContext.Provider>
							</ListStyleContext.Provider>
						</UnboundedContext.Provider>
					</AxisContext.Provider>
				</EnvironmentContext.Provider>
			</UniversalBottomSheet>
		</>
	)
}

/** `TabView.Tab`: one page, read by `TabView`. */
function Tab({children}: TabProps): React.ReactNode {
	return children
}

/**
 * SwiftUI's `TabView`. The app only pages with it (`tabViewStyle(page)`), so
 * every TabView is a Compose `HorizontalPager`: a swipe reports the new tab's
 * value through `onSelectionChange` and, once the page settles,
 * `onPageSettle`; a new `selection` scrolls the pager to it.
 */
function TabView(props: TabViewProps): React.ReactNode {
	let {children, selection, defaultSelection, onSelectionChange, onPageSettle, modifiers} = props
	let palette = usePalette()
	let axis = useAxis()
	let pager = React.useRef<HorizontalPagerHandle>(null)
	let tabs = React.Children.toArray(children).filter(
		(child): child is React.ReactElement<TabProps> => React.isValidElement(child),
	)
	let values = tabs.map((tab) => tab.props.value)
	let wanted = selection ?? defaultSelection
	let index = Math.max(0, wanted === undefined ? 0 : values.indexOf(wanted))
	let shown = React.useRef(index)

	React.useEffect(() => {
		if (selection === undefined) {
			return
		}
		let target = values.indexOf(selection)
		if (target >= 0 && target !== shown.current) {
			shown.current = target
			pager.current?.animateScrollToPage(target).catch(() => undefined)
		}
	}, [selection, values])

	return (
		<HorizontalPager
			initialPage={index}
			modifiers={toCompose(modifiers, {palette, axis})}
			onCurrentPageChange={(page) => {
				shown.current = page
				let value = values[page]
				if (value !== undefined) {
					onSelectionChange?.(value)
				}
			}}
			onSettledPageChange={(page) => {
				let value = values[page]
				if (value !== undefined) {
					onPageSettle?.(value)
				}
			}}
			ref={pager}
		>
			{tabs.map((tab) => (
				<Box key={tab.key ?? tab.props.value} modifiers={[fillMaxSize()]}>
					<AxisContext.Provider value="box">
						<UnboundedContext.Provider value={BOUNDED}>
							<RowSlotContext.Provider value={null}>{tab.props.children}</RowSlotContext.Provider>
						</UnboundedContext.Provider>
					</AxisContext.Provider>
				</Box>
			))}
		</HorizontalPager>
	)
}
TabView.Tab = Tab

export {TabView}
