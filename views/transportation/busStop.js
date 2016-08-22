// @flow
/**
 * All About Olaf
 * Funcitonal component for the rows of the bus page
 */

 import React from 'react'
 import {
   StyleSheet,
   Text,
   View,
 } from 'react-native'
 import moment from 'moment-timezone'
 const CENTRAL_TZ = 'America/Winnipeg'
 const TIME_FORMAT = 'HH:mm:ss'

 const styles = StyleSheet.create({
   container: {

   },
 })

 function getNextStopTime(times) {
   let returner = ''
   times.some(time => {
     let currentTime = moment.tz(CENTRAL_TZ)
     let stopTime = moment.tz(time, TIME_FORMAT, true, CENTRAL_TZ)
     if (currentTime.isBefore(stopTime)) {
       returner = time
       return returner
     }
     return null
   })
   if (returner) {
     return returner
   } else {
     return 'None'
   }
 }

 export default function BusStopView(props: busStopType) {
   return (
    <View style={styles.container}>
     <Text> {props.location} {getNextStopTime(props.times)} </Text>
    </View>
  )
 }
