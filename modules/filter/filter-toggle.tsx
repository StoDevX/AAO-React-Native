import * as React from 'react'
import {Button, Host} from '@expo/ui/swift-ui'

import {triggerModifiers} from './lib/trigger-modifiers'
import type {ToggleType} from './types'

type Props<T extends object> = {
	filter: ToggleType<T>
	isActive: boolean
	onChange: (filter: ToggleType<T>) => void
}

/**
 * A toggle filter, whose trigger is the whole control: it has one state to
 * change, so tapping flips it rather than presenting anything. A menu holding a
 * single switch would make the reader open it to learn what the trigger's own
 * prominence already tells them.
 *
 * It draws no chevron for the same reason -- nothing opens.
 */
export function FilterToggle<T extends object>({
	filter,
	isActive,
	onChange,
}: Props<T>): React.ReactNode {
	let modifiers = React.useMemo(
		() => triggerModifiers(isActive, filter.key, false),
		[isActive, filter.key],
	)

	return (
		<Host matchContents={true}>
			<Button
				label={filter.spec.title}
				modifiers={modifiers}
				onPress={() => onChange({...filter, enabled: !filter.enabled})}
			/>
		</Host>
	)
}
