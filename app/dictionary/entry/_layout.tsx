import * as React from 'react'
import {Stack} from 'expo-router'
import {requiresSection} from '../../../source/features/campus/section-gate'

/**
 * The entry sheet's own navigation stack.
 *
 * A formSheet route needs a stack of its own for its screens to get a back
 * button — a flat sibling route pushed while the sheet is up renders inside it
 * with no way back out.
 */
function DictionaryEntryLayout(): React.ReactNode {
	return (
		<Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}}>
			{/* A sense opens its sub-senses in this same route. Keyed by the
			    sense, navigating to a different one pushes it, where an unkeyed
			    route would only swap the params of the sense already on top;
			    navigating to the same one still refuses a duplicate. */}
			<Stack.Screen dangerouslySingular={(_name, params) => String(params.senseId)} name="sense" />
		</Stack>
	)
}

export default requiresSection(
	'dictionary',
	{title: 'Dictionary', noun: 'a campus dictionary', systemImage: 'book'},
	DictionaryEntryLayout,
)
