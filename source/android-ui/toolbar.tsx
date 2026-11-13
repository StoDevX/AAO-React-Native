import * as React from 'react'
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

/**
 * `Stack.Toolbar.Button` on Android. Expo Router's own draws an icon button
 * from an image source -- each screen names a Material Symbol for Android --
 * and nothing otherwise, so a text-only button -- "Today", "Add to Calendar"
 * -- is drawn here as a Material text button, as a top app bar draws a text
 * action.
 *
 * Metro substitutes this for Expo Router's module on Android (see
 * `metro.config.js`).
 */
export function NativeToolbarButton(props: NativeToolbarButtonProps): React.ReactNode {
	if (props.source || !props.label) {
		return <UpstreamButton {...props} />
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
 * `Stack.Toolbar.Menu` on Android. An inline group is drawn here rather than by Expo Router, which puts a
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
			<UpstreamMenu {...rest}>{markLeadingGroup(props.children)}</UpstreamMenu>
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
