import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, List, Section, Text} from '@expo/ui/swift-ui'
import {
	font,
	foregroundStyle,
	frame,
	listRowBackground,
	listStyle,
	multilineTextAlignment,
} from '@expo/ui/swift-ui/modifiers'
import {Stack, useLocalSearchParams} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {DisclosureRow, SelectableText} from '../../../source/components/rows'
import * as c from '@frogpond/colors'
import {openUrl} from '@frogpond/open-url'
import {sendEmail} from '../../../source/components/send-email'
import {showNameOrEmail} from '../../../source/features/student-orgs/util'
import {decode} from '@frogpond/html-lib'
import {orgByNameOptions} from '../../../source/features/student-orgs/query'
import {LoadingView, NoticeView} from '@frogpond/notice'

/// No card behind the credit: it is a footnote about where the data came
/// from, not a row of it.
const CREDIT_MODIFIERS = [
	font({textStyle: 'caption2'}),
	foregroundStyle(c.secondaryLabel),
	multilineTextAlignment('center'),
	frame({maxWidth: Infinity}),
	listRowBackground('clear'),
]

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})

export default function StudentOrgsDetailPage(): React.ReactNode {
	let {name} = useLocalSearchParams<{name: string}>()
	let {data: org, isLoading, error, refetch} = useQuery(orgByNameOptions(name))

	let screenTitle = <Stack.Title>{org?.name ?? name}</Stack.Title>

	if (isLoading) {
		return (
			<>
				{screenTitle}
				<LoadingView />
			</>
		)
	}

	if (error) {
		return (
			<>
				{screenTitle}
				<NoticeView
					buttonText="Try Again"
					onPress={refetch}
					text={`A problem occured while loading: ${
						error instanceof Error ? error.message : 'Unknown error'
					}`}
				/>
			</>
		)
	}

	if (!org) {
		return (
			<>
				{screenTitle}
				<NoticeView text={`Could not find student org "${name}".`} />
			</>
		)
	}

	let {name: orgName, category, meetings, website, contacts, advisors, description} = org

	return (
		<>
			{screenTitle}
			<Host style={styles.host}>
				<List modifiers={[listStyle('insetGrouped')]}>
					{category ? (
						<Section title="CATEGORY">
							<Text>{category}</Text>
						</Section>
					) : null}

					{meetings ? (
						<Section title="MEETINGS">
							<SelectableText text={decode(meetings)} />
						</Section>
					) : null}

					{website ? (
						<Section title="WEBSITE">
							<DisclosureRow onPress={() => openUrl(website)} title={website} />
						</Section>
					) : null}

					{contacts.length ? (
						<Section title="CONTACT">
							{contacts.map((contact) => (
								<DisclosureRow
									key={contact.email}
									detail={contact.title}
									onPress={() => sendEmail({to: [contact.email], subject: orgName})}
									title={showNameOrEmail(contact)}
								/>
							))}
						</Section>
					) : null}

					{advisors.length ? (
						<Section title={advisors.length === 1 ? 'ADVISOR' : 'ADVISORS'}>
							{advisors.map((contact) => (
								<DisclosureRow
									key={contact.email}
									onPress={() => sendEmail({to: [contact.email], subject: orgName})}
									title={contact.name}
								/>
							))}
						</Section>
					) : null}

					{description ? (
						<Section title="DESCRIPTION">
							<SelectableText text={decode(description)} />
						</Section>
					) : null}

					<Section>
						<Text modifiers={CREDIT_MODIFIERS}>Powered by Presence.io</Text>
					</Section>
				</List>
			</Host>
		</>
	)
}
