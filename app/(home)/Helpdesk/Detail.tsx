import * as React from 'react'
import {StyleSheet} from 'react-native'
import {WebView} from 'react-native-webview'
import {Stack, useLocalSearchParams} from 'expo-router'
import {NoticeView} from '@frogpond/notice'

const styles = StyleSheet.create({
	webview: {flex: 1},
})

/**
 * The drill-in for every Helpdesk row -- KB articles, services, and request
 * forms are the real TeamDynamix portal pages, not scraped and re-rendered
 * natively, so this just loads the URL the caller found.
 */
export default function HelpdeskDetail(): React.ReactNode {
	let {url, title} = useLocalSearchParams<{url?: string; title?: string}>()

	let screenTitle = <Stack.Screen options={{title: title ?? 'Helpdesk'}} />

	// Every in-app caller passes a `href` off a parsed HelpdeskItem, which is
	// always populated, so a missing url here means a bad or malformed link
	// rather than anything this screen can recover from.
	if (!url) {
		return (
			<>
				{screenTitle}
				<NoticeView text="Could not find this page." />
			</>
		)
	}

	return (
		<>
			{screenTitle}
			<WebView source={{uri: url}} style={styles.webview} />
		</>
	)
}
