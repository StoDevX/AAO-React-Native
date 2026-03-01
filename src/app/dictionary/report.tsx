import React from 'react'
import {DictionaryEditorView} from '../../views/dictionary/report/editor'
import {Stack} from 'expo-router'

export default function DictionaryReportScreen(): React.ReactNode {
	return (
		<>
			<Stack.Screen options={{title: 'Suggest an edit'}} />
			<DictionaryEditorView />
		</>
	)
}
