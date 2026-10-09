import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Form, Host, Section} from '@expo/ui/swift-ui'
import {accessibilityIdentifier} from '@expo/ui/swift-ui/modifiers'
import {Stack, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {LoadErrorView, LoadingView, NoticeView} from '@frogpond/notice'

import {NavigationRow} from '../../source/components/rows'
import {noticesInForce} from '../../source/features/faqs/notices'
import {useLegacyCampus} from '../../source/features/campus/store'
import {faqsOptionsFor} from '../../source/features/faqs/query'

const styles = StyleSheet.create({
	host: {
		flex: 1,
	},
})

function NoticesList(): React.ReactNode {
	let router = useRouter()
	let {data, error, isLoading, refetch} = useQuery(faqsOptionsFor(useLegacyCampus()))

	if (isLoading) {
		return <LoadingView />
	}

	// A failed refetch leaves the last good notices in the cache; only a query
	// that has never succeeded has nothing to show.
	if (!data) {
		return <LoadErrorView error={error} onRetry={refetch} />
	}

	let notices = noticesInForce(data.faqs)

	if (notices.length === 0) {
		return (
			<NoticeView
				description="Nothing needs your attention right now."
				systemImage="bell.slash"
				title="No Notices"
			/>
		)
	}

	return (
		<Host modifiers={[accessibilityIdentifier('screen-notices')]} style={styles.host}>
			<Form>
				<Section>
					{notices.map((notice) => (
						<NavigationRow
							key={notice.id}
							onPress={() => router.navigate({pathname: '/faq', params: {faqId: notice.id}})}
							title={notice.bannerTitle}
						/>
					))}
				</Section>
			</Form>
		</Host>
	)
}

/// The banners now in force, each opening its FAQ.
export default function NoticesPage(): React.ReactNode {
	return (
		<>
			<Stack.Title>Notices</Stack.Title>

			<NoticesList />
		</>
	)
}
