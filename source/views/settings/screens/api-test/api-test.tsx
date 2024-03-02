import * as React from 'react'
import * as c from '@frogpond/colors'
import {Platform, StyleSheet, TextInput, Text, View} from 'react-native'
import {client} from '@frogpond/api'
import {useDebounce} from '@frogpond/use-debounce'
import {useQuery} from '@tanstack/react-query'
import {HtmlContent} from '@frogpond/html-content'
import {Icon} from '@frogpond/icon'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {commonStyles} from '@frogpond/navigation-buttons/styles'
import {LoadingView} from '@frogpond/notice'
import {Touchable} from '@frogpond/touchable'
import {CellToggle} from '@frogpond/tableview/cells'

import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {iOSUIKit, material} from 'react-native-typography'

import {DebugView} from '../debug'
import {syntaxHighlight} from './util/highlight'
import {CSS_CODE_STYLES} from './util/highlight-styles'
import {ChangeTextEvent} from '../../../../navigation/types'
import {ServerRoutesListView} from './routes-list'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.systemBackground,
		flex: 1,
	},
	error: {
		padding: 10,
		color: c.brickRed,
	},
	output: {
		marginVertical: 3,
		paddingRight: 4,
		...Platform.select({
			ios: iOSUIKit.bodyObject,
			android: material.body1Object,
		}),
	},
	emptySearch: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	emptySearchText: {
		fontSize: 18,
		color: c.secondaryLabel,
		textAlign: 'center',
		paddingTop: 20,
		paddingBottom: 10,
	},
	headerLeftButton: {
		fontWeight: '600',
		color: c.link,
	},
})

type DisplayMode = 'raw' | 'parsed'

export const APITestView = (): JSX.Element => {
	let [searchPath, setSearchPath] = React.useState<string>('')
	let path = useDebounce(searchPath.trim().toLowerCase(), 500)

	let [displayMode, setDisplayMode] = React.useState<DisplayMode>('raw')

	let {data, isLoading, error} = useQuery({
		queryKey: ['api-test', path],
		queryFn: ({signal, queryKey: [_group, path]}) => {
			if (!path) {
				return ''
			}
			return client.get(path, {signal, cache: 'no-store'}).text()
		},
		staleTime: 0,
		cacheTime: 0,
	})

	let navigation = useNavigation()

	const HeaderLeftButton = () => (
		<Touchable
			accessibilityLabel="Reset"
			accessibilityRole="button"
			accessible={true}
			borderless={true}
			highlight={false}
			onPress={() => setSearchPath('')}
			style={commonStyles.button}
		>
			<Text style={[commonStyles.text, styles.headerLeftButton]}>Reset</Text>
		</Touchable>
	)

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerLeft: () => Platform.OS === 'ios' && <HeaderLeftButton />,
			headerSearchBarOptions: {
				autoCapitalize: 'none',
				barTintColor: c.systemFill,
				// android-only
				autoFocus: true,
				hideNavigationBar: false,
				hideWhenScrolling: false,
				onChangeText: (event: ChangeTextEvent) =>
					setSearchPath(event.nativeEvent.text),
				placeholder: 'path/to/uri',
			},
		})
	}, [navigation])

	const JSONView = (): JSX.Element => {
		if (data === undefined) {
			return <></>
		}

		const parsed = JSON.parse(data ?? '')
		const formatted = JSON.stringify(parsed, null, 2)
		const highlighted = syntaxHighlight(formatted)

		const HTML_CONTENT = `
			${CSS_CODE_STYLES}
			<pre>${highlighted}</pre>
		`

		return (
			<HtmlContent
				html={HTML_CONTENT}
				style={{backgroundColor: c.systemBackground}}
			/>
		)
	}

	const EmptySearch = () => {
		return (
			<View style={styles.emptySearch}>
				<Icon color={c.secondaryLabel} name="analytics-outline" size={64} />
				<Text style={styles.emptySearchText}>Search for an API Endpoint</Text>
			</View>
		)
	}

	let APIResponse =
		error !== null ? (
			<TextInput
				editable={false}
				// this aligns the text to the top on iOS, and centers it on Android
				multiline={true}
				scrollEnabled={true}
				style={[styles.output, styles.error]}
				// use multiline with textAlignVertical="top" for the same behavior in both platforms
				textAlignVertical="top"
				value={String(error)}
			/>
		) : !path ? (
			<EmptySearch />
		) : isLoading ? (
			<LoadingView />
		) : displayMode === 'raw' ? (
			<JSONView />
		) : (
			<DebugView state={JSON.parse(data || '{}')} />
		)

	const SearchResponseView = () => (
		<View style={styles.container}>
			<CellToggle
				label="Parse as JSON"
				onChange={(val) => setDisplayMode(val ? 'parsed' : 'raw')}
				value={displayMode === 'parsed'}
			/>

			{APIResponse}
		</View>
	)

	return path.length ? (
		<SearchResponseView />
	) : (
		<ServerRoutesListView setSearchPath={setSearchPath} />
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'API Tester',
	presentation: 'modal',
	headerRight: () => Platform.OS === 'ios' && <CloseScreenButton />,
	gestureEnabled: Platform.OS === 'ios' && false,
}
