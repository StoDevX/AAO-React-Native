import * as React from 'react'
import {Alert} from 'react-native'

import * as c from '@frogpond/colors'
import {Section, Cell} from '@frogpond/tableview'
import {Button} from '@frogpond/button'
import {ButtonCell} from '@frogpond/tableview/cells'
import {LibraryWrapper} from './base/library-wrapper'

interface RowProps {
	title: string
	children: JSX.Element
}

const Example = ({title, children}: RowProps): JSX.Element => {
	return (
		<Cell cellAccessoryView={children} cellStyle="RightDetail" title={title} />
	)
}

const ButtonCellExample = (): JSX.Element => {
	return (
		<>
			<ButtonCell disabled={false} onPress={() => undefined} title="Enabled" />

			<ButtonCell disabled={true} onPress={() => undefined} title="Disabled" />

			<ButtonCell
				indeterminate={true}
				onPress={() => undefined}
				title="Indeterminate"
			/>

			<ButtonCell
				accessoryIcon="school"
				onPress={() => undefined}
				title="Accessory"
			/>

			<ButtonCell
				accessoryIcon="school"
				onPress={() => undefined}
				textStyle={{color: c.red}}
				title="Accessory, textstyle"
			/>

			<ButtonCell
				accessoryIcon="school"
				disabled={true}
				onPress={() => undefined}
				textStyle={{color: c.red}}
				title="Disabled, textstyle, accessory"
			/>

			<ButtonCell
				disabled={false}
				onPress={() => Alert.alert('You tapped the button!')}
				title="Callback"
			/>
		</>
	)
}

const ButtonExample = (): JSX.Element => {
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
				<Button
					onPress={() => Alert.alert('You tapped the button!')}
					title="Tap me"
				/>
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

export const ButtonLibrary = (): JSX.Element => (
	<LibraryWrapper>
		<>
			<Section header="@frogpond/tableview/cells">
				<ButtonCellExample />
			</Section>

			<Section header="@frogpond/button">
				<ButtonExample />
			</Section>
		</>
	</LibraryWrapper>
)
