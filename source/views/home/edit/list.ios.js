// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import {type ReduxState} from '../../../redux'
import {saveHomescreenOrder} from '../../../redux/parts/homescreen'
import {connect} from 'react-redux'
import fromPairs from 'lodash/fromPairs'
import map from 'lodash/map'
import {Viewport} from '@frogpond/viewport'

import TableView from 'react-native-tableview'
import debounce from 'lodash/debounce'

import {allViews} from '../../views'
import {EditHomeRow} from './row'
import {toggleViewDisabled} from '../../../redux/parts/homescreen'

const {Item, Section} = TableView

/*
 * tableViewCellEditingStyle
 *  - None:   0
 *  - Delete: 1
 *  - Insert: 2
 */
const EDITING_STYLE = 0

const objViews = fromPairs(allViews.map(v => [v.view, v]))

const styles = StyleSheet.create({
	table: {
		flex: 1,
	},
})

type ReduxStateProps = {
	order: string[],
	inactiveViews: string[],
}

type ReduxDispatchProps = {
	onSaveOrder: (string[]) => any,
	onToggleViewDisabled: string => any,
}

type Props = ReduxStateProps & ReduxDispatchProps

class EditHomeView extends React.PureComponent<Props> {
	static navigationOptions = {
		title: 'Edit Home',
	}

	// todo: change the save order logic in redux/parts/homescreen because this returns the row order info
	_saveOrder = (order: string[]) => this.props.onSaveOrder(order)

	onChangeOrder = debounce(this._saveOrder, 100)

	render() {
		console.log(this.props)
		return (
			<Viewport
				render={() => (
					// <SortableList
					//  data={objViews}
					//  onChangeOrder={this.onChangeOrder}
					//  order={this.props.order}
					//  renderRow={props => this.renderRow({...props, width})}
					// />

					// project:         https://github.com/aksonov/react-native-tableview
					// all types:       https://github.com/aksonov/react-native-tableview/blob/master/src/index.d.ts
					// editing example: https://github.com/aksonov/react-native-tableview/blob/master/example/src/screens/Example6.js

					<TableView
						editing={true}
						moveWithinSectionOnly={false}
						onChange={this.onChangeOrder}
						// todo: get rid of this and make the section reordring handle disabling
						onPress={event =>
							this.props.navigation.getParam('reordering')
								? null
								: this.props.onToggleViewDisabled(event.view)
						}
						style={styles.table}
						tableViewCellEditingStyle={EDITING_STYLE}
						tableViewStyle={TableView.Consts.Style.Grouped}
					>
						<Section canEdit={true} canMove={true} label="Visible">
							{map(objViews, (view, key) => (
								<Item
									key={key}
									accessoryType={TableView.Consts.AccessoryType.Checkmark}
									isEnabled={!this.props.inactiveViews.includes(objViews.view)}
									view={key}
								>
									{view.title}
								</Item>
							))}
						</Section>

						<Section canEdit={true} canMove={true} label="Hidden" />
					</TableView>
				)}
			/>
		)
	}
}

function mapState(state: ReduxState): ReduxStateProps {
	return {
		order: state.homescreen ? state.homescreen.order : [],
		inactiveViews: state.homescreen ? state.homescreen.inactiveViews : [],
	}
}

function mapDispatch(dispatch): ReduxDispatchProps {
	return {
		onSaveOrder: newOrder => dispatch(saveHomescreenOrder(newOrder)),
		onToggleViewDisabled: view => dispatch(toggleViewDisabled(view)),
	}
}

export const ConnectedEditHomeView = connect(
	mapState,
	mapDispatch,
)(EditHomeView)
