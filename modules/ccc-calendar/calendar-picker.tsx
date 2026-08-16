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
/// The button sits in the bottom bar the way Calendar.app's own calendar picker
/// does. A flexible `Spacer` after it takes the rest of the bar, which is what
/// leaves the button at the left end. `Stack.Toolbar.Menu` has no `label` prop;
/// the button's text comes from a `Stack.Toolbar.Label` child, and `title`
/// deliberately goes unused so the menu gets no header of its own.
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
