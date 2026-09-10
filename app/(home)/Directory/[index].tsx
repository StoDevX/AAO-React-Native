import * as React from 'react'
import {StyleSheet, Image as RNImage} from 'react-native'
import {Host, HStack, List, RNHostView, Section, Spacer, Text} from '@expo/ui/swift-ui'
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
import {callPhone} from '../../../source/components/call-phone'
import {sendEmail} from '../../../source/components/send-email'
import {DetailRow, DisclosureRow} from '../../../source/components/rows'
import * as c from '@frogpond/colors'
import {directoryContactOptions} from '../../../source/features/directory/query'
import type {
	CampusLocation,
	Department,
	DirectorySearchTypeEnum,
} from '../../../source/features/directory/types'
import {LoadingView, NoticeView} from '@frogpond/notice'

export default function DirectoryDetailPage(): React.ReactNode {
	let router = useRouter()

	let {index, query, type} = useLocalSearchParams<{
		index: string
		query: string
		type: string
	}>()

	let {
		data: contact,
		isLoading,
		error,
		refetch,
	} = useQuery(directoryContactOptions(query, type as DirectorySearchTypeEnum, Number(index)))

	// The screen's only copy of the name: a large title that collapses on
	// scroll, rather than a static heading repeated in the body.
	let screenTitle = (
		<>
			<Stack.Screen options={{headerLargeTitleEnabled: true}} />
			<Stack.Title>{contact?.displayName ?? 'Contact'}</Stack.Title>
		</>
	)

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

	if (!contact) {
		return (
			<>
				{screenTitle}
				<NoticeView text="Could not find this directory entry." />
			</>
		)
	}

	const {
		campusLocations,
		displayTitle,
		photo,
		officeHours,
		profileUrl,
		email,
		departments,
		pronouns,
	} = contact

	return (
		<>
			{screenTitle}
			<Host style={styles.host}>
				<List modifiers={[listStyle('insetGrouped')]}>
					<Section>
						{/* The photo is a network image, so React Native draws it and
						    SwiftUI hosts it. Spacers either side rather than the RN
						    `alignSelf`, which a hosted view sizing to its own contents
						    has nothing to align within. */}
						<HStack modifiers={[frame({maxWidth: Infinity})]}>
							<Spacer />
							<RNHostView matchContents={true}>
								<RNImage
									accessibilityIgnoresInvertColors={true}
									resizeMode="cover"
									source={{uri: photo}}
									style={styles.image}
								/>
							</RNHostView>
							<Spacer />
						</HStack>
						<Text modifiers={HEADER_MODIFIERS}>{displayTitle}</Text>
					</Section>

					{/* An empty array of pronouns is still an array, so asking whether
					    the entry *has* pronouns is the question -- otherwise ABOUT
					    drew its header over nothing. */}
					{pronouns?.length || email || officeHours || profileUrl ? (
						<Section title="ABOUT">
							{pronouns?.length ? <DetailRow label="Pronouns" value={pronouns.join(', ')} /> : null}

							{email ? (
								<DetailRow
									label="Email"
									onPress={() => sendEmail({to: [email], subject: '', body: ''})}
									value={email}
								/>
							) : null}

							{officeHours ? (
								<DetailRow
									label={officeHours.title}
									onPress={officeHours.href ? () => openUrl(String(officeHours.href)) : undefined}
									value={officeHours.description}
								/>
							) : null}

							{profileUrl ? (
								<DetailRow label="Profile" onPress={() => openUrl(profileUrl)} value={profileUrl} />
							) : null}
						</Section>
					) : null}

					{campusLocations.map((loc: CampusLocation, i: number) => (
						<Section key={i} title="OFFICE">
							{loc.display ? <DetailRow label="Location" value={loc.display} /> : null}
							{loc.phone ? (
								<DetailRow
									label="Phone"
									onPress={() => callPhone(loc.phone, {prompt: false})}
									value={loc.phone}
								/>
							) : null}
						</Section>
					))}

					{departments.length ? (
						<Section title={departments.length === 1 ? 'DEPARTMENT' : 'DEPARTMENTS'}>
							{departments.map((dept: Department) => (
								<DisclosureRow
									key={dept.name}
									onPress={() =>
										router.push({
											pathname: '/Directory',
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

const HEADER_MODIFIERS = [
	font({textStyle: 'subheadline'}),
	foregroundStyle(c.secondaryLabel),
	multilineTextAlignment('center'),
]

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
	image: {
		width: 100,
		height: 100,
		alignSelf: 'center',
		borderRadius: 4,
		borderWidth: 0.2,
		borderColor: c.label,
	},
})
