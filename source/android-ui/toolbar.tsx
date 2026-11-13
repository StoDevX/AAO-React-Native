import * as React from 'react'
import type {ImageSourcePropType} from 'react-native'

import {
	DropdownMenuItem,
	HorizontalDivider,
	Text as ComposeText,
	TextButton,
} from '@expo/ui/jetpack-compose'
// Named by their Android files: Expo Router's export map resolves the bare
// names past Metro's platform extensions, to stubs that draw nothing.
import {NativeToolbarButton as UpstreamButton} from 'expo-router/build/layouts/stack-utils/toolbar/StackToolbarButton/native.android'
import {
	NativeToolbarMenu as UpstreamMenu,
	NativeToolbarMenuAction as UpstreamMenuAction,
} from 'expo-router/build/layouts/stack-utils/toolbar/StackToolbarMenu/native.android'
import type {NativeToolbarButtonProps} from 'expo-router/build/layouts/stack-utils/toolbar/StackToolbarButton/types'
import type {
	NativeToolbarMenuActionProps,
	NativeToolbarMenuProps,
} from 'expo-router/build/layouts/stack-utils/toolbar/StackToolbarMenu/types'

import {symbolSource} from './components/symbol'

/**
 * SF Symbols a toolbar names whose Android counterpart is a different glyph
 * from the one `symbol-table.ts` gives them elsewhere. A toolbar's leading
 * `chevron.left` is a screen's own Back button, and Android's Back is the
 * arrow, not a chevron.
 */
const TOOLBAR_SYMBOLS: Readonly<Record<string, string>> = {
	'chevron.left': 'arrow.left',
}

/**
 * The Material Symbol for a toolbar item's SF Symbol, when it names one and
 * no image of its own. Expo Router's Android toolbar draws only an image
 * source, and skips an item named by SF Symbol altogether.
 */
function sourceFor(
	icon: string | ImageSourcePropType | undefined,
	source: ImageSourcePropType | undefined,
): ImageSourcePropType | undefined {
	if (source || typeof icon !== 'string') {
		return source
	}
	return symbolSource(TOOLBAR_SYMBOLS[icon] ?? icon)
}

/**
 * `Stack.Toolbar.Button` on Android. Expo Router's own draws an icon button
 * from an image source and nothing otherwise, so an SF Symbol button here
 * gets its Material Symbol, and a text-only button -- "Today", "Add to
 * Calendar" -- a Material text button, as a top app bar draws a text action.
 *
 * Metro substitutes this for Expo Router's module on Android (see
 * `metro.config.js`).
 */
export function NativeToolbarButton(props: NativeToolbarButtonProps): React.ReactNode {
	let source = sourceFor(props.icon, props.source)
	if (source || !props.label) {
		return <UpstreamButton {...props} source={source} />
	}
	if (props.hidden) {
		return null
	}
	return (
		<TextButton enabled={!props.disabled} onClick={props.onPress}>
			<ComposeText>{props.label}</ComposeText>
		</TextButton>
	)
}

/** Whether a menu is drawn inside another, and so is a submenu or an inline group. */
const InsideMenu = React.createContext(false)

/** Marks the inline group that opens a menu, which no divider precedes. */
type GroupProps = NativeToolbarMenuProps & {androidLeadingGroup?: boolean}

/**
 * Marks a menu's first item when it is an inline group. `Stack.Toolbar.Menu`
 * passes its props through to this module, so the mark reaches the group.
 */
function markLeadingGroup(children: React.ReactNode): React.ReactNode {
	let marked = false
	return React.Children.map(children, (child) => {
		if (marked || !React.isValidElement<GroupProps>(child)) {
			return child
		}
		marked = true
		return child.props.inline ? React.cloneElement(child, {androidLeadingGroup: true}) : child
	})
}

/**
 * `Stack.Toolbar.Menu` on Android, with its SF Symbol drawn as a Material
 * Symbol for the same reason as `NativeToolbarButton`: Expo Router's own menu
 * draws no trigger without an image source.
 *
 * An inline group is drawn here rather than by Expo Router, which puts a
 * divider before every group -- the first included, a rule along the top of
 * the menu -- and drops the group's title. Here a divider only separates
 * groups, and a titled group opens with its title, as a section of an
 * Android menu does and as iOS draws one.
 */
export function NativeToolbarMenu(props: GroupProps): React.ReactNode {
	let inside = React.useContext(InsideMenu)
	if (inside && props.inline) {
		let {androidLeadingGroup, title, children} = props
		return (
			<>
				{androidLeadingGroup ? null : <HorizontalDivider />}
				{title ? (
					<DropdownMenuItem enabled={false}>
						<DropdownMenuItem.Text>
							<ComposeText style={{typography: 'labelMedium'}}>{title}</ComposeText>
						</DropdownMenuItem.Text>
					</DropdownMenuItem>
				) : null}
				{children}
			</>
		)
	}
	let {androidLeadingGroup: _androidLeadingGroup, ...rest} = props
	return (
		<InsideMenu.Provider value={true}>
			<UpstreamMenu {...rest} source={sourceFor(props.icon, props.source)}>
				{markLeadingGroup(props.children)}
			</UpstreamMenu>
		</InsideMenu.Provider>
	)
}

/**
 * `Stack.Toolbar.MenuAction` on Android: text alone, without the SF Symbol
 * iOS draws beside it. An app bar's overflow menu on Android is a list of
 * words -- Material allows a leading icon only if every item has one, and
 * Android's own apps leave them off -- so a ported iOS menu drew icons no
 * Android menu has. Context menus, drawn elsewhere, keep theirs.
 */
export function NativeToolbarMenuAction(props: NativeToolbarMenuActionProps): React.ReactNode {
	return <UpstreamMenuAction {...props} icon={undefined} source={undefined} />
}
