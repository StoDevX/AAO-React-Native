/**
 * @flow
 * All About Olaf
 * Balances page
 */

import React from 'react'
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  RefreshControl,
  Navigator,
} from 'react-native'

import {connect} from 'react-redux'
import {Cell, TableView} from 'react-native-tableview-simple'

import {
  updateMealsRemaining,
  updateFinancialData,
} from '../../flux/parts/sis'

import delay from 'delay'
import isNil from 'lodash/isNil'
import * as c from '../components/colors'
import {SectionWithNullChildren} from '../components/section-with-null-children'

import type {TopLevelViewPropsType} from '../types'

const buttonStyles = StyleSheet.create({
  common: {
    backgroundColor: c.white,
  },
  balances: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: c.iosGray,
  },
})

class BalancesView extends React.Component {
  state = {
    loading: false,
  }

  props: TopLevelViewPropsType & {
    flex: ?number,
    ole: ?number,
    print: ?number,
    weeklyMeals: ?number,
    dailyMeals: ?number,
    tokenValid: bool,
    credentialsValid: bool,
    balancesError: ?string,
    mealsError: ?string,

    updateFinancialData: () => any,
    updateMealsRemaining: () => any,
  };

  refresh = async () => {
    let start = Date.now()
    this.setState({loading: true})

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = start - Date.now()
    await delay(500 - elapsed)

    this.setState({loading: false})
  }

  fetchData = async () => {
    await Promise.all([
      this.props.updateFinancialData(true),
      this.props.updateMealsRemaining(true),
    ])
  }

  openSettings = () => {
    this.props.navigator.push({
      id: 'SettingsView',
      title: 'Settings',
      index: this.props.route.index + 1,
      sceneConfig: Navigator.SceneConfigs.FloatFromBottom,
      onDismiss: () => this.props.navigator.pop(),
    })
  }

  render() {
    let {flex, ole, print, dailyMeals, weeklyMeals} = this.props
    let {loading} = this.state

    return (
      <ScrollView
        contentContainerStyle={styles.stage}
        refreshControl={
          <RefreshControl
            refreshing={this.state.loading}
            onRefresh={this.refresh}
          />
        }
      >
        <TableView>
          <SectionWithNullChildren header='BALANCES'>
            <View style={styles.balancesRow}>
              <FinancialBalancesCell
                label='Flex'
                value={flex}
                indeterminate={loading}
              />

              <FinancialBalancesCell
                label='Ole'
                value={ole}
                indeterminate={loading}
              />

              <FinancialBalancesCell
                label='Copy/Print'
                value={print}
                indeterminate={loading}
                style={{borderRightWidth: 0}}
              />
            </View>

            {this.props.tokenValid ?
              null
              : <Cell
                cellStyle='Basic'
                title='Log into the SIS'
                accessory='DisclosureIndicator'
                onPress={this.openSettings}
              />}

            {this.props.balancesError ? <Cell cellStyle='Basic' title={this.props.balancesError} /> : null}
          </SectionWithNullChildren>

          <SectionWithNullChildren header='MEAL PLAN'>
            <Cell cellStyle='RightDetail'
              title='Daily Meals Left'
              detail={loading ? '…' : getFormattedMealsRemaining(dailyMeals)}
            />

            <Cell cellStyle='RightDetail'
              title='Weekly Meals Left'
              detail={loading ? '…' : getFormattedMealsRemaining(weeklyMeals)}
            />

            {this.props.credentialsValid ?
              null
              : <Cell
                cellStyle='Basic'
                title='Log in with St. Olaf'
                accessory='DisclosureIndicator'
                onPress={this.openSettings}
              />}

            {this.props.mealsError ? <Cell cellStyle='Basic' title={this.props.mealsError} /> : null}
          </SectionWithNullChildren>
        </TableView>
      </ScrollView>
    )
  }
}

function mapStateToProps(state) {
  return {
    flex: state.sis.balances.flex,
    ole: state.sis.balances.ole,
    print: state.sis.balances.print,
    weeklyMeals: state.sis.meals.weekly,
    dailyMeals: state.sis.meals.daily,
    balancesError: state.sis.balances.message,
    mealsError: state.sis.meals.message,

    credentialsValid: state.settings.credentials.valid,
    tokenValid: state.settings.token.valid,
  }
}

function mapDispatchToProps(dispatch) {
  return {
    updateMealsRemaining: force => dispatch(updateMealsRemaining(force)),
    updateFinancialData: force => dispatch(updateFinancialData(force)),
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(BalancesView)

let cellMargin = 10
let cellSidePadding = 10
let cellEdgePadding = 10

let styles = StyleSheet.create({
  stage: {
    backgroundColor: '#EFEFF4',
    paddingTop: 20,
    paddingBottom: 20,
  },

  balancesRow: {
    flexDirection: 'row',
    marginTop: 0,
    marginBottom: -10,
  },

  rectangle: {
    height: 88,
    flex: 1,
    alignItems: 'center',
    paddingTop: cellSidePadding,
    paddingBottom: cellSidePadding,
    paddingRight: cellEdgePadding,
    paddingLeft: cellEdgePadding,
    marginBottom: cellMargin,
  },

  // Text styling
  financialText: {
    paddingTop: 8,
    color: c.iosDisabledText,
    textAlign: 'center',
    fontWeight: '200',
    fontSize: 23,
  },
  rectangleButtonIcon: {
    color: c.black,
  },
  rectangleButtonText: {
    paddingTop: 15,
    color: c.black,
    textAlign: 'center',
    fontSize: 16,
  },
})


function getFormattedCurrency(value: ?number): string {
  if (isNil(value)) {
    return 'N/A'
  }
  return '$' + (((value: any): number) / 100).toFixed(2)
}

function getFormattedMealsRemaining(value: ?number): string {
  if (isNil(value)) {
    return 'N/A'
  }
  return (value: any).toString()
}

function FinancialBalancesCell({indeterminate, label, value, style}: {
  indeterminate: boolean,
  label: string,
  value: ?number,
  style?: any,
}) {
  return (
    <View style={[styles.rectangle, buttonStyles.common, buttonStyles.balances, style]}>
      <Text style={styles.financialText} autoAdjustsFontSize={true}>
        {indeterminate ? '…' : getFormattedCurrency(value)}
      </Text>
      <Text style={styles.rectangleButtonText} autoAdjustsFontSize={true}>
        {label}
      </Text>
    </View>
  )
}
