import * as React from 'react'
import {Stack} from 'expo-router'
import {ScrollView, StyleSheet} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import * as c from '@frogpond/colors'
import {Markdown} from '@frogpond/markdown'
import {LoadErrorView, LoadingView} from '@frogpond/notice'
import {useQuery} from '@tanstack/react-query'
import {useCampus} from '../../source/features/campus/store'
import {privacyOptions} from '../../source/features/about/privacy-query'
import {queryScreenState} from '../../source/lib/query-screen-state'

const styles = StyleSheet.create({
	scrollView: {
		backgroundColor: c.systemBackground,
		paddingHorizontal: 15,
		paddingVertical: 15,
	},
})

function PrivacyPolicy(): React.ReactNode {
	let campus = useCampus()
	let {data, error, isLoading, isError, refetch} = useQuery(privacyOptions(campus.id))
	let state = queryScreenState({data, isLoading, isError})

	if (state === 'loading') {
		return <LoadingView />
	}

	if (state === 'error' || data === undefined) {
		return <LoadErrorView error={error} onRetry={refetch} />
	}

	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.scrollView}>
			<SafeAreaView edges={['left', 'right']}>
				<Markdown source={data} />
			</SafeAreaView>
		</ScrollView>
	)
}

export default function PrivacyPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Privacy</Stack.Title>
			<PrivacyPolicy />
		</>
	)
}
