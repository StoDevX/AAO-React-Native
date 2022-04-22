import * as React from 'react'
import {ScrollView, StyleSheet, Text} from 'react-native'
import {Column, Row} from '@frogpond/layout'
import {Detail, ListRow, ListSeparator, Title} from '@frogpond/lists'
import * as c from '@frogpond/colors'
import map from 'lodash/map'
import {DietaryTagsDetail} from './dietary-tags-detail'
import {calculateAmount} from './lib/calculate-amount'
import type {MasterCorIconMapType, MenuItemType as MenuItem} from './types'
import {
	NavigationAction,
	NavigationRoute,
	NavigationScreenProp,
} from 'react-navigation'
import size from 'lodash/size'

type Props = {
	navigation: NavigationScreenProp<NavigationRoute, NavigationAction> & {
		state: {params: {icons: MasterCorIconMapType; item: MenuItem}}
	}
}

export class MenuItemDetailView extends React.Component<Props> {
	static navigationOptions = {
		title: 'Nutrition',
	}

	render(): JSX.Element {
		const {item, icons} = this.props.navigation.state.params

		return (
			<ScrollView style={styles.container}>
				<Text selectable={true} style={styles.title}>
					{item.label}
				</Text>

				<DietaryTagsDetail
					corIcons={icons}
					dietary={item.cor_icon}
					style={styles.iconContainer}
				/>

				{item.description ? (
					<React.Fragment>
						<ListRow
							arrowPosition="none"
							contentContainerStyle={styles.container}
							fullWidth={false}
						>
							<Title>Description</Title>
							<Detail>{item.description}</Detail>
						</ListRow>
						<ListSeparator />
					</React.Fragment>
				) : null}

				{size(item.nutrition_details) > 1 ? (
					map(item.nutrition_details, (nutrition, key: number) => {
						return (
							<React.Fragment key={`${nutrition}-${key}`}>
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
							</React.Fragment>
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
