import * as React from 'react'
import {StyleSheet, Text, View, Platform} from 'react-native'
import {ListSeparator, ListRow} from '@frogpond/lists'
import {NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import type {AppTheme} from '@frogpond/app-theme'
import {withTheme} from '@frogpond/app-theme'

type Props = {
	actionLabel?: string
	emptyHeader: string
	emptyText: string
	onAction?: () => any
	onItemPress: (item: string) => any
	items: string[]
	title: string
	theme: AppTheme
}

function RecentItemsList(props: Props) {
	let {items, actionLabel, onAction, title, emptyHeader, emptyText, theme} =
		props

	let foreground = {color: theme.iosPushButtonCellForeground}

	return (
		<>
			<View style={styles.rowFlex}>
				{Boolean(title) && <Text style={styles.subHeader}>{title}</Text>}
				{onAction && (
					<Text onPress={onAction} style={[foreground, styles.sideButton]}>
						{actionLabel}
					</Text>
				)}
			</View>

			{items.length === 0 ? (
				<NoticeView
					header={emptyHeader}
					style={styles.notice}
					text={emptyText}
					textStyle={styles.noticeText}
				/>
			) : (
				items.map((item, i) => (
					<>
						<ListRow
							key={item}
							arrowPosition="none"
							onPress={() => props.onItemPress(item)}
						>
							<Text
								numberOfLines={1}
								style={[
									{color: props.theme.iosPushButtonCellForeground},
									styles.listItem,
								]}
							>
								{item}
							</Text>
						</ListRow>

						{i < items.length - 1 ? (
							<ListSeparator spacing={{left: 17, right: 17}} />
						) : null}
					</>
				))
			)}
		</>
	)
}

export const RawRecentItemsList = RecentItemsList

const ThemedRecentItemsList = withTheme(RecentItemsList)

export {ThemedRecentItemsList as RecentItemsList}

const styles = StyleSheet.create({
	listItem: {
		paddingVertical: Platform.OS === 'ios' ? 5 : 0,
		paddingLeft: 2,
		fontSize: 16,
	},
	notice: {
		paddingTop: 30,
		paddingBottom: 35,
	},
	noticeText: {
		color: c.gray,
	},
	rowFlex: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	sideButton: {
		paddingRight: 17,
		fontSize: 16,
		padding: 14,
	},
	subHeader: {
		fontSize: 20,
		fontWeight: 'bold',
		padding: 10,
		paddingLeft: 17,
	},
})
