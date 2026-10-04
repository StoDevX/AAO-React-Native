import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, LabeledContent, List, Section, Text} from '@expo/ui/swift-ui'
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
import {DisclosureRow} from '../../source/components/rows'
import {SelectableText} from '@frogpond/selectable-text'
import * as c from '@frogpond/colors'
import {openUrl} from '@frogpond/open-url'
import {sendEmail} from '../../source/components/send-email'
import {ViewablePhotoRow} from '../../source/components/inset-image-row'
import {
	instagramHandle,
	meetingRows,
	showNameOrEmail,
	withDetail,
} from '../../source/features/student-orgs/util'
import {decode} from '@frogpond/html-lib'
import {orgByNameOptions, orgDetailOptions} from '../../source/features/student-orgs/query'
import {LoadErrorView, LoadingView, NoticeView} from '@frogpond/notice'

/**
 * The org's name, at the top of its own screen.
 *
 * A large title would be the platform idiom, but UIKit draws one on a single
 * line -- and these names run long enough that it truncated more often than
 * not. In the body it wraps.
 *
 * `frame(maxWidth: Infinity)` before the alignment: a Text is only as wide as
 * its content, so centring inside that says nothing about the row it sits in,
 * and the name drew left of centre until it filled the row.
 */
const ORG_NAME_MODIFIERS = [
	font({textStyle: 'title', weight: 'semibold'}),
	foregroundStyle(c.label),
	frame({maxWidth: Infinity}),
	multilineTextAlignment('center'),
]

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
	let router = useRouter()
	let {data: listed, isLoading, error, refetch} = useQuery(orgByNameOptions(name))
	// What only the org's own Presence pages hold. The list's record is shown
	// meanwhile, and stands alone if this never arrives.
	let {data: detail} = useQuery({
		...orgDetailOptions(listed?.organizationUri ?? ''),
		enabled: Boolean(listed?.organizationUri),
	})

	let org = listed ? withDetail(listed, detail) : undefined

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
				<LoadErrorView error={error} onRetry={refetch} />
			</>
		)
	}

	if (!org) {
		return (
			<>
				{screenTitle}
				<NoticeView
					description={`No student org is called “${name}”.`}
					systemImage="person.3"
					title="Organization Not Found"
				/>
			</>
		)
	}

	let {name: orgName, category, website, contacts, advisors, description} = org
	let meetings = meetingRows(org)
	// The server keeps every handle the officers typed, repeats included.
	let socialLinks = org.socialLinks ? [...new Set(org.socialLinks)] : []
	let officeHours = decode(org.officeHours?.trim() ?? '')
	let officeLocation = decode(org.officeLocation?.trim() ?? '')
	let additionalInformation = org.additionalInformation?.trim() ?? ''
	let openCalendar = () =>
		router.navigate({pathname: '/calendar/organization', params: {name: orgName}})

	return (
		<>
			{screenTitle}
			<Host style={styles.host}>
				<List modifiers={[listStyle('insetGrouped')]}>
					<Section>
						<Text modifiers={ORG_NAME_MODIFIERS}>{orgName}</Text>
					</Section>

					{org.photoUrl ? (
						<Section>
							<ViewablePhotoRow
								label={`Photo for ${orgName}`}
								testID="org-cover-photo"
								uri={org.photoUrl}
							/>
						</Section>
					) : null}

					{category ? (
						<Section title="Category">
							<Text>{category}</Text>
						</Section>
					) : null}

					{meetings.length > 0 ? (
						<Section title="Meetings">
							{meetings.map(({label, value}) => (
								<LabeledContent key={label} label={label}>
									<SelectableText text={decode(value)} />
								</LabeledContent>
							))}
						</Section>
					) : null}

					{/* Always offered: Presence's own "has upcoming events" flag disagrees
					    with its events feed, so the calendar is the one to say. */}
					<Section>
						<DisclosureRow onPress={openCalendar} title="Upcoming Events" />
					</Section>

					{website ? (
						<Section title="Website">
							<DisclosureRow
								destination="external"
								onPress={() => openUrl(website)}
								title={website}
							/>
						</Section>
					) : null}

					{contacts.length > 0 ? (
						<Section title="Contact">
							{contacts.map((contact) => (
								<DisclosureRow
									key={contact.email}
									destination="external"
									detail={contact.title}
									onPress={() => sendEmail({to: [contact.email], subject: orgName})}
									title={showNameOrEmail(contact)}
								/>
							))}
						</Section>
					) : null}

					{advisors.length > 0 ? (
						<Section title={advisors.length === 1 ? 'Advisor' : 'Advisors'}>
							{advisors.map((contact) => (
								<DisclosureRow
									key={contact.email}
									destination="external"
									onPress={() => sendEmail({to: [contact.email], subject: orgName})}
									title={contact.name}
								/>
							))}
						</Section>
					) : null}

					{socialLinks.length > 0 ? (
						<Section title="Instagram">
							{socialLinks.map((link) => (
								<DisclosureRow
									key={link}
									destination="external"
									onPress={() => openUrl(link)}
									title={instagramHandle(link)}
								/>
							))}
						</Section>
					) : null}

					{officeHours || officeLocation ? (
						<Section title="Office">
							{officeLocation ? (
								<LabeledContent label="Location">
									<SelectableText text={officeLocation} />
								</LabeledContent>
							) : null}
							{officeHours ? (
								<LabeledContent label="Hours">
									<SelectableText text={officeHours} />
								</LabeledContent>
							) : null}
						</Section>
					) : null}

					{description ? (
						<Section title="Description">
							<SelectableText text={decode(description)} />
						</Section>
					) : null}

					{additionalInformation ? (
						<Section title="More Information">
							<SelectableText text={additionalInformation} />
						</Section>
					) : null}

					{org.constitutionUrl ? (
						<Section>
							<DisclosureRow
								destination="external"
								onPress={() => openUrl(org.constitutionUrl ?? '')}
								title="Constitution"
							/>
						</Section>
					) : null}

					<Section>
						<Text modifiers={CREDIT_MODIFIERS}>Powered by Presence</Text>
					</Section>
				</List>
			</Host>
		</>
	)
}
