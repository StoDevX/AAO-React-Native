import * as React from 'react'
import {Host, Menu, Toggle} from '@expo/ui/swift-ui'
import isEqual from 'lodash/isEqual'

import {toggleAll, toggleOption} from './lib/select-options'
import {
	ACTIVE_TRIGGER_MODIFIERS,
	INACTIVE_TRIGGER_MODIFIERS,
	triggerModifiers,
} from './lib/trigger-modifiers'
import type {FilterType} from './types'

type Props<T extends object> = {
	filter: FilterType<T>
	isActive: boolean
	onChange: (filter: FilterType<T>) => void
}

// Re-exported for `filter-sheet.tsx`'s anchor `Button` -- see
// `./lib/trigger-modifiers` for why the two are shared rather than each
// owning a copy -- and for every test that compares a trigger's modifiers by
// identity against this module's own constants.
export {ACTIVE_TRIGGER_MODIFIERS, INACTIVE_TRIGGER_MODIFIERS}

/**
 * A short filter as one native pull-down menu. A `Toggle` per item gives the
 * platform's own checkmark for "selected" -- the same trick the bus day
 * picker's header menu uses -- so selection state needs no icon drawn by hand.
 * The menu label is the trigger itself (there is no separate button), so
 * `isActive` -- whether this filter is currently narrowing anything -- has to
 * be drawn on the trigger's own modifiers rather than a wrapping component.
 */
export function FilterMenu<T extends object>({
	filter,
	isActive,
	onChange,
}: Props<T>): React.ReactNode {
	switch (filter.type) {
		case 'toggle':
			return (
				<Host matchContents={true}>
					<Menu label={filter.spec.title} modifiers={triggerModifiers(isActive)}>
						<Toggle
							isOn={filter.enabled}
							label={filter.spec.label}
							onIsOnChange={(isOn) => onChange({...filter, enabled: isOn})}
						/>
					</Menu>
				</Host>
			)

		case 'picker': {
			// Matches the popover's rule: a picker of fewer than two options has
			// nothing to pick between.
			if (filter.spec.options.length < 2) {
				return null
			}

			return (
				<Host matchContents={true}>
					<Menu label={filter.spec.title} modifiers={triggerModifiers(isActive)}>
						{filter.spec.options.map((option, index) => (
							<Toggle
								key={index}
								isOn={isEqual(filter.spec.selected, option)}
								label={option.label}
								onIsOnChange={() => onChange({...filter, spec: {...filter.spec, selected: option}})}
							/>
						))}
					</Menu>
				</Host>
			)
		}

		case 'list': {
			let {spec} = filter

			if (spec.options.length === 0) {
				return null
			}

			return (
				<Host matchContents={true}>
					<Menu label={spec.title} modifiers={triggerModifiers(isActive)}>
						{spec.mode === 'OR' ? (
							<Toggle
								isOn={spec.selected.length === spec.options.length}
								label="Show All"
								onIsOnChange={() => onChange(toggleAll(filter))}
							/>
						) : null}
						{spec.options.map((option) => (
							<Toggle
								key={option.title}
								isOn={spec.selected.some((selected) => isEqual(selected, option))}
								label={spec.displayTitle ? option.title : option.label}
								onIsOnChange={() => onChange(toggleOption(filter, option))}
							/>
						))}
					</Menu>
				</Host>
			)
		}

		default:
			return null
	}
}
