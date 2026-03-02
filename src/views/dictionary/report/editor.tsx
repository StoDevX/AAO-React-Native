import * as React from 'react'
import {ScrollView} from 'react-native'
import {InfoHeader} from '@frogpond/info-header'
import {TableView, Section} from '@frogpond/tableview'
import {CellTextField, ButtonCell} from '@frogpond/tableview/cells'
import {submitReport} from './submit'
import {Stack, useLocalSearchParams} from 'expo-router'
import noop from 'lodash/noop'

export let DictionaryEditorView = (): React.JSX.Element => {
	let params = useLocalSearchParams<{word: string; definition: string}>()

	let [term, setTerm] = React.useState(params.word)
	let [definition, setDefinition] = React.useState(params.definition)

	let submit = () => {
		submitReport(
			{word: params.word, definition: params.definition},
			{
				word: term.trim(),
				definition: definition.trim(),
			},
		)
	}

	return (
		<>
			<Stack.Screen options={{title: 'Suggest an edit'}} />
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
		</>
	)
}

export {DictionaryEditorView as View}

type TextFieldProps = {text: string; onChange: (text: string) => void}

const TitleCell = ({text, onChange = noop}: TextFieldProps) => (
	<CellTextField
		autoCapitalize="words"
		onChangeText={onChange}
		onSubmitEditing={(ev) => onChange(ev.nativeEvent.text)}
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
		onSubmitEditing={(ev) => onChange(ev.nativeEvent.text)}
		placeholder="Definition"
		returnKeyType="default"
		value={text}
	/>
)
