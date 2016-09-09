// @flow
/**
 * All About Olaf
 * Building Hours list element
 */

import React from 'react'
import {
  StyleSheet,
  View,
  Text,
  Image,
} from 'react-native'

import * as c from '../components/colors'
import type {BuildingInfoType} from './types'
import {isBuildingOpen} from './is-building-open'
import {formatBuildingHours} from './format-building-hours'
import CollapsibleBlock from '../components/collapsibleBlock'
import {allBuildingHours} from './all-building-hours.js'
import Dimensions from 'Dimensions'


var openStatus;
var borderColor;

let borderColors = {
  'Open': c.pastelGreen,
  'Almost Closed': c.mustard,
  'Closed': c.strawberry,
}

type PropsType = {
  info: BuildingInfoType,
  image: number,
  name: string,
};



let style = function(){
    return {
      container: {
        flex: 1,
        justifyContent: 'center',
        borderLeftWidth: 5,
        borderRightWidth: 5,
        marginTop: 10,
        height: 100,
        borderColor: getBorderColor(),
      },
      name: {
        color: c.white,
        fontSize: 24,
        textAlign: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
      },
      inner: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'space-between',
      },
      status: {
        color: c.white,
        fontSize: 14,
        paddingTop: 2,
        paddingBottom: 2,
        textAlign: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
      },
      hoursText:{
        textAlign: 'center',
        fontSize: 13,
        justifyContent: 'space-between'
      },
      contents:{
        paddingBottom: 10,
        paddingTop: 5,
        width: getContainerWidth(),
      },
    }
  }

  let getBorderColor = function(){
    borderColor = borderColors[openStatus];
    return borderColor;
  }

  let getContainerWidth = function(){
    return Dimensions.get('window').width;
  }

export default function BuildingView({info, image, name}: PropsType) {
  openStatus = isBuildingOpen(info)
  
  let hours = formatBuildingHours(info)
  let allHours = allBuildingHours(info, style());



  return (
    <CollapsibleBlock style={style()} borderColor={borderColor}>
    <View style={[style().container]}>
      <Image
        source={image}
        style={{width: undefined, height: 100}}
        resizeMode='cover'>
        <View style={style().inner}>
          <Text style={style().name}>{name}</Text>
          <Text style={style().status}>{hours}</Text>
        </View>
      </Image>
    </View>

    <View style={style().contents}>
      <Text style={style().hoursText}>Daily Hours</Text>
      {allHours}
    </View>
    </CollapsibleBlock>
  )
}

BuildingView.propTypes = {
  image: React.PropTypes.number.isRequired,
  info: React.PropTypes.object.isRequired,
  name: React.PropTypes.string.isRequired,
}
