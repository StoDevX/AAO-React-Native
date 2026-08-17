import * as React from 'react'
import {Stack} from 'expo-router'

import {useCalendarSources} from './use-calendar-sources'

/// `Stack.Toolbar.Menu` is a real UIMenu, so the checkmarks and the grouping are
/// native: `isOn` draws the tick, and a nested menu with `inline` renders as a
/// titled group rather than a submenu you have to open.
///
/// `unstable_keepPresented` asks for the menu to stay up so two calendars can be
/// turned on in one go. On the simulator (iOS 26.5, expo-router 57.0.11) it does
/// not: the menu closes on every selection, which is the behaviour expo-router
/// warns about -- selecting an action on iOS recreates the menu. The toggle
/// itself still lands, so turning on a second calendar means reopening the menu.
/// The prop stays because it costs nothing and states the intent.
///
/// The button sits in the bottom bar, at the left, where Calendar.app keeps its
/// own calendar picker. A flexible `Spacer` after it takes the rest of the bar,
/// which is what leaves the button at that end.
///
/// The button shows its label and no icon, because in this placement it cannot
/// show both. `Stack.Toolbar.Menu` has no `label` prop -- the text comes from a
/// `Stack.Toolbar.Label` child -- and `title` stays unused so the menu gets no
/// header of its own.
///
/// Adding `icon` does not add an icon beside the text; it replaces the text.
/// expo-router builds the bar item as
/// `UIBarButtonItem(title:image:primaryAction:menu:)`
/// (`ios/Toolbar/RouterToolbarHostView.swift`), and UIKit draws only the image
/// when a bar item is given both, collapsing this button from 101x38 to a 38x38
/// circle with no text. Nothing in JavaScript can override that, so an icon here
/// costs the word "Calendars".
export function CalendarPicker(): React.ReactNode {
	let {remote, device, enabled, canOfferDevice, deviceAvailable, toggle, requestDevice} =
		useCalendarSources()

	let isOn = (id: string) => enabled.some((source) => source.id === id)

	let remoteActions = remote.map((source) => (
		<Stack.Toolbar.MenuAction
			isOn={isOn(source.id)}
			key={source.id}
			onPress={() => toggle(source.id)}
			unstable_keepPresented={true}
		>
			{source.title}
		</Stack.Toolbar.MenuAction>
	))

	return (
		<Stack.Toolbar placement="bottom">
			<Stack.Toolbar.Menu accessibilityLabel="Calendars">
				<Stack.Toolbar.Label>Calendars</Stack.Toolbar.Label>

				{canOfferDevice ? (
					<Stack.Toolbar.Menu inline={true} title="All About Olaf">
						{remoteActions}
					</Stack.Toolbar.Menu>
				) : (
					remoteActions
				)}

				{canOfferDevice ? (
					<Stack.Toolbar.Menu inline={true} title="Device">
						{deviceAvailable ? (
							device.map((source) => (
								<Stack.Toolbar.MenuAction
									isOn={isOn(source.id)}
									key={source.id}
									onPress={() => toggle(source.id)}
									unstable_keepPresented={true}
								>
									{source.title}
								</Stack.Toolbar.MenuAction>
							))
						) : (
							<Stack.Toolbar.MenuAction onPress={() => void requestDevice()}>
								Show device calendars…
							</Stack.Toolbar.MenuAction>
						)}
					</Stack.Toolbar.Menu>
				) : null}
			</Stack.Toolbar.Menu>
			<Stack.Toolbar.Spacer />
		</Stack.Toolbar>
	)
}
