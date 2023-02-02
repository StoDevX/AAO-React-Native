import * as React from 'react'
import {ContextMenu} from '@frogpond/context-menu'
import {Cell, Section} from '@frogpond/tableview'
import {Button} from '@frogpond/button'
import {LibraryWrapper} from './base/library-wrapper'
import {upperFirst} from 'lodash'

const SingleMenu = (): JSX.Element => {
	const [value, setValue] = React.useState('dog')

	return (
		<Section>
			<Cell
				cellAccessoryView={
					<ContextMenu
						actions={['bird', 'cat', 'cow', 'dog']}
						isMenuPrimaryAction={true}
						onPressMenuItem={setValue}
						title="Select an animal."
					>
						<Button title={upperFirst(value)} />
					</ContextMenu>
				}
				cellStyle="RightDetail"
				title="Top-level menu"
			/>
		</Section>
	)
}

export const ContextMenuLibrary = (): JSX.Element => (
	<LibraryWrapper>
		<SingleMenu />
	</LibraryWrapper>
)
