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
} from 'react-native'

import {Cell, Section, TableView} from 'react-native-tableview-simple'
import {tracker} from '../../analytics'
import {isLoggedIn} from '../../lib/login'
import delay from 'delay'
import isNil from 'lodash/isNil'
import isError from 'lodash/isError'
import * as c from '../components/colors'
import {getFinancialData, getWeeklyMealsRemaining} from '../../lib/financials'
import ErrorView from './error-screen'

const buttonStyles = StyleSheet.create({
  Common: {
    backgroundColor: c.white,
  },
  Balances: {
    borderRightWidth: 1,
    borderRightColor: c.iosGray,
  },
  Courses: {
    borderRightWidth: 1,
    borderRightColor: c.iosGray,
  },
  Search: {},
})

export default class BalancesView extends React.Component {
  static propTypes = {
    navigator: React.PropTypes.object,
    route: React.PropTypes.object,
  };

  state = {
    flex: null,
    ole: null,
    print: null,
    weeklyMeals: null,
    dailyMeals: null,
    successsFinancials: false,
    loading: true,
    error: null,
    refreshing: false,
    loggedIn: false,
  }

  state: {
    flex: null|number,
    ole: null|number,
    print: null|number,
    weeklyMeals: null|number,
    dailyMeals: null|number,
    successsFinancials: bool,
    loading: bool,
    error: null|Error,
    refreshing: bool,
    loggedIn: bool,
  };

  componentWillMount() {
    this.loadIfLoggedIn()
  }

  loadIfLoggedIn = async () => {
    let shouldContinue = await this.checkLogin()
    if (shouldContinue) {
      await this.fetchData()
    }
  }

  checkLogin = async () => {
    let loggedIn = await isLoggedIn()
    this.setState({loggedIn})
    return loggedIn
  }

  fetchData = async (forceFromServer: boolean=false) => {
    try {
      let [
        sisFinancialsInfo,
        mealsRemaining,
      ] = await Promise.all([
        getFinancialData(forceFromServer),
        getWeeklyMealsRemaining(),
      ])

      if (sisFinancialsInfo.error) {
        this.setState({loggedIn: false})
      } else {
        let {flex, ole, print} = sisFinancialsInfo.value
        this.setState({flex, ole, print})
      }

      if (isError(mealsRemaining)) {
        this.setState({loggedIn: false})
      } else {
        let {weeklyMeals, dailyMeals} = mealsRemaining
        this.setState({weeklyMeals, dailyMeals})
      }
    } catch (error) {
      tracker.trackException(error.message)
      this.setState({error})
      console.warn(error)
    }
    this.setState({loading: false})
  }

  refresh = async () => {
    let start = Date.now()
    this.setState({refreshing: true})

    await this.fetchData(true)

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = start - Date.now()
    await delay(500 - elapsed)

    this.setState({refreshing: false})
  }

  getFormattedCurrency(value: null|number): string {
    if (isNil(value)) {
      return 'N/A'
    }
    return '$' + (((value: any): number) / 100).toFixed(2)
  }

  getFormattedMealsRemaining(value: null|number): string {
    if (isNil(value)) {
      return 'N/A'
    }
    return ((value: any): string)
  }

  render() {
    if (this.state.error) {
      return <Text>Error: {this.state.error.message}</Text>
    }

    if (!this.state.loggedIn) {
      return <ErrorView
        route={this.props.route}
        navigator={this.props.navigator}
        onLoginComplete={() => this.loadIfLoggedIn()}
      />
    }

    let {flex, ole, print, loading, dailyMeals, weeklyMeals} = this.state

    return (
      <ScrollView
        contentContainerStyle={styles.stage}
        refreshControl={
          <RefreshControl
            refreshing={this.state.refreshing}
            onRefresh={this.refresh}
          />
        }
      >
        <TableView>
          <Section header='BALANCES'>
            <View style={styles.balancesRow}>
              <View style={[styles.rectangle, buttonStyles.Common, buttonStyles.Balances]}>
                <Text style={styles.financialText} autoAdjustsFontSize={true}>
                  {loading ? '…' : this.getFormattedCurrency(flex)}
                </Text>
                <Text style={styles.rectangleButtonText} autoAdjustsFontSize={true}>
                  Flex
                </Text>
              </View>

              <View style={[styles.rectangle, buttonStyles.Common, buttonStyles.Balances]}>
                <Text style={styles.financialText} autoAdjustsFontSize={true}>
                  {loading ? '…' : this.getFormattedCurrency(ole)}
                </Text>
                <Text style={styles.rectangleButtonText} autoAdjustsFontSize={true}>
                  Ole
                </Text>
              </View>

              <View style={[styles.rectangle, buttonStyles.Common, buttonStyles.Balances]}>
                <Text style={styles.financialText} autoAdjustsFontSize={true}>
                  {loading ? '…' : this.getFormattedCurrency(print)}
                </Text>
                <Text style={styles.rectangleButtonText} autoAdjustsFontSize={true}>
                  Copy/Print
                </Text>
              </View>
             </View>
          </Section>

          <Section header='MEAL PLAN'>
            <Cell cellStyle='RightDetail'
              title='Daily Meals Left'
              detail={this.getFormattedMealsRemaining(dailyMeals)}
            />

            <Cell cellStyle='RightDetail'
              title='Weekly Meals Left'
              detail={this.getFormattedMealsRemaining(weeklyMeals)}
            />
          </Section>
        </TableView>
      </ScrollView>
    )
  }
}

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
