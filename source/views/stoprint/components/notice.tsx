import * as React from 'react'
import {
	Platform,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {NoticeView} from '@frogpond/notice'
import {sto} from '../../../lib/colors'

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
	let iconName = Platform.OS === 'ios' ? 'ios-print' : 'md-print'

	return (
		<ScrollView
			contentContainerStyle={styles.content}
			refreshControl={
				onRefresh && refreshing != null ? (
					<RefreshControl onRefresh={onRefresh} refreshing={refreshing} />
				) : undefined
			}
			showsVerticalScrollIndicator={false}
			style={styles.container}
		>
			<Icon color={sto.black} name={iconName} size={100} />
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
		backgroundColor: sto.white,
	},
	content: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	description: {
		marginHorizontal: 30,
		marginVertical: 20,
		textAlign: 'center',
	},
	notice: {
		flex: 0,
	},
})
