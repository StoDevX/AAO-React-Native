// @flow

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
} from 'react-native'
import moment from 'moment-timezone'
import * as c from '../../components/colors'
const TIMEZONE = 'America/Winnipeg'

const styles = StyleSheet.create({
  listContainer: {
    backgroundColor: '#ffffff',
  },
  row: {
    marginLeft: 0,
    paddingRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notLastRowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#ebebeb',
  },
  itemTitle: {
    color: c.black,
    paddingLeft: 10,
    paddingRight: 10,
    paddingBottom: 3,
    fontSize: 16,
    textAlign: 'left',
  },
  itemPreview: {
    color: c.iosText,
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 13,
    textAlign: 'left',
  },
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  bar: {
    width: 30,
    paddingTop: 5,
    borderRadius: 30,
    marginLeft: 10,
    marginRight: 10,
    marginTop: -15,
    marginBottom: -15,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  dot: {
    marginLeft: -30,
    marginRight: 15,
    height: 10,
    width: 10,
    borderRadius: 10,
  },
  passedStop: {
    backgroundColor: 'black',
  },
  beforeStop: {
    backgroundColor: 'white',
  },
  rowContainer: {
    flex: 1,
  },
})

export default function BusProgressView({pairs, now, color=c.red}: {pairs: [string, string][], now: Object, color: string}) {
  return (
    <View style={[styles.container, styles.listContainer]}>
      <View style={[styles.bar, {backgroundColor: color}]} />
      <View style={[styles.rowContainer]}>
        {pairs.map(([place, time], i) =>
          <View key={i} style={[styles.row, i < pairs.length - 1 ? styles.notLastRowContainer : null]}>
            <View style={[styles.dot, now.isAfter(moment.tz(time, 'h:mma', TIMEZONE)) ? styles.passedStop : styles.beforeStop]} />
            <View style={{flex: 1}}>
              <Text style={styles.itemTitle}>{place}</Text>
              <Text style={styles.itemPreview}>{time === false ? 'None' : time}</Text>
            </View>
          </View>)}
      </View>
    </View>
  )
}
BusProgressView.propTypes = {
  color: React.PropTypes.string,
  now: React.PropTypes.object.isRequired,
  pairs: React.PropTypes.array.isRequired,
}
