// @flow
import React, {Component} from 'react'
import {FlatList, StyleSheet} from 'react-native'
import {ListSeparator} from '@frogpond/lists'
import {LicenseItem} from './item'
import {type NavigationScreenProp} from 'react-navigation'
import {type LicenseType} from './types'

type Props = {
	licenses: Array<LicenseType>,
	navigation: NavigationScreenProp<*>,
}

export class LicensesList extends Component<Props> {
	renderSeparator = () => <ListSeparator spacing={{left: 101}} />

	renderItem = ({item}: {item: LicenseType}) => (
		<LicenseItem item={item} navigation={this.props.navigation} />
	)

	render() {
		const {licenses} = this.props

		return (
			<FlatList
				ItemSeparatorComponent={this.renderSeparator}
				data={licenses}
				keyExtractor={({key}) => key}
				renderItem={this.renderItem}
				style={styles.list}
			/>
		)
	}
}

const styles = StyleSheet.create({
	list: {
		flex: 1,
	},
})
