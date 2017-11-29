// @flow

import * as React from 'react'
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
  type LoginStateType,
} from '../../flux/parts/settings'
import {updateBalances} from '../../flux/parts/sis'
import {type ReduxState} from '../../flux'
import delay from 'delay'
import * as c from '../components/colors'
import type {TopLevelViewPropsType} from '../types'

const DISCLAIMER = 'This data may be outdated or otherwise inaccurate.'
const LONG_DISCLAIMER =
  'This data may be inaccurate.\nBon Appétit is always right.\nThis app is unofficial.'

type ReactProps = TopLevelViewPropsType

type ReduxStateProps = {
  flex: ?string,
  ole: ?string,
  print: ?string,
  weeklyMeals: ?string,
  dailyMeals: ?string,
  mealPlan: ?string,
  loginState: LoginStateType,
  message: ?string,
  alertSeen: boolean,
}

type ReduxDispatchProps = {
  hasSeenAcknowledgement: () => any,
  updateBalances: boolean => any,
}

type Props = ReactProps & ReduxStateProps & ReduxDispatchProps

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
            onRefresh={this.refresh}
            refreshing={this.state.loading}
          />
        }
      >
        <TableView>
          <Section footer={DISCLAIMER} header="BALANCES">
            <View style={styles.balancesRow}>
              <FormattedValueCell
                formatter={getValueOrNa}
                indeterminate={loading}
                label="Flex"
                value={flex}
              />

              <FormattedValueCell
                formatter={getValueOrNa}
                indeterminate={loading}
                label="Ole"
                value={ole}
              />

              <FormattedValueCell
                formatter={getValueOrNa}
                indeterminate={loading}
                label="Copy/Print"
                style={styles.finalCell}
                value={print}
              />
            </View>
          </Section>

          <Section footer={DISCLAIMER} header="MEAL PLAN">
            <View style={styles.balancesRow}>
              <FormattedValueCell
                formatter={getValueOrNa}
                indeterminate={loading}
                label="Daily Meals Left"
                value={dailyMeals}
              />

              <FormattedValueCell
                formatter={getValueOrNa}
                indeterminate={loading}
                label="Weekly Meals Left"
                style={styles.finalCell}
                value={weeklyMeals}
              />
            </View>
            {mealPlan && (
              <Cell cellStyle="Subtitle" detail={mealPlan} title="Meal Plan" />
            )}
          </Section>

          {this.props.loginState !== 'logged-in' || this.props.message ? (
            <Section footer="You'll need to log in again so we can update these numbers.">
              {this.props.loginState !== 'logged-in' ? (
                <Cell
                  accessory="DisclosureIndicator"
                  cellStyle="Basic"
                  onPress={this.openSettings}
                  title="Log in with St. Olaf"
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

function mapState(state: ReduxState): ReduxStateProps {
  return {
    flex: state.sis ? state.sis.flexBalance : null,
    ole: state.sis ? state.sis.oleBalance : null,
    print: state.sis ? state.sis.printBalance : null,
    weeklyMeals: state.sis ? state.sis.mealsRemainingThisWeek : null,
    dailyMeals: state.sis ? state.sis.mealsRemainingToday : null,
    mealPlan: state.sis ? state.sis.mealPlanDescription : null,
    message: state.sis ? state.sis.balancesErrorMessage : null,
    alertSeen: state.settings ? state.settings.unofficiallyAcknowledged : false,

    loginState: state.settings ? state.settings.loginState : 'logged-out',
  }
}

function mapDispatch(dispatch): ReduxDispatchProps {
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
        autoAdjustsFontSize={true}
        selectable={true}
        style={styles.financialText}
      >
        {indeterminate ? '…' : formatter(value)}
      </Text>
      <Text autoAdjustsFontSize={true} style={styles.rectangleButtonText}>
        {label}
      </Text>
    </View>
  )
}
