import * as React from 'react'
import {Pressable, View} from 'react-native'
import type {SlabViewProps} from '@frogpond/something-secret'

/**
 * The module reaches expo-modules-core's native registry, which does not exist under Jest, so
 * the tests render this instead: a button for the space carrying the stage and fraction as its
 * accessibility value, and the red button once open. Nothing here draws stone, so a Jest test is
 * never evidence of how the slab looks.
 */
export function SlabView(props: SlabViewProps): React.ReactNode {
	return (
		<View>
			<Pressable
				accessibilityHint={props.hint}
				accessibilityLabel={props.label}
				accessibilityRole="button"
				accessibilityValue={{text: `${props.stage} ${props.fraction.toFixed(2)}`}}
				onPress={props.onSlabTap}
				testID={props.testID}
			/>
			{props.stage === 'open' ? (
				<Pressable
					accessibilityLabel={props.buttonLabel}
					accessibilityRole="button"
					onPress={props.onButtonPress}
					testID={props.buttonTestID}
				/>
			) : null}
		</View>
	)
}

export const roar = jest.fn()
