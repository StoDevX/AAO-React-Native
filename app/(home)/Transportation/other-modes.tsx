import * as React from 'react'
import {StyleSheet} from 'react-native'
import {ContentUnavailableView, Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle, refreshable} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {LoadingView, NoticeView} from '@frogpond/notice'
import {openUrl} from '@frogpond/open-url'
import {useQuery} from '@tanstack/react-query'
import {DisclosureRow} from '../../../source/components/rows'
import {otherModesGroupedOptions} from '../../../source/features/transportation/other-modes/query'

export default function OtherModesPage(): React.ReactNode {
	let {data = [], error, refetch, isLoading, isError} = useQuery(otherModesGroupedOptions)

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
				{data.length === 0 ? (
					<ContentUnavailableView
						description="Check back once the college publishes its transit options."
						systemImage="bus"
						title="No Other Modes"
					/>
				) : (
					data.map((section) => (
						<Section key={section.title} title={section.title}>
							{section.data.map((mode) => (
								<DisclosureRow
									key={mode.name}
									detail={mode.synopsis}
									onPress={() => openUrl(mode.url)}
									title={mode.name}
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
