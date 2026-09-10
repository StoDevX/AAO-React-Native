import * as React from 'react'
import {StyleSheet} from 'react-native'
import {ContentUnavailableView, Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {jobPostingsOptions} from '@frogpond/ccc-jobs'
import {useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'
import {DisclosureRow} from '../../../source/components/rows'
import {postedOn} from '../../../source/features/sis/student-work/lib'

export default function SISStudentWorkPage(): React.ReactNode {
	let router = useRouter()
	let {data = [], error, isError, refetch, isLoading} = useQuery(jobPostingsOptions)

	let sections = React.useMemo(
		() =>
			data
				.filter((category) => category.jobs.length > 0)
				.map((category) => ({title: category.name, data: category.jobs})),
		[data],
	)

	if (isError) {
		return (
			<NoticeView
				buttonText="Try Again"
				onPress={refetch}
				text={`A problem occured while loading: ${error}`}
			/>
		)
	}

	if (isLoading) {
		return <LoadingView />
	}

	return (
		<Host style={styles.host}>
			<List
				modifiers={[
					listStyle('insetGrouped'),
					refreshable(async () => {
						await refetch()
					}),
				]}
			>
				{sections.length === 0 ? (
					<ContentUnavailableView systemImage="briefcase" title="There are no open job postings." />
				) : (
					sections.map((section) => (
						<Section key={section.title} title={section.title}>
							{section.data.map((job) => (
								<DisclosureRow
									key={job.id}
									detail={postedOn(job.postedDate)}
									onPress={() => router.push({pathname: '/JobDetail', params: {jobId: job.id}})}
									title={job.title}
									titleLines={2}
								/>
							))}
						</Section>
					))
				)}
			</List>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
