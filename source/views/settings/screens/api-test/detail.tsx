import React from 'react'
import {View, StyleSheet, Platform, TextInput} from 'react-native'

import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'

import {RouteProp, useNavigation, useRoute} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import {SettingsStackParamList} from '../../../../navigation/types'
import {useQuery} from '@tanstack/react-query'
import {client} from '@frogpond/api'
import {iOSUIKit, material} from 'react-native-typography'
import {HtmlContent} from '@frogpond/html-content'
import {CellToggle} from '@frogpond/tableview/cells'
import {NetworkLoggerButton} from '@frogpond/navigation-buttons'
import {CSS_CODE_STYLES} from './util/highlight-styles'
import {syntaxHighlight} from './util/highlight'
import {DebugView} from '../debug'

type DisplayMode = 'raw' | 'parsed'

export const APITestDetailView = (): React.JSX.Element => {
	let navigation = useNavigation()
	let route = useRoute<RouteProp<SettingsStackParamList, 'APITestDetail'>>()

	const {displayName} = route.params.query
	const cleanedName = displayName.trim().toLowerCase()
	let [displayMode, setDisplayMode] = React.useState<DisplayMode>('raw')

	let {data, isLoading, error} = useQuery({
		queryKey: ['api-test', cleanedName],
		queryFn: ({signal, queryKey: [_group]}) => {
			if (!cleanedName) {
				return ''
			}
			return client.get(cleanedName, {signal, cache: 'no-store'}).text()
		},
		staleTime: 0,
		cacheTime: 0,
	})

	React.useLayoutEffect(() => {
		const rightButton = () => <NetworkLoggerButton />
		navigation.setOptions({
			title: cleanedName,
			headerRight: rightButton,
		})
	}, [cleanedName, navigation])

	const JSONView = React.useCallback((): React.JSX.Element => {
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
	}, [data])

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
		) : !isLoading && !cleanedName ? (
			<NoticeView text="No route was found." />
		) : isLoading ? (
			<LoadingView />
		) : displayMode === 'raw' ? (
			<JSONView />
		) : (
			<DebugView state={JSON.parse(data || '{}')} />
		)

	return (
		<View style={styles.container}>
			<CellToggle
				label="Parse as JSON"
				onChange={(val) => { setDisplayMode(val ? 'parsed' : 'raw'); }}
				value={displayMode === 'parsed'}
			/>

			{APIResponse}
		</View>
	)
}

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
})

export const NavigationOptions: NativeStackNavigationOptions = {}
