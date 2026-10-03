import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Stack} from 'expo-router'
import {Host, List, Section, Text} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import {sendEmail} from '../../components/send-email'
import {DisclosureRow} from '../../components/rows'
import {MessPage} from './mess-page'
import {PageLoading, PageNotice} from './page-notice'
import {messAboutOptions} from './query'
import type {AboutSection} from './types'

/** A heading of the About page: a row to write to each person under it, then its paragraphs. */
function AboutSectionRows({section}: {section: AboutSection}): React.ReactNode {
	return (
		<Section title={section.title}>
			{section.contacts.map((contact) => (
				<DisclosureRow
					key={contact.email}
					destination="action"
					detail={contact.email}
					onPress={() => sendEmail({to: [contact.email]})}
					title={contact.role}
				/>
			))}
			{section.paragraphs.map((paragraph) => (
				<Text key={paragraph}>{paragraph}</Text>
			))}
		</Section>
	)
}

/**
 * The paper's About page as a list: a section for each of its headings, so the page's own
 * grouping of whom to write to, and its submission policy, carry over as the paper edits them.
 */
export function AboutScreen(): React.ReactNode {
	let about = useQuery(messAboutOptions)

	return (
		<>
			<Stack.Screen options={{title: 'About the Messenger'}} />
			{about.data ? (
				<Host style={styles.list}>
					<List
						modifiers={[
							listStyle('insetGrouped'),
							refreshable(async () => {
								await about.refetch()
							}),
						]}
					>
						{about.data.map((section) => (
							<AboutSectionRows key={section.title} section={section} />
						))}
					</List>
				</Host>
			) : (
				<MessPage onRefresh={() => about.refetch()}>
					{about.isError ? (
						<PageNotice error={about.error} onRetry={() => about.refetch()} />
					) : (
						<PageLoading paused={about.fetchStatus === 'paused'} />
					)}
				</MessPage>
			)}
		</>
	)
}

const styles = StyleSheet.create({
	list: {flex: 1},
})
