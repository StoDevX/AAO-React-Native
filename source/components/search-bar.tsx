import * as React from 'react'
import {Stack, useNavigation} from 'expo-router'
import type {NativeStackNavigationProp} from 'expo-router'
import type {SearchBarCommands} from 'react-native-screens'

// expo-router does not re-export react-navigation's `ParamListBase`, and this
// component only needs the stack's event map, not any screen's params.
type StackNavigation = NativeStackNavigationProp<Record<string, object | undefined>>

type NativeSearchBarProps = React.ComponentProps<typeof Stack.SearchBar>

export type SearchBarProps = Omit<NativeSearchBarProps, 'onChangeText' | 'ref'> & {
	/** The query the screen believes it is showing results for. */
	value: string
	/** Called with the field's new text when the reader types. */
	onChangeText: (text: string) => void
}

/**
 * The native search bar, kept in step with the query its screen is showing.
 *
 * `Stack.SearchBar` has no `value` prop — the text lives in UIKit, and React
 * only ever hears about it through `onChangeText`. Beginning an interactive
 * swipe back tears the search field down, so cancelling that swipe returns the
 * reader to a screen whose results answer a query the search bar no longer
 * displays. Pushing our copy of the text back through the imperative handle is
 * the only way to close that gap.
 *
 * Restoring does not feed back into `onChangeText`: UIKit only calls its
 * delegate for text the reader typed, not for text set on the field.
 */
export function SearchBar({value, onChangeText, ...props}: SearchBarProps): React.ReactNode {
	let navigation = useNavigation<StackNavigation>()
	let searchBar = React.useRef<SearchBarCommands>(null)

	React.useEffect(() => {
		return navigation.addListener('gestureCancel', () => {
			searchBar.current?.setText(value)
		})
	}, [navigation, value])

	return (
		<Stack.SearchBar
			ref={searchBar}
			{...props}
			onChangeText={(event) => onChangeText(event.nativeEvent.text)}
		/>
	)
}
