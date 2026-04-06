import * as React from 'react'
import {
	ContextMenu,
	Text,
	Button,
	Section,
	Host,
	HStack,
} from '@expo/ui/swift-ui'
import {LibraryWrapper} from './base/library-wrapper'
import {upperFirst} from 'lodash'

const SingleMenu = (): React.JSX.Element => {
	const [value, setValue] = React.useState('dog')

	return (
		<Host>
			<Section title="Context Menus">
				<HStack>
					<Text>Top-level menu</Text>

					<ContextMenu>
						<ContextMenu.Items>
							<Button onPress={() => setValue('bird')}>bird</Button>
							<Button onPress={() => setValue('cat')}>cat</Button>
							<Button onPress={() => setValue('cow')}>cow</Button>
							<Button onPress={() => setValue('dog')}>dog</Button>
						</ContextMenu.Items>
						<ContextMenu.Trigger>
							<Text>{upperFirst(value)}</Text>
						</ContextMenu.Trigger>
					</ContextMenu>
				</HStack>
			</Section>
		</Host>
	)
}

export const ContextMenuLibrary = (): React.JSX.Element => (
	<LibraryWrapper>
		<SingleMenu />
	</LibraryWrapper>
)
