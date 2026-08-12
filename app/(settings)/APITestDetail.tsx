import * as React from 'react'
import {View, StyleSheet, TextInput} from 'react-native'

import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'

import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {client} from '@frogpond/api'
import {iOSUIKit} from 'react-native-typography'
import {HtmlContent} from '@frogpond/html-content'
import {CSS_CODE_STYLES} from '../../source/features/settings/screens/api-test/util/highlight-styles'
import {syntaxHighlight} from '../../source/features/settings/screens/api-test/util/highlight'
import {DebugView} from '../../source/features/settings/screens/debug'

type DisplayMode = 'raw' | 'parsed'

export default function APITestDetailPage(): React.ReactNode {
	let router = useRouter()
	let {displayName = ''} = useLocalSearchParams<{displayName?: string}>()

	const cleanedName = displayName.trim().toLowerCase()
	let [displayMode, setDisplayMode] = React.useState<DisplayMode>('raw')

	let {data, isLoading, error} = useQuery<string, Error>({
		queryKey: ['api-test', cleanedName],
		queryFn: ({signal, queryKey: [_group]}) => {
			if (!cleanedName) {
				return ''
			}
			return client.get(cleanedName, {signal}).text()
		},
		staleTime: 0,
		gcTime: 0,
	})

	const jsonViewContent = React.useMemo((): React.ReactNode => {
		if (data === undefined) {
			return <></>
		}

		const parsed = JSON.parse(data ?? '') as unknown
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

	return (
		<>
			<Stack.Title>{cleanedName}</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Menu icon="ellipsis.circle">
					<Stack.Toolbar.MenuAction
						onPress={() => router.navigate('/NetworkLogger')}
					>
						Network Logger
					</Stack.Toolbar.MenuAction>
					<Stack.Toolbar.MenuAction
						isOn={displayMode === 'parsed'}
						onPress={() =>
							setDisplayMode(displayMode === 'parsed' ? 'raw' : 'parsed')
						}
					>
						Parse as JSON
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>

			<View style={styles.container}>
				{error !== null ? (
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
					jsonViewContent
				) : (
					<DebugView state={JSON.parse(data || '{}') as unknown} />
				)}
			</View>
		</>
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
		...iOSUIKit.bodyObject,
	},
})
