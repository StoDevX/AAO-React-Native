import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import * as c from '@frogpond/colors'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {JobRow} from '../../../source/features/sis/student-work/job-row'
import {jobPostingsOptions, type JobSummary} from '@frogpond/ccc-jobs'
import {useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.systemBackground,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

export default function SISStudentWorkPage(): React.ReactNode {
	let router = useRouter()
	let {data = [], error, isError, refetch, isRefetching, isLoading} = useQuery(jobPostingsOptions)

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

	return (
		<SectionList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={
				isLoading ? <LoadingView /> : <NoticeView text="There are no open job postings." />
			}
			contentContainerStyle={styles.contentContainer}
			contentInsetAdjustmentBehavior="automatic"
			keyExtractor={(item: JobSummary) => item.id}
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item}) => (
				<JobRow
					job={item}
					onPress={(job: JobSummary) =>
						router.push({pathname: '/JobDetail', params: {jobId: job.id}})
					}
				/>
			)}
			renderSectionHeader={({section: {title}}) => <ListSectionHeader title={title} />}
			sections={sections}
			style={styles.listContainer}
			testID="student-work-list"
		/>
	)
}
