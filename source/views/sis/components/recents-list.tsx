import * as React from 'react'
import {StyleSheet, Text, View, Platform, Pressable} from 'react-native'
import {ListSeparator, ListRow} from '@frogpond/lists'
import {NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {noop} from 'lodash'

interface Props {
	actionLabel?: string
	emptyHeader: string
	emptyText: string
	onAction?: () => void
	onItemPress: (item: string) => void
	items: string[]
	title: string
}

function RecentItemsList(props: Props): React.JSX.Element {
	let {items, actionLabel, onAction, title, emptyHeader, emptyText} = props

	let foreground = {color: c.link}

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
						<Pressable
							key={item}
							// adding long press allows for copy text when selectable is true
							onLongPress={noop}
							onPress={() => { props.onItemPress(item); }}
						>
							<ListRow arrowPosition="none">
								<Text
									numberOfLines={1}
									selectable={true}
									style={[foreground, styles.listItem]}
								>
									{item}
								</Text>
							</ListRow>
						</Pressable>

						{i < items.length - 1 ? (
							<ListSeparator spacing={{left: 17, right: 17}} />
						) : null}
					</>
				))
			)}
		</>
	)
}

export {RecentItemsList}

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
		color: c.secondaryLabel,
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
		color: c.label,
		fontSize: 20,
		fontWeight: 'bold',
		padding: 10,
		paddingLeft: 17,
	},
})
