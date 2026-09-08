import * as React from 'react'
import {Stack} from 'expo-router'
import {Button, Host, Image, Menu, Section, Toggle} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	foregroundStyle,
	menuActionDismissBehavior,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {CalendarFilter} from '../../source/features/calendar/store'
import type {CalendarSource} from './sources'

/**
 * The calendar's bottom-toolbar menu: which calendars contribute events, and
 * what the list is narrowed to. Category and organisation are one selection
 * between them, not one each -- see `CalendarFilter`.
 */
type Props = {
	sources: CalendarSource[]
	enabledIds: string[]
	onToggleSource: (id: string) => void
	categories: string[]
	organizations: string[]
	filter: CalendarFilter | null
	onSelectFilter: (filter: CalendarFilter | null) => void
	onTodayPress?: () => void
	onRequestDeviceCalendars?: () => void
}

const STAYS_OPEN = [menuActionDismissBehavior('disabled')]
// Mirrored by `TestIdentifiers.Calendar.picker` in the XCUITest target: it is
// the only handle those tests have on the toolbar menu.
const LABEL = accessibilityLabel('Calendar filter')

export function CalendarPicker({
	sources,
	enabledIds,
	onToggleSource,
	categories,
	organizations,
	filter,
	onSelectFilter,
	onTodayPress,
	onRequestDeviceCalendars,
}: Props): React.ReactNode {
	let isActive = filter !== null
	// Keep the modifier list structurally identical every render -- only the
	// colour value changes. Swapping modifier types/count rebuilds the native
	// Menu and closes it mid-interaction.
	let menuModifiers = [LABEL, foregroundStyle(isActive ? c.systemBlue : c.label)]

	let toggleFilter = (axis: CalendarFilter['axis'], value: string) => {
		let isSelected = filter?.axis === axis && filter.value === value
		onSelectFilter(isSelected ? null : {axis, value})
	}

	return (
		<Stack.Toolbar placement="bottom">
			{onTodayPress ? (
				<Stack.Toolbar.Button accessibilityLabel="Today" onPress={onTodayPress}>
					Today
				</Stack.Toolbar.Button>
			) : null}
			<Stack.Toolbar.Spacer />
			<Stack.Toolbar.View>
				<Host matchContents={true}>
					<Menu label={<Image systemName="calendar" />} modifiers={menuModifiers}>
						{organizations.length > 0 ? (
							<Section modifiers={STAYS_OPEN} title="ORGANIZATION">
								{organizations.map((organization) => (
									<Toggle
										isOn={filter?.axis === 'organization' && filter.value === organization}
										key={organization}
										label={organization}
										onIsOnChange={() => toggleFilter('organization', organization)}
									/>
								))}
							</Section>
						) : null}
						<Section modifiers={STAYS_OPEN} title="CATEGORY">
							{categories.map((category) => (
								<Toggle
									isOn={filter?.axis === 'category' && filter.value === category}
									key={category}
									label={category}
									onIsOnChange={() => toggleFilter('category', category)}
								/>
							))}
							{/* Rendered last so it sits at the visual top of the section */}
							<Toggle
								isOn={filter === null}
								key="__all__"
								label="All Events"
								onIsOnChange={() => onSelectFilter(null)}
							/>
						</Section>
						<Section modifiers={STAYS_OPEN} title="CALENDARS">
							{onRequestDeviceCalendars ? (
								<Button label="Add Device Calendars…" onPress={onRequestDeviceCalendars} />
							) : null}
							{sources.map((source) => (
								<Toggle
									isOn={enabledIds.includes(source.id)}
									key={source.id}
									label={source.title}
									onIsOnChange={() => onToggleSource(source.id)}
								/>
							))}
						</Section>
					</Menu>
				</Host>
			</Stack.Toolbar.View>
		</Stack.Toolbar>
	)
}
