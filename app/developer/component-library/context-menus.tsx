import * as React from 'react'
import {Button, Host, Menu, Section, Section as SwiftUISection} from '@expo/ui/swift-ui'
import {accessibilityIdentifier} from '@expo/ui/swift-ui/modifiers'
import {Stack} from 'expo-router'
import {
	Example,
	LibraryWrapper,
} from '../../../source/features/developer/component-library/base/library-wrapper'

const ANIMALS = ['bird', 'cat', 'cow', 'dog']
const ANIMAL_MENU_TEST_ID = 'component-library-context-menu'

const SingleMenu = (): React.ReactNode => {
	const [value, setValue] = React.useState('dog')

	return (
		<Section>
			<Example title="Top-level menu">
				<Host matchContents={true}>
					<Menu
						label={capitalize(value)}
						modifiers={[accessibilityIdentifier(ANIMAL_MENU_TEST_ID)]}
					>
						<SwiftUISection title="Select an animal.">
							{/* Plain buttons, not toggles: the previous implementation
							    drew no checkmark here, and only the trigger's label
							    reflects the selection. */}
							{ANIMALS.map((animal) => (
								<Button key={animal} label={capitalize(animal)} onPress={() => setValue(animal)} />
							))}
						</SwiftUISection>
					</Menu>
				</Host>
			</Example>
		</Section>
	)
}

const capitalize = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1)

export default function ContextMenuLibraryPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Context Menus</Stack.Title>
			<LibraryWrapper>
				<SingleMenu />
			</LibraryWrapper>
		</>
	)
}
