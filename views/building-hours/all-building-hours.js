import React from 'react'
import {
  StyleSheet,
  Text,
} from 'react-native'

import moment from 'moment'



export function allBuildingHours(info, style){
	var dayTimes = [];
	var hoursString = "";
	for(var i = 0; i < 7; i++){
		var day = moment().add(i, "days").format('dddd');
		var d = moment().add(i, "days").format('ddd');

		var timesArray = info.times.hours[d];

		if(timesArray == null){
			hoursString = "Closed"
		}
		else{
			var open = moment(timesArray[0],"H:mm").format("h:mm a");
			var close = moment(timesArray[1],"H:mm").format("h:mm a");
			hoursString = open + " - " + close;
		}
		
		var dayString = day + ": " + hoursString;
		dayTimes.push(<Text key={d} style={style.hoursText}>{dayString}</Text>);
	}
	
	return dayTimes;
}