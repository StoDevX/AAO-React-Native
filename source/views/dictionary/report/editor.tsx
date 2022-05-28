import * as React from 'react'
import {ScrollView} from 'react-native'
import {InfoHeader} from '@frogpond/info-header'
import {
	TableView,
	Section,
	CellTextField,
	ButtonCell,
} from '@frogpond/tableview'
import {submitReport} from './submit'
import type {WordType} from '../types'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import noop from 'lodash/noop'

type Props = {
	route: {params: {item: WordType}}
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Suggest an edit',
}

let DictionaryEditorView = (props: Props): JSX.Element => {
	let [term, setTerm] = React.useState(props.route.params.item.word)
	let [definition, setDefinition] = React.useState(
		props.route.params.item.definition,
	)

	let submit = () => {
		submitReport(props.route.params.item, {
			word: term.trim(),
			definition: definition.trim(),
		})
	}

	return (
		<ScrollView
			keyboardDismissMode="on-drag"
			keyboardShouldPersistTaps="always"
		>
			<InfoHeader
				message="If you could tell us what the word and definition should be, we&rsquo;d greatly appreciate it."
				title="Thanks for spotting a problem!"
			/>

			<TableView>
				<Section header="WORD">
					<TitleCell onChange={setTerm} text={term} />
				</Section>

				<Section header="DEFINITION">
					<DefinitionCell onChange={setDefinition} text={definition} />
				</Section>

				<Section footer="Thanks for reporting!">
					<ButtonCell onPress={submit} title="Submit Report" />
				</Section>
			</TableView>
		</ScrollView>
	)
}

export {DictionaryEditorView as View}

type TextFieldProps = {text: string; onChange: (text: string) => void}

const TitleCell = ({text, onChange = noop}: TextFieldProps) => (
	<CellTextField
		autoCapitalize="words"
		onChangeText={onChange}
		onSubmitEditing={onChange}
		placeholder="Title"
		returnKeyType="done"
		value={text}
	/>
)

const DefinitionCell = ({text, onChange = noop}: TextFieldProps) => (
	<CellTextField
		autoCapitalize="sentences"
		multiline={true}
		onChangeText={onChange}
		onSubmitEditing={onChange}
		placeholder="Definition"
		returnKeyType="default"
		value={text}
	/>
)
