import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import * as c from '@frogpond/colors'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {JobRow} from '../../../source/features/sis/student-work/job-row'
import type {JobType} from '../../../source/features/sis/student-work/types'
import {useRouter} from 'expo-router'
import {studentWorkPostingsOptions} from '../../../source/features/sis/student-work/query'
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
	let {
		data = [],
		error,
		isError,
		refetch,
		isRefetching,
		isLoading,
	} = useQuery(studentWorkPostingsOptions)

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
			keyExtractor={(_item: JobType, index: number) => index.toString()}
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item}) => (
				<JobRow
					job={item}
					onPress={(job: JobType) =>
						router.push({
							pathname: '/JobDetail',
							params: {jobId: job.id.toString()},
						})
					}
				/>
			)}
			renderSectionHeader={({section: {title}}) => <ListSectionHeader title={title} />}
			sections={data}
			style={styles.listContainer}
			testID="student-work-list"
		/>
	)
}
