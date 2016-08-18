// @flow
/**
 * All About Olaf
 * Balances page
 */

import React from 'react'
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
} from 'react-native'

import {Cell, Section, TableView} from 'react-native-tableview-simple'

import * as c from '../components/colors'
import {getFinancialData} from '../../lib/financials'

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
  state = {
    flex: null,
    ole: null,
    print: null,
    successsFinancials: false,
    loading: true,
    error: null,
  }

  state: {
    flex: null|number,
    ole: null|number,
    print: null|number,
    successsFinancials: bool,
    loading: bool,
    error: null|Error,
  };

  componentWillMount() {
    this.load()
  }

  load = async () => {
    try {
      let {flex, ole, print} = await getFinancialData()
      this.setState({flex, ole, print})
    } catch (error) {
      this.setState({error})
      console.error(error)
    }
    this.setState({loading: false})
  }

  render() {
    if (this.state.error) {
      return <Text>Error: {this.state.error.message}</Text>
    }

    let {flex, ole, print, loading} = this.state

    return (
      <ScrollView contentContainerStyle={styles.stage}>
        <TableView>
          <Section header='BALANCES'>
            <View style={styles.balancesRow}>
              <View style={[styles.rectangle, buttonStyles.Common, buttonStyles.Balances]}>
                <Text style={styles.financialText} autoAdjustsFontSize={true}>
                  {loading ? '…' : flex === null ? 'N/A' : ('$' + (flex / 100).toFixed(2))}
                </Text>
                <Text style={styles.rectangleButtonText} autoAdjustsFontSize={true}>
                  Flex
                </Text>
              </View>

              <View style={[styles.rectangle, buttonStyles.Common, buttonStyles.Balances]}>
                <Text style={styles.financialText} autoAdjustsFontSize={true}>
                  {loading ? '…' : ole === null ? 'N/A' : ('$' + (ole / 100).toFixed(2))}
                </Text>
                <Text style={styles.rectangleButtonText} autoAdjustsFontSize={true}>
                  Ole
                </Text>
              </View>

              <View style={[styles.rectangle, buttonStyles.Common, buttonStyles.Balances]}>
                <Text style={styles.financialText} autoAdjustsFontSize={true}>
                  {loading ? '…' : print === null ? 'N/A' : ('$' + (print / 100).toFixed(2))}
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
              detail='Not Available'
            />

            <Cell cellStyle='RightDetail'
              title='Weekly Meals Left'
              detail='Not Available'
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
    flex: 1,
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
