import * as React from 'react'
import {Stack} from 'expo-router'
import {Button, Divider, Host, Image, Menu, Section, Toggle} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	foregroundStyle,
	menuActionDismissBehavior,
	menuOrder,
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
 * `menuOrder('fixed')` keeps the rows in the order they are written here --
 * CALENDARS, then each axis, then Reset Filters -- where a menu opened from the
 * bottom bar would otherwise draw its contents bottom to top.
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
}: Props): React.ReactNode {
	let isActive = filter !== null
	// Keep the modifier list structurally identical every render -- only the
	// colour value changes. Swapping modifier types/count rebuilds the native
	// Menu and closes it mid-interaction.
	let menuModifiers = [
		LABEL,
		menuOrder('fixed'),
		foregroundStyle(isActive ? c.systemBlue : c.label),
	]

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
						<Section modifiers={STAYS_OPEN} title="Calendars">
							{sources.map((source) => (
								<Toggle
									isOn={enabledIds.includes(source.id)}
									key={source.id}
									label={source.title}
									onIsOnChange={() => onToggleSource(source.id)}
								/>
							))}
						</Section>
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
						{filter ? (
							<>
								<Divider />
								<Button label="Reset Filters" onPress={() => onSelectFilter(null)} />
							</>
						) : null}
					</Menu>
				</Host>
			</Stack.Toolbar.View>
		</Stack.Toolbar>
	)
}
