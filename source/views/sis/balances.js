// @flow

import React from 'react'
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  RefreshControl,
  Alert,
} from 'react-native'
import {TabBarIcon} from '../components/tabbar-icon'
import {connect} from 'react-redux'
import {Cell, TableView, Section} from 'react-native-tableview-simple'

import {
  hasSeenAcknowledgement,
  type State as SettingsState,
  type LoginStateType,
} from '../../flux/parts/settings'
import {updateBalances, type State as BalancesState} from '../../flux/parts/sis'

import delay from 'delay'
import * as c from '../components/colors'

import type {TopLevelViewPropsType} from '../types'

const DISCLAIMER = 'This data may be outdated or otherwise inaccurate.'
const LONG_DISCLAIMER =
  'This data may be inaccurate.\nBon Appétit is always right.\nThis app is unofficial.'

type Props = TopLevelViewPropsType & {
  flex: ?string,
  ole: ?string,
  print: ?string,
  weeklyMeals: ?string,
  dailyMeals: ?string,
  mealPlan: ?string,
  loginState: LoginStateType,
  message: ?string,
  alertSeen: boolean,

  hasSeenAcknowledgement: () => any,
  updateBalances: boolean => any,
}

type State = {
  loading: boolean,
}

class BalancesView extends React.PureComponent<Props, State> {
  static navigationOptions = {
    tabBarLabel: 'Balances',
    tabBarIcon: TabBarIcon('card'),
  }

  state = {
    loading: false,
  }

  componentWillMount() {
    // calling "refresh" here, to make clear to the user
    // that the data is being updated
    this.refresh()
  }

  componentDidMount() {
    if (!this.props.alertSeen) {
      Alert.alert('', LONG_DISCLAIMER, [
        {text: 'I Disagree', onPress: this.goBack, style: 'cancel'},
        {text: 'Okay', onPress: this.props.hasSeenAcknowledgement},
      ])
    }
  }

  refresh = async () => {
    let start = Date.now()
    this.setState(() => ({loading: true}))

    await this.fetchData()

    // wait 0.5 seconds – if we let it go at normal speed, it feels broken.
    let elapsed = Date.now() - start
    await delay(500 - elapsed)

    this.setState(() => ({loading: false}))
  }

  fetchData = async () => {
    await this.props.updateBalances(true)
  }

  openSettings = () => {
    this.props.navigation.navigate('SettingsView')
  }

  goBack = () => {
    this.props.navigation.goBack(null)
  }

  render() {
    let {flex, ole, print, dailyMeals, weeklyMeals, mealPlan} = this.props
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
          <Section header="BALANCES" footer={DISCLAIMER}>
            <View style={styles.balancesRow}>
              <FormattedValueCell
                label="Flex"
                value={flex}
                indeterminate={loading}
                formatter={getValueOrNa}
              />

              <FormattedValueCell
                label="Ole"
                value={ole}
                indeterminate={loading}
                formatter={getValueOrNa}
              />

              <FormattedValueCell
                label="Copy/Print"
                value={print}
                indeterminate={loading}
                formatter={getValueOrNa}
                style={styles.finalCell}
              />
            </View>
          </Section>

          <Section header="MEAL PLAN" footer={DISCLAIMER}>
            <View style={styles.balancesRow}>
              <FormattedValueCell
                label="Daily Meals Left"
                value={dailyMeals}
                indeterminate={loading}
                formatter={getValueOrNa}
              />

              <FormattedValueCell
                label="Weekly Meals Left"
                value={weeklyMeals}
                indeterminate={loading}
                formatter={getValueOrNa}
                style={styles.finalCell}
              />
            </View>
            {mealPlan && (
              <Cell cellStyle="Subtitle" title="Meal Plan" detail={mealPlan} />
            )}
          </Section>

          {this.props.loginState !== 'logged-in' || this.props.message ? (
            <Section footer="You'll need to log in again so we can update these numbers.">
              {this.props.loginState !== 'logged-in' ? (
                <Cell
                  cellStyle="Basic"
                  title="Log in with St. Olaf"
                  accessory="DisclosureIndicator"
                  onPress={this.openSettings}
                />
              ) : null}

              {this.props.message ? (
                <Cell cellStyle="Basic" title={this.props.message} />
              ) : null}
            </Section>
          ) : null}
        </TableView>
      </ScrollView>
    )
  }
}

function mapState(state: {
  sis: {balances: BalancesState},
  settings: SettingsState,
}) {
  return {
    flex: state.sis.balances.flex,
    ole: state.sis.balances.ole,
    print: state.sis.balances.print,
    weeklyMeals: state.sis.balances.weekly,
    dailyMeals: state.sis.balances.daily,
    mealPlan: state.sis.balances.plan,
    message: state.sis.balances.message,
    alertSeen: state.settings.unofficiallyAcknowledged,

    loginState: state.settings.credentials.state,
  }
}

function mapDispatch(dispatch) {
  return {
    updateBalances: force => dispatch(updateBalances(force)),
    hasSeenAcknowledgement: () => dispatch(hasSeenAcknowledgement()),
  }
}

export default connect(mapState, mapDispatch)(BalancesView)

let cellMargin = 10
let cellSidePadding = 10
let cellEdgePadding = 10

let styles = StyleSheet.create({
  stage: {
    backgroundColor: c.iosLightBackground,
    paddingTop: 20,
    paddingBottom: 20,
  },

  common: {
    backgroundColor: c.white,
  },

  balances: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: c.iosSeparator,
  },

  finalCell: {
    borderRightWidth: 0,
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
  rectangleButtonText: {
    paddingTop: 15,
    color: c.black,
    textAlign: 'center',
    fontSize: 16,
  },
})

function getValueOrNa(value: ?string): string {
  // eslint-disable-next-line no-eq-null
  if (value == null) {
    return 'N/A'
  }
  return value
}

function FormattedValueCell({
  indeterminate,
  label,
  value,
  style,
  formatter,
}: {
  indeterminate: boolean,
  label: string,
  value: ?string,
  style?: any,
  formatter: (?string) => string,
}) {
  return (
    <View style={[styles.rectangle, styles.common, styles.balances, style]}>
      <Text
        selectable={true}
        style={styles.financialText}
        autoAdjustsFontSize={true}
      >
        {indeterminate ? '…' : formatter(value)}
      </Text>
      <Text style={styles.rectangleButtonText} autoAdjustsFontSize={true}>
        {label}
      </Text>
    </View>
  )
}
