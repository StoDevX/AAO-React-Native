import * as React from 'react'
import {Host, Menu, Toggle} from '@expo/ui/swift-ui'
import {accessibilityAddTraits, buttonStyle} from '@expo/ui/swift-ui/modifiers'
import isEqual from 'lodash/isEqual'

import {toggleAll, toggleOption} from './lib/select-options'
import type {FilterType} from './types'

type Props<T extends object> = {
	filter: FilterType<T>
	isActive: boolean
	onChange: (filter: FilterType<T>) => void
}

// Hoisted so an inactive/active render reuses the same modifier array rather
// than allocating one per render. `borderedProminent` is SwiftUI's own
// emphasis for a control that's "on" -- it tracks the system accent colour,
// light/dark mode, and contrast settings on its own, which a hardcoded tint
// would not. `isSelected` carries the same fact to VoiceOver as
// `accessibilityAddTraits`'s only trait for it -- the visual and spoken
// signal are set together so they can't drift apart.
const INACTIVE_TRIGGER_MODIFIERS = [buttonStyle('bordered')]
const ACTIVE_TRIGGER_MODIFIERS = [
	buttonStyle('borderedProminent'),
	accessibilityAddTraits(['isSelected']),
]

function triggerModifiers(isActive: boolean) {
	return isActive ? ACTIVE_TRIGGER_MODIFIERS : INACTIVE_TRIGGER_MODIFIERS
}

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
