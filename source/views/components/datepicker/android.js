// @flow

import React from 'react'
import {
  View,
  Text,
  TouchableHighlight,
  DatePickerAndroid,
  TimePickerAndroid,
  Animated,
  Keyboard,
  StyleSheet,
} from 'react-native'
import moment from 'moment'
import * as c from '../colors'

const FORMATS = {
  date: 'YYYY-MM-DD',
  datetime: 'YYYY-MM-DD HH:mm',
  time: 'HH:mm',
}

type StyleSheetRules = Object | number | false | Array<StyleSheetRules>

type Props = {
  androidMode: 'calendar' | 'spinner' | 'default',
  initialDate: Date,
  duration: number,
  format?: string,
  height: number,
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30,
  mode: 'date' | 'datetime' | 'time',
  onDateChange: Date => any,
  style?: StyleSheetRules,
}

type State = {
  date: Date,
  modalVisible: boolean,
  animatedHeight: Animated.Value,
  allowPointerEvents: boolean,
}

type DatePickerResponse = {
  action: string,
  year: number,
  month: number,
  day: number,
}

type TimePickerResponse = {
  action: string,
  hour: number,
  minute: number,
};[]

export class AndroidDatePicker extends React.Component<any, Props, State> {
  static defaultProps = {
    mode: 'date',
    androidMode: 'default',
    onDateChange: () => null,
  }

  state = {
    date: this.props.initialDate,
  }

  componentWillMount() {
    this.setState(() => ({date: this.props.initialDate}))
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.initialDate !== this.props.initialDate) {
      this.setState(() => ({date: nextProps.initialDate}))
    }
  }

  onPressCancel = () => {
    this.setModalHidden()
  }

  onPressConfirm = () => {
    this.datePicked()
    this.setModalHidden()
  }

  formatDate = () => {
    const {mode, format = FORMATS[mode]} = this.props
    return moment(this.state.date).format(format)
  }

  datePicked = () => {
    this.props.onDateChange(this.state.date)
  }

  onDateChange = (date: Date) => {
    this.setState(() => ({
      allowPointerEvents: false,
      date: date,
    }))

    const timeoutId = setTimeout(() => {
      this.setState(() => ({allowPointerEvents: true}))
      clearTimeout(timeoutId)
    }, 200)
  }

  onDatePicked = ({action, year, month, day}: DatePickerResponse) => {
    if (action !== DatePickerAndroid.dismissedAction) {
      this.setState(() => ({date: new Date(year, month, day)}))
      this.datePicked()
    } else {
      this.onPressCancel()
    }
  }

  onTimePicked = ({action, hour, minute}: TimePickerResponse) => {
    if (action !== DatePickerAndroid.dismissedAction) {
      this.setState(() => ({date: moment().hour(hour).minute(minute).toDate()}))
      this.datePicked()
    } else {
      this.onPressCancel()
    }
  }

  onDateTimePicked = ({action, year, month, day}: DatePickerResponse) => {
    const {androidMode} = this.props

    if (action !== DatePickerAndroid.dismissedAction) {
      let timeMoment = moment(this.state.date)

      TimePickerAndroid.open({
        hour: timeMoment.hour(),
        minute: timeMoment.minutes(),
        mode: androidMode,
      }).then(this.onDatetimeTimePicked.bind(this, year, month, day))
    } else {
      this.onPressCancel()
    }
  }

  onDatetimeTimePicked = (
    year: number,
    month: number,
    day: number,
    {action, hour, minute}: TimePickerResponse,
  ) => {
    if (action !== DatePickerAndroid.dismissedAction) {
      this.props.onDateChange(new Date(year, month, day, hour, minute))
      this.props.datePicked()
    } else {
      this.onPressCancel()
    }
  }

  showAndroidPicker = () => {
    const {mode, androidMode} = this.props

    switch (mode) {
      case 'date': {
        DatePickerAndroid.open({
          date: this.state.date,
          mode: androidMode,
        }).then(this.onDatePicked)
        break
      }

      case 'time': {
        const timeMoment = moment(this.state.date)

        TimePickerAndroid.open({
          hour: timeMoment.hour(),
          minute: timeMoment.minutes(),
        }).then(this.onTimePicked)
        break
      }

      case 'datetime': {
        DatePickerAndroid.open({
          date: this.state.date,
          mode: androidMode,
        }).then(this.onDateTimePicked)
        break
      }

      default:
        break
    }
  }

  onPressDate = () => {
    Keyboard.dismiss()

    this.setState(() => ({date: this.props.initialDate}))

    this.showAndroidPicker()
  }

  render() {
    return (
      <TouchableHighlight
        style={defaultStyle.dateTouch}
        underlayColor="transparent"
        onPress={this.onPressDate}
      >
        <View style={defaultStyle.dateTouchBody}>
          <View style={defaultStyle.dateInput}>
            <Text style={defaultStyle.dateText}>
              {this.formatDate()}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    )
  }
}

/* eslint-disable react-native/no-color-literals */
const defaultStyle = StyleSheet.create({
  dateTouch: {
    flexDirection: 'row',
    width: null,
  },
  dateTouchBody: {
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInput: {
    flex: 0,
    borderWidth: 0,
    height: 40,
    borderColor: '#aaa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    color: c.iosDisabledText,
    fontSize: 16,
  },
})
/* eslint-enable react-native/no-color-literals */
