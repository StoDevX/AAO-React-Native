import * as React from 'react'
import {HStack, Image, Text} from '@expo/ui/swift-ui'
import {font} from '@expo/ui/swift-ui/modifiers'

const CHEVRON_MODIFIERS = [font({textStyle: 'caption', weight: 'semibold'})]

/**
 * A trigger's label for a filter that presents something, with the chevron
 * that says so. The chevron inherits the trigger's own `foregroundStyle`, so
 * it follows the label colour through both fills.
 */
export function TriggerLabel({title}: {title: string}): React.ReactNode {
	return (
		<HStack spacing={4}>
			<Text>{title}</Text>
			<Image modifiers={CHEVRON_MODIFIERS} systemName="chevron.down" />
		</HStack>
	)
}
