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
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {openUrl} from '@frogpond/open-url'
import {callPhone} from '../../source/components/call-phone'
import {sendEmail} from '../../source/components/send-email'
import {DetailRow, DisclosureRow} from '../../source/components/rows'
import * as c from '@frogpond/colors'
import {PersonHeader} from '../../source/features/directory/person-header'
import {directoryContactOptions} from '../../source/features/directory/query'
import type {
	CampusLocation,
	Department,
	DirectorySearchTypeEnum,
} from '../../source/features/directory/types'
import {LoadErrorView, LoadingView, NoticeView} from '@frogpond/notice'

export default function DirectoryDetailPage(): React.ReactNode {
	let {index, query, type} = useLocalSearchParams<{
		index: string
		query?: string
		type?: string
	}>()

	// An entry is an index into a search's results, so a link that names no
	// search -- `AllAboutOlaf://directory/0` -- has nothing to look up.
	if (!query || !type) {
		return (
			<>
				<Stack.Screen options={{title: ''}} />
				<NoticeView systemImage="questionmark.circle" title="Entry Not Found" />
			</>
		)
	}

	return (
		<DirectoryDetail index={Number(index)} query={query} type={type as DirectorySearchTypeEnum} />
	)
}

type DirectoryDetailProps = {
	index: number
	query: string
	type: DirectorySearchTypeEnum
}

function DirectoryDetail({index, query, type}: DirectoryDetailProps): React.ReactNode {
	let router = useRouter()

	let {
		data: contact,
		isLoading,
		error,
		refetch,
	} = useQuery(directoryContactOptions(query, type, index))

	// No title in the bar: the heading below carries the name, and the bar
	// repeating it said the same thing twice.
	let screenTitle = <Stack.Screen options={{title: ''}} />

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
				<LoadErrorView error={error} onRetry={refetch} />
			</>
		)
	}

	if (!contact) {
		return (
			<>
				{screenTitle}
				<NoticeView systemImage="questionmark.circle" title="Entry Not Found" />
			</>
		)
	}

	const {campusLocations, displayTitle, officeHours, profileUrl, email, departments, pronouns} =
		contact

	return (
		<>
			{screenTitle}
			<Host style={styles.host}>
				<List modifiers={[listStyle('insetGrouped')]}>
					<Section>
						<PersonHeader person={contact} subtitle={displayTitle} />
					</Section>

					{/* An empty array of pronouns is still an array, so asking whether
					    the entry *has* pronouns is the question -- otherwise ABOUT
					    drew its header over nothing. */}
					{pronouns?.length || email || officeHours || profileUrl ? (
						<Section title="About">
							{pronouns?.length ? <DetailRow label="Pronouns" value={pronouns.join(', ')} /> : null}

							{email ? (
								<DetailRow
									destination="action"
									label="Email"
									onPress={() => sendEmail({to: [email], subject: '', body: ''})}
									value={email}
								/>
							) : null}

							{officeHours ? (
								<DetailRow
									destination="external"
									label={officeHours.title}
									onPress={officeHours.href ? () => openUrl(String(officeHours.href)) : undefined}
									value={officeHours.description}
								/>
							) : null}

							{profileUrl ? (
								<DetailRow
									destination="external"
									label="Profile"
									onPress={() => openUrl(profileUrl)}
									value={profileUrl}
								/>
							) : null}
						</Section>
					) : null}

					{campusLocations.map((loc: CampusLocation) => (
						<Section key={`${loc.display ?? ''}-${loc.phone ?? ''}`} title="Office">
							{loc.display ? <DetailRow label="Location" value={loc.display} /> : null}
							{loc.phone ? (
								<DetailRow
									destination="action"
									label="Phone"
									onPress={() => callPhone(loc.phone, {prompt: false})}
									value={loc.phone}
								/>
							) : null}
						</Section>
					))}

					{departments.length > 0 ? (
						<Section title={departments.length === 1 ? 'Department' : 'Departments'}>
							{departments.map((dept: Department) => (
								<DisclosureRow
									key={dept.name}
									onPress={() =>
										router.navigate({
											pathname: '/directory',
											params: {queryType: 'department', queryParam: dept.name},
										})
									}
									title={dept.name}
								/>
							))}
						</Section>
					) : null}

					<Section>
						<Text modifiers={CREDIT_MODIFIERS}>Powered by the St. Olaf Directory</Text>
					</Section>
				</List>
			</Host>
		</>
	)
}

/// No card behind the credit: it names where the data came from, and is not a
/// row of it. Matches the org detail.
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
