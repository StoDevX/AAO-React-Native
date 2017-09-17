// @flow
// Copied from https://github.com/xgfe/react-native-datepicker

import React from 'react'
import {Platform, Animated} from 'react-native'
import moment from 'moment'

import {IosDatePicker} from './ios'
import {AndroidDatePicker} from './android'

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
  formattedDate: string,
}
;[]

export class DatePicker extends React.Component<any, Props, State> {
  static defaultProps = {
    mode: 'date',
    androidMode: 'default',
    height: 259, // 216 (DatePickerIOS) + 1 (borderTop) + 42 (marginTop), iOS only
    duration: 300, // slide animation duration time, default to 300ms, iOS only
    onDateChange: () => null,
  }

  state = {
    date: this.props.initialDate,
    modalVisible: false,
    animatedHeight: new Animated.Value(0),
    allowPointerEvents: true,
  }

  componentWillMount() {
    this.setState(() => ({date: this.props.initialDate}))
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.initialDate !== this.props.initialDate) {
      this.setState(() => ({date: nextProps.initialDate}))
    }
  }

  formatDate = (date: Date) => {
    const {mode, format = FORMATS[mode]} = this.props
    return moment(date).format(format)
  }

  onDateChange = (newDate: Date) => {
    this.setState(() => ({
      date: newDate,
      formattedDate: this.formatDate(newDate),
    }))
  }

  render() {
    return Platform.OS === 'ios'
      ? <IosDatePicker
          date={this.state.date}
          formattedDate={this.state.formattedDate}
          duration={this.props.duration}
          format={this.props.format}
          height={this.props.height}
          minuteInterval={this.props.minuteInterval}
          mode={this.props.mode}
          onDateChange={this.onDateChange}
          style={this.props.style}
        />
      : <AndroidDatePicker
          date={this.state.date}
          formattedDate={this.state.formattedDate}
          duration={this.props.duration}
          format={this.props.format}
          height={this.props.height}
          minuteInterval={this.props.minuteInterval}
          androidMode={this.props.androidMode}
          mode={this.props.mode}
          onDateChange={this.onDateChange}
          style={this.props.style}
        />
  }
}
