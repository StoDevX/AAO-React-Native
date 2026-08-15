import * as React from 'react'
import {Button, Host, Menu, Section as SwiftUISection} from '@expo/ui/swift-ui'
import {accessibilityIdentifier} from '@expo/ui/swift-ui/modifiers'
import {Section} from '@frogpond/tableview'
import {Stack} from 'expo-router'
import {
	Example,
	LibraryWrapper,
} from '../../source/features/settings/screens/overview/component-library/base/library-wrapper'
import {upperFirst} from 'lodash'

const ANIMALS = ['bird', 'cat', 'cow', 'dog']
/// Matches TestIdentifiers.ComponentLibrary in the XCUITest target.
const ANIMAL_MENU_TEST_ID = 'component-library-context-menu'

const SingleMenu = (): React.ReactNode => {
	const [value, setValue] = React.useState('dog')

	return (
		<Section>
			<Example title="Top-level menu">
				<Host matchContents={true}>
					<Menu
						label={upperFirst(value)}
						modifiers={[accessibilityIdentifier(ANIMAL_MENU_TEST_ID)]}
					>
						<SwiftUISection title="Select an animal.">
							{/* Plain buttons, not toggles: the previous implementation
							    drew no checkmark here, and only the trigger's label
							    reflects the selection. */}
							{ANIMALS.map((animal) => (
								<Button key={animal} label={upperFirst(animal)} onPress={() => setValue(animal)} />
							))}
						</SwiftUISection>
					</Menu>
				</Host>
			</Example>
		</Section>
	)
}

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
