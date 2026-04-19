import * as React from 'react'
import {RefreshControl, ScrollView, StyleSheet, Text} from 'react-native'
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'
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
	let {buttonText, description, header, onPress, text, onRefresh, refreshing} =
		props

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
			<Icon color={c.systemFill} name="print" size={100} />
			<NoticeView
				buttonText={buttonText}
				header={header}
				onPress={onPress}
				style={styles.notice}
				text={text}
			/>
			{description ? (
				<Text style={styles.description}>{description}</Text>
			) : null}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.systemBackground,
	},
	content: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	description: {
		color: c.label,
		marginHorizontal: 30,
		marginVertical: 20,
		textAlign: 'center',
	},
	notice: {
		flex: 0,
	},
})
