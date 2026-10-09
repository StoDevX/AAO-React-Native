import * as React from 'react'
import {StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

import {LoadingView, NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'

import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {client} from '@frogpond/api'
import {HtmlContent, type HtmlContentHandle} from '@frogpond/html-content'
import {CSS_CODE_STYLES} from '../../../source/features/developer/api-test/util/highlight-styles'
import {syntaxHighlight} from '../../../source/features/developer/api-test/util/highlight'
import {DebugView} from '../../../source/features/developer/debug'
import {parseBody} from '../../../source/features/developer/api-test/util/parse-body'
import {clientPath} from '../../../source/features/developer/api-test/util/request-path'
import {
	isErrorStatus,
	statusLine,
	type ApiResponse,
} from '../../../source/features/developer/api-test/util/response'
import {ResponseText} from '../../../source/features/developer/api-test/response-text'

type DisplayMode = 'raw' | 'parsed'

export default function APITestDetailPage(): React.ReactNode {
	// Sent as given: a route's path carries the server's mount prefix, and
	// query values such as calendar ids are case-sensitive.
	let {
		path = '',
		method = 'GET',
		route,
		request,
		sentAt,
	} = useLocalSearchParams<{
		path?: string
		method?: string
		route?: string
		request?: string
		sentAt?: string
	}>()
	let router = useRouter()

	let [displayMode, setDisplayMode] = React.useState<DisplayMode>('raw')

	let {data, isLoading, error} = useQuery<ApiResponse | null, Error>({
		queryKey: ['api-test', method, path, sentAt],
		queryFn: async ({signal}) => {
			if (!path) {
				return null
			}
			// An error status is a response worth reading, not a failure. And a
			// confirmed DELETE or POST goes out once: ky would retry a DELETE on a
			// 5xx, as the query would on a failure, focus or reconnect.
			let response = await client(clientPath(path), {
				method,
				signal,
				throwHttpErrors: false,
				retry: 0,
			})
			return {status: response.status, statusText: response.statusText, body: await response.text()}
		},
		staleTime: 0,
		gcTime: 0,
		retry: false,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	})

	const body = React.useMemo(() => parseBody(data?.body ?? ''), [data])

	let page = React.useRef<HtmlContentHandle>(null)

	const jsonViewContent = React.useMemo((): React.ReactNode => {
		if (body.kind !== 'json') {
			return null
		}

		const formatted = JSON.stringify(body.value, null, 2)
		const highlighted = syntaxHighlight(formatted)

		const HTML_CONTENT = `
			${CSS_CODE_STYLES}
			<pre>${highlighted}</pre>
		`

		return (
			<HtmlContent html={HTML_CONTENT} ref={page} style={{backgroundColor: c.systemBackground}} />
		)
	}, [body])

	return (
		<>
			<Stack.Title>{path}</Stack.Title>
			<Stack.Toolbar placement="right">
				{route ? (
					<Stack.Toolbar.Button
						accessibilityLabel="Edit Request"
						icon="pencil"
						onPress={() =>
							router.navigate({
								pathname: '/developer/api-test/compose',
								params: {path: route, method, request},
							})
						}
					/>
				) : null}
				<Stack.Toolbar.Menu icon="ellipsis.circle">
					{/* Only the raw JSON is a web page with a find bar of its own. */}
					{data && !isErrorStatus(data.status) && body.kind === 'json' && displayMode === 'raw' ? (
						<Stack.Toolbar.MenuAction
							icon="magnifyingglass"
							onPress={() => page.current?.findInPage()}
						>
							Find on Page
						</Stack.Toolbar.MenuAction>
					) : null}
					<Stack.Toolbar.MenuAction
						icon="curlybraces"
						isOn={displayMode === 'parsed'}
						onPress={() => setDisplayMode(displayMode === 'parsed' ? 'raw' : 'parsed')}
					>
						Parse as JSON
					</Stack.Toolbar.MenuAction>
				</Stack.Toolbar.Menu>
			</Stack.Toolbar>

			<SafeAreaView edges={['left', 'right']} style={styles.container}>
				{error !== null ? (
					<ResponseText
						body={String(error)}
						heading={{text: 'Request Failed', color: c.systemRed}}
					/>
				) : !isLoading && !path ? (
					<NoticeView systemImage="questionmark.circle" title="Route Not Found" />
				) : isLoading || !data ? (
					<LoadingView />
				) : isErrorStatus(data.status) ? (
					<ResponseText body={data.body} heading={{text: statusLine(data), color: c.systemRed}} />
				) : body.kind === 'empty' ? (
					<NoticeView description={statusLine(data)} systemImage="tray" title="Empty Response" />
				) : body.kind === 'text' ? (
					<ResponseText body={body.text} />
				) : displayMode === 'raw' ? (
					jsonViewContent
				) : (
					<DebugView state={body.value} />
				)}
			</SafeAreaView>
		</>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.systemBackground,
		flex: 1,
	},
})
