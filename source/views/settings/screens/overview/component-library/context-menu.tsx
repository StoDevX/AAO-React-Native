import * as React from 'react'
import {ContextMenu} from '@frogpond/context-menu'
import {Section} from '@frogpond/tableview'
import {Button} from '@frogpond/button'
import {Example, LibraryWrapper} from './base/library-wrapper'
import {upperFirst} from 'lodash'

const SingleMenu = (): React.JSX.Element => {
	const [value, setValue] = React.useState('dog')

	return (
		<Section>
			<Example title="Top-level menu">
				<ContextMenu
					actions={['bird', 'cat', 'cow', 'dog']}
					isMenuPrimaryAction={true}
					onPressMenuItem={setValue}
					title="Select an animal."
				>
					<Button title={upperFirst(value)} />
				</ContextMenu>
			</Example>
		</Section>
	)
}

export const ContextMenuLibrary = (): React.JSX.Element => (
	<LibraryWrapper>
		<SingleMenu />
	</LibraryWrapper>
)
