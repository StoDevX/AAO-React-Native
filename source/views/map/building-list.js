// @flow

import * as React from 'react'
import {FlatList} from 'react-native'
import glamorous from 'glamorous-native'
import {ListSeparator, Title, Detail, ListRow} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import type {Building, Feature} from './types'

type Props = {
	buildings: Array<Feature<Building>>,
	onSelect: string => any,
	scrollEnabled: boolean,
}

export class BuildingList extends React.Component<Props> {
	keyExtractor = (item: Feature<Building>) => item.id

	onPress = (id: string) => this.props.onSelect(id)

	renderItem = ({item}: {item: Feature<Building>}) => {
		let point = item.geometry.geometries.find(geo => geo.type === 'Point') || {}
		let detail =
			item.properties.address || (point.coordinates || []).join(',') || ''
		return (
			<ListRow onPress={() => this.onPress(item.id)} spacing={{left: 12}}>
				<Title>
					{item.properties.name}
					{item.properties.nickname ? (
						<Nickname> ({item.properties.nickname})</Nickname>
					) : null}
				</Title>
				<Detail>{detail}</Detail>
			</ListRow>
		)
	}

	separator = () => <ListSeparator spacing={{left: 12}} />

	render() {
		return (
			<FlatList
				ItemSeparatorComponent={this.separator}
				contentInsetAdjustmentBehavior="automatic"
				data={this.props.buildings}
				keyExtractor={this.keyExtractor}
				keyboardDismissMode="on-drag"
				renderItem={this.renderItem}
				scrollEnabled={this.props.scrollEnabled}
			/>
		)
	}
}

const Nickname = glamorous.text({
	color: c.iosDisabledText,
})
