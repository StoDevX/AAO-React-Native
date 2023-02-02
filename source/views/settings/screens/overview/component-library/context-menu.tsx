import * as React from 'react'
import {ContextMenu} from '@frogpond/context-menu'
import {TableView, Section, Cell} from '@frogpond/tableview'
import {Button} from '@frogpond/button'
import {upperFirst} from 'lodash'

const SingleMenu = (): JSX.Element => {
	const [value, setValue] = React.useState('dog')

	return (
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
	)
}

export const ContextMenuLibrary = (): JSX.Element => {
	return (
		<TableView>
			<Section>
				<SingleMenu />
			</Section>
		</TableView>
	)
}
