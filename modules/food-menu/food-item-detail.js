// @flow

import * as React from 'react'
import {Text, ScrollView, View, StyleSheet} from 'react-native'
import {Column, Row} from '@frogpond/layout'
import {ListRow, ListSeparator, Detail, Title} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import map from 'lodash/map'
import {DietaryTags} from './dietary-tags'
import {type TopLevelViewPropsType} from '../../source/views/types'
import type {
	MenuItemType as MenuItem,
	NutritionDetailType,
	MasterCorIconMapType,
} from './types'

type Props = TopLevelViewPropsType & {
	navigation: {state: {params: {icons: MasterCorIconMapType, item: MenuItem}}},
}

export class MenuItemDetailView extends React.Component<Props> {
	static navigationOptions = {
		title: 'Nutrition',
	}

	render() {
		const item = this.props.navigation.state.params.item
		const icons = this.props.navigation.state.params.icons

		const calculateAmount = (nutrition: NutritionDetailType) => {
			// turn "lessthang" and "lessthanmg" into "less than 1g", "less than 5mg", etc
			return nutrition.unit.includes('lessthan')
				? `less than ${nutrition.value}${nutrition.unit.split('lessthan')[1]}`
				: `${nutrition.value}${nutrition.unit}`
		}

		return (
			<ScrollView style={styles.container}>
				<Text selectable={true} style={styles.title}>
					{item.label}
				</Text>

				<DietaryTags
					corIcons={icons}
					dietary={item.cor_icon}
					isDetail={true}
					style={styles.iconContainer}
				/>

				{item.description ? (
					<View>
						<ListRow
							arrowPosition="none"
							contentContainerStyle={styles.container}
							fullWidth={false}
						>
							<Row>
								<Title>Description</Title>
							</Row>
							<Row>
								<Detail>{item.description}</Detail>
							</Row>
						</ListRow>
						<ListSeparator />
					</View>
				) : null}

				{item.nutrition_details &&
				Object.keys(item.nutrition_details).length > 1 ? (
					map(item.nutrition_details, (nutrition, key: number) => {
						return (
							<View key={`${nutrition}-${key}`}>
								<ListRow
									arrowPosition="none"
									fullWidth={false}
									style={styles.container}
								>
									<Row>
										<Column flex={1}>
											<Title>{nutrition.label}</Title>
										</Column>

										<Detail>{calculateAmount(nutrition)}</Detail>
									</Row>
								</ListRow>

								<ListSeparator />
							</View>
						)
					})
				) : (
					<Detail style={styles.noInfo}>No nutritional information</Detail>
				)}
			</ScrollView>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
	},
	title: {
		fontSize: 36,
		textAlign: 'center',
		marginHorizontal: 18,
		marginVertical: 10,
	},
	iconContainer: {
		flexDirection: 'column',
		marginHorizontal: 16,
		marginVertical: 10,
	},
	noInfo: {
		marginHorizontal: 16,
		marginVertical: 10,
	},
})
