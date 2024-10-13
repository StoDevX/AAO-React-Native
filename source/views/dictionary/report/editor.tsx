import * as React from 'react'
import {ScrollView} from 'react-native'
import {InfoHeader} from '@frogpond/info-header'
import {TableView, Section} from '@frogpond/tableview'
import {CellTextField, ButtonCell} from '@frogpond/tableview/cells'
import {submitReport} from './submit'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {RouteProp, useRoute} from '@react-navigation/native'
import {RootStackParamList} from '../../../navigation/types'
import noop from 'lodash/noop'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Suggest an edit',
}

let DictionaryEditorView = (): React.JSX.Element => {
	let route = useRoute<RouteProp<RootStackParamList, 'DictionaryEditor'>>()
	let {item} = route.params

	let [term, setTerm] = React.useState(item.word)
	let [definition, setDefinition] = React.useState(item.definition)

	let submit = () => {
		submitReport(item, {
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

interface TextFieldProps {text: string; onChange: (text: string) => void}

const TitleCell = ({text, onChange = noop}: TextFieldProps) => (
	<CellTextField
		autoCapitalize="words"
		onChangeText={onChange}
		onSubmitEditing={(ev) => { onChange(ev.nativeEvent.text); }}
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
		onSubmitEditing={(ev) => { onChange(ev.nativeEvent.text); }}
		placeholder="Definition"
		returnKeyType="default"
		value={text}
	/>
)
