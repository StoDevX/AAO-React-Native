import * as React from 'react'
import {Stack} from 'expo-router'

import {useCalendarSources} from './use-calendar-sources'

/// `Stack.Toolbar.Menu` is a real UIMenu, so the checkmarks and the grouping are
/// native: `isOn` draws the tick, and a nested menu with `inline` renders as a
/// titled group rather than a submenu you have to open.
///
/// `unstable_keepPresented` is meant to let two calendars be turned on without
/// the menu closing in between. It is unproven here: expo-router warns that
/// selecting an action on iOS recreates the menu, which closes any open
/// submenu. Worth checking on a device before relying on it.
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
		<Stack.Toolbar placement="right">
			<Stack.Toolbar.Menu accessibilityLabel="Choose calendars" icon="calendar">
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
		</Stack.Toolbar>
	)
}
