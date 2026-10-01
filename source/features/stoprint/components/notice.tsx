import * as React from 'react'
import {RefreshControl, ScrollView, StyleSheet} from 'react-native'
import {NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'

type Props = {
	buttonText: string
	description?: string
	header: string
	onPress: () => void
	onRefresh?: () => void
	refreshing?: boolean
	text: string
}

export const StoPrintNoticeView = (props: Props): React.ReactElement => {
	let {buttonText, description, header, onPress, text, onRefresh, refreshing} = props

	return (
		<ScrollView
			contentContainerStyle={styles.content}
			contentInsetAdjustmentBehavior="automatic"
			refreshControl={
				onRefresh && refreshing != null ? (
					<RefreshControl onRefresh={onRefresh} refreshing={refreshing} />
				) : undefined
			}
			showsVerticalScrollIndicator={false}
			style={styles.container}
		>
			<NoticeView
				action={{label: buttonText, onPress}}
				description={description ? `${text}\n\n${description}` : text}
				systemImage="printer"
				title={header}
			/>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.systemGroupedBackground,
	},
	content: {
		flex: 1,
	},
})
