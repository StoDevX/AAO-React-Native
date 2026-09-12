import * as React from 'react'
import {Stack} from 'expo-router'
import {Button, Divider, Host, Image, Menu, Section, Toggle} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	foregroundStyle,
	menuActionDismissBehavior,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {CalendarFilterOption} from '../../source/features/calendar/filter'
import {axisLabel, filterAfterChoosing} from '../../source/features/calendar/picker-state'
import type {CalendarFilter} from '../../source/features/calendar/store'
import type {CalendarSource} from './sources'

/**
 * The calendar's bottom-toolbar menu: which calendars contribute events, and
 * what the list is narrowed to. Category and organisation are one selection
 * between them, not one each -- see `CalendarFilter`.
 *
 * The children are written RESET, ORGANIZATION, CATEGORY, CALENDARS and reach
 * the screen in the opposite order -- CALENDARS at the top, Reset Filters at
 * the bottom -- because SwiftUI draws a Menu's contents bottom-to-top. The rule
 * separating Reset Filters from the axes above it is written after it for the
 * same reason.
 * Confirmed against a screenshot from `testPickerMenuShowsItsRows`, which is
 * also why each axis's choices are sorted Z-A to read A-Z. Reordering these to
 * match the rendered order would invert the menu.
 */
type Props = {
	sources: CalendarSource[]
	enabledIds: string[]
	onToggleSource: (id: string) => void
	categories: CalendarFilterOption[]
	organizations: CalendarFilterOption[]
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
		onSelectFilter(filterAfterChoosing(filter, axis, value))
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
						{/* Rendered first so it sits at the visual bottom, below both axes */}
						{filter ? (
							<>
								<Button label="Reset Filters" onPress={() => onSelectFilter(null)} />
								<Divider />
							</>
						) : null}
						{organizations.length > 0 ? (
							<Menu
								label={axisLabel('organization', 'Organization', filter)}
								modifiers={STAYS_OPEN}
							>
								{organizations.map((organization) => (
									<Toggle
										isOn={filter?.axis === 'organization' && filter.value === organization.value}
										key={organization.value}
										label={`${organization.value} (${organization.count})`}
										onIsOnChange={() => toggleFilter('organization', organization.value)}
									/>
								))}
							</Menu>
						) : null}
						<Menu label={axisLabel('category', 'Category', filter)} modifiers={STAYS_OPEN}>
							{categories.map((category) => (
								<Toggle
									isOn={filter?.axis === 'category' && filter.value === category.value}
									key={category.value}
									label={`${category.value} (${category.count})`}
									onIsOnChange={() => toggleFilter('category', category.value)}
								/>
							))}
						</Menu>
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
