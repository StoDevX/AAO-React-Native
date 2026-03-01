import * as React from 'react'
import {StyleSheet, SectionList} from 'react-native'
import * as c from '@frogpond/colors'
import {ListSeparator, ListSectionHeader} from '@frogpond/lists'
import {NoticeView, LoadingView} from '@frogpond/notice'
import {JobRow} from './job-row'
import type {JobType} from './types'
import {useRouter} from 'expo-router'
import {useStudentWorkPostings} from './query'

const styles = StyleSheet.create({
	listContainer: {
		backgroundColor: c.systemBackground,
	},
	contentContainer: {
		flexGrow: 1,
	},
})

const StudentWorkView = (): React.JSX.Element => {
	let router = useRouter()
	let {
		data = [],
		error,
		isError,
		refetch,
		isRefetching,
		isLoading,
	} = useStudentWorkPostings()

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
				isLoading ? (
					<LoadingView />
				) : (
					<NoticeView text="There are no open job postings." />
				)
			}
			contentContainerStyle={styles.contentContainer}
			keyExtractor={(_item: JobType, index: number) => index.toString()}
			onRefresh={refetch}
			refreshing={isRefetching}
			renderItem={({item}) => (
				<JobRow
					job={item}
					onPress={(job: JobType) =>
						router.push({
							pathname: '/sis/job/[job]',
							params: {job: JSON.stringify(job)},
						})
					}
				/>
			)}
			renderSectionHeader={({section: {title}}) => (
				<ListSectionHeader title={title} />
			)}
			sections={data}
			style={styles.listContainer}
		/>
	)
}

export {StudentWorkView as View}
