// @flow
import * as React from 'react'
import {StyleSheet} from 'react-native'
import AlphabetListView from '@hawkrives/react-native-alphabetlistview'
import * as c from '../components/colors'

const styles = StyleSheet.create({
	listView: {
		paddingRight: 21,
		backgroundColor: c.white,
	},
	sectionItems: {
		alignItems: 'center',
		right: 3,
	},
})

type Props = Object

export class StyledAlphabetListView extends React.Component<Props> {
	static initialListSize = 12
	static pageSize = 8

	render() {
		return (
			<AlphabetListView
				contentContainerStyle={styles.listView}
				initialListSize={StyledAlphabetListView.initialListSize}
				pageSize={StyledAlphabetListView.pageSize}
				sectionListStyle={styles.sectionItems}
				{...this.props}
			/>
		)
	}
}
