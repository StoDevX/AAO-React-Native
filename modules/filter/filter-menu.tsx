import * as React from 'react'
import {Host, Menu, Section, Toggle} from '@expo/ui/swift-ui'
import {menuActionDismissBehavior} from '@expo/ui/swift-ui/modifiers'
import isEqual from 'lodash/isEqual'

import {toggleOption} from './lib/select-options'
import {triggerModifiers} from './lib/trigger-modifiers'
import type {FilterType} from './types'

/**
 * Keeps a list menu open as its options are ticked. A list filter is
 * multi-select, and a menu that closed on each tap would have to be reopened
 * once per option -- Photos' own filter menus stay up for the same reason. A
 * picker does not take this: choosing one of its options is the whole
 * interaction, so closing is the right answer there.
 */
const STAYS_OPEN = [menuActionDismissBehavior('disabled')]

type Props<T extends object> = {
	filter: FilterType<T>
	isActive: boolean
	onChange: (filter: FilterType<T>) => void
}

/**
 * A short filter as one native pull-down menu. A `Toggle` per item gives the
 * platform's own checkmark for "selected" -- the same trick the bus day
 * picker's header menu uses -- so selection state needs no icon drawn by hand.
 * The menu label is the trigger itself (there is no separate button), so
 * `isActive` -- whether this filter is currently narrowing anything -- has to
 * be drawn on the trigger's own modifiers rather than a wrapping component.
 * Every case wraps its items in a `Section` titled with the filter's own
 * title, so an opened menu states which filter it belongs to -- the same fact
 * `FilterSheet`'s header states for a sheet.
 */
export function FilterMenu<T extends object>({
	filter,
	isActive,
	onChange,
}: Props<T>): React.ReactNode {
	// One array per filter rather than one per render: `triggerModifiers` has
	// to build a fresh array to carry the filter's own identifier.
	let modifiers = React.useMemo(
		() => triggerModifiers(isActive, filter.key, {isDisabled: filter.disabled}),
		[isActive, filter.key, filter.disabled],
	)

	switch (filter.type) {
		case 'toggle':
			return (
				<Host matchContents={true}>
					<Menu label={filter.spec.title} modifiers={modifiers}>
						<Section title={filter.spec.title.toUpperCase()}>
							<Toggle
								isOn={filter.enabled}
								label={filter.spec.label}
								onIsOnChange={(isOn) => onChange({...filter, enabled: isOn})}
							/>
						</Section>
					</Menu>
				</Host>
			)

		case 'picker': {
			// A picker of fewer than two options has nothing to pick between.
			if (filter.spec.options.length < 2) {
				return null
			}

			return (
				<Host matchContents={true}>
					<Menu label={filter.spec.title} modifiers={modifiers}>
						<Section title={filter.spec.title.toUpperCase()}>
							{filter.spec.options.map((option, index) => (
								<Toggle
									key={index}
									isOn={isEqual(filter.spec.selected, option)}
									label={option.label}
									onIsOnChange={() =>
										onChange({...filter, spec: {...filter.spec, selected: option}})
									}
								/>
							))}
						</Section>
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
					<Menu label={spec.title} modifiers={modifiers}>
						<Section modifiers={STAYS_OPEN} title={spec.title.toUpperCase()}>
							{spec.options.map((option) => (
								<Toggle
									key={option.title}
									isOn={spec.selected.some((selected) => isEqual(selected, option))}
									label={spec.displayTitle ? option.title : option.label}
									onIsOnChange={() => onChange(toggleOption(filter, option))}
								/>
							))}
						</Section>
					</Menu>
				</Host>
			)
		}

		default:
			return null
	}
}
