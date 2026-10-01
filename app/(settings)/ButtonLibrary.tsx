import * as React from 'react'
import {Alert} from 'react-native'
import {Stack} from 'expo-router'

import {Section} from '@expo/ui/swift-ui'
import {Button} from '@frogpond/button'
import {
	LibraryWrapper,
	Example,
} from '../../source/features/settings/screens/overview/component-library/base/library-wrapper'

const ButtonExample = (): React.ReactNode => {
	return (
		<>
			<Example title="No props">
				<Button />
			</Example>

			<Example title="Enabled">
				<Button title="Tap me" />
			</Example>

			<Example title="Disabled">
				<Button disabled={true} title="Tap me" />
			</Example>

			<Example title="Callback">
				<Button onPress={() => Alert.alert('You tapped the button!')} title="Tap me" />
			</Example>

			<Example title="Inverted (fix me)">
				<Button mode="inverted" title="Tap me" />
			</Example>

			<Example title="Truncated (fix me)">
				<Button title="Very long button text that should truncate and not wrap to the next line" />
			</Example>
		</>
	)
}

export default function ButtonLibraryPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Buttons</Stack.Title>
			<LibraryWrapper>
				<>
					<Section title="@frogpond/button">
						<ButtonExample />
					</Section>
				</>
			</LibraryWrapper>
		</>
	)
}
