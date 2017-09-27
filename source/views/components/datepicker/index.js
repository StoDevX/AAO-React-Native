// @flow
// Copied from https://github.com/xgfe/react-native-datepicker

import React from 'react'
import {Platform, Keyboard} from 'react-native'
import moment from 'moment-timezone'

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
  initialDate: moment,
  duration?: number,
  format?: string,
  height?: number,
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30,
  mode: 'date' | 'datetime' | 'time',
  onDateChange: moment => any,
  style?: StyleSheetRules,
}

type State = {
  date: moment,
  timezone: string,
}

export class DatePicker extends React.Component<any, Props, State> {
  static defaultProps = {
    mode: 'date',
    androidMode: 'default',
    onDateChange: () => null,
  }

  _ref: any

  state = {
    date: this.props.initialDate,
    timezone: this.props.initialDate.tz(),
  }

  componentWillMount() {
    this.setState(() => ({
      date: this.props.initialDate,
      timezone: this.props.initialDate.tz(),
    }))
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.initialDate !== this.props.initialDate) {
      this.setState(() => ({
        date: nextProps.initialDate,
        timezone: nextProps.initialDate.tz(),
      }))
    }
  }

  formatDate = (date: moment) => {
    const {mode, format = FORMATS[mode]} = this.props
    return moment(date).format(format)
  }

  onDateChange = (newDate: moment) => {
    this.setState(
      () => ({date: newDate}),
      () => this.props.onDateChange(this.state.date),
    )
  }

  setRef = (ref: any) => (this._ref = ref)

  onPressDate = () => {
    Keyboard.dismiss()
    this._ref.showModal()
  }

  render() {
    const propsToPass = {
      date: this.state.date,
      formattedDate: this.formatDate(this.state.date),
      mode: this.props.mode,
      onDateChange: this.onDateChange,
      style: this.props.style,
      ref: this.setRef,
    }

    if (Platform.OS === 'ios') {
      return (
        <IosDatePicker
          duration={this.props.duration}
          height={this.props.height}
          minuteInterval={this.props.minuteInterval}
          timezone={this.state.timezone}
          {...propsToPass}
        />
      )
    } else if (Platform.OS === 'android') {
      return (
        <AndroidDatePicker
          androidMode={this.props.androidMode}
          {...propsToPass}
        />
      )
    } else {
      throw new Error(`Platform ${Platform.OS} is not supported!`)
    }
  }
}
