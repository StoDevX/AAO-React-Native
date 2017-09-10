// @flow
// Copied from https://github.com/xgfe/react-native-datepicker

/*
The MIT License (MIT)

Copyright (c) 2016 鲜果FE

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import React from 'react'
import {
  View,
  Text,
  Modal,
  TouchableHighlight,
  DatePickerAndroid,
  TimePickerAndroid,
  DatePickerIOS,
  Platform,
  Animated,
  Keyboard,
  StyleSheet,
} from 'react-native'
import moment from 'moment'

const FORMATS = {
  date: 'YYYY-MM-DD',
  datetime: 'YYYY-MM-DD HH:mm',
  time: 'HH:mm',
}

const SUPPORTED_ORIENTATIONS = [
  'portrait',
  'portrait-upside-down',
  'landscape',
  'landscape-left',
  'landscape-right',
]

type StyleSheetRules = Object | number | Array<StyleSheetRules>

type Props = {
  androidMode: 'calendar' | 'spinner' | 'default',
  cancelBtnText: string,
  confirmBtnText: string,
  customStyle: {[key: string]: StyleSheetRules},
  date: string | Date,
  disabled: boolean,
  duration: number,
  format?: string,
  height: number,
  hideText: boolean,
  is24Hour?: boolean,
  maxDate?: string | Date,
  minDate?: string | Date,
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30,
  modalOnResponderTerminationRequest: () => boolean,
  mode: 'date' | 'datetime' | 'time',
  onCloseModal?: () => any,
  onDateChange: (string, Date) => any,
  onOpenModal?: () => any,
  onPressMask?: () => any,
  placeholder: string,
  style: StyleSheetRules,
  timeZoneOffsetInMinutes?: number,
  TouchableComponent: Class<React$Component<*, *, *>>,
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
}

export class DatePicker extends React.PureComponent<any, Props, State> {
  static defaultProps = {
    mode: 'date',
    androidMode: 'default',
    date: '',

    // component height: 216(DatePickerIOS) + 1(borderTop) + 42(marginTop), IOS only
    height: 259,

    // slide animation duration time, default to 300ms, IOS only
    duration: 300,
    confirmBtnText: 'Confirm',
    cancelBtnText: 'Cancel',
    customStyle: {},

    disabled: false,
    hideText: false,
    placeholder: '',
    TouchableComponent: TouchableHighlight,
    modalOnResponderTerminationRequest: () => true,

    onDateChange: () => null,
  }

  state = {
    date: this.getDate(),
    modalVisible: false,
    animatedHeight: new Animated.Value(0),
    allowPointerEvents: true,
  }

  // componentWillMount() {
  //   // ignore the warning of Failed propType for date of DatePickerIOS, will remove after being fixed by official
  //   if (!console.ignoredYellowBox) {
  //     console.ignoredYellowBox = []
  //   }
  //   console.ignoredYellowBox.push('Warning: Failed propType')
  // }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.date !== this.props.date) {
      this.setState(() => ({date: this.getDate(nextProps.date)}))
    }
  }

  setModalVisible = () => {
    const {height, duration} = this.props

    // slide animation
    this.setState(() => ({modalVisible: true}))
    return Animated.timing(this.state.animatedHeight, {
      toValue: height,
      duration: duration,
    }).start()
  }

  setModalHidden = () => {
    const {duration} = this.props

    return Animated.timing(this.state.animatedHeight, {
      toValue: 0,
      duration: duration,
    }).start(() => {
      this.setState(() => ({modalVisible: false}))
    })
  }

  onStartShouldSetResponder = () => {
    return true
  }

  onMoveShouldSetResponder = () => {
    return true
  }

  onPressMask = () => {
    if (this.props.onPressMask) {
      this.props.onPressMask()
    } else {
      this.onPressCancel()
    }
  }

  onPressCancel = () => {
    this.setModalHidden()

    if (this.props.onCloseModal) {
      this.props.onCloseModal()
    }
  }

  onPressConfirm = () => {
    this.datePicked()
    this.setModalHidden()

    if (this.props.onCloseModal) {
      this.props.onCloseModal()
    }
  }

  getDate = (date: string | Date = this.props.date) => {
    const {mode, minDate, maxDate, format = FORMATS[mode]} = this.props

    if (!date) {
      let now = new Date()
      if (minDate) {
        let _minDate = this.getDate(minDate)

        if (now < _minDate) {
          return _minDate
        }
      }

      if (maxDate) {
        let _maxDate = this.getDate(maxDate)

        if (now > _maxDate) {
          return _maxDate
        }
      }

      return now
    }

    if (date instanceof Date) {
      return date
    }

    return moment(date, format).toDate()
  }

  getDateStr = (date: string | Date = this.props.date): string => {
    const {mode, format = FORMATS[mode]} = this.props

    if (date instanceof Date) {
      return moment(date).format(format)
    } else {
      return moment(this.getDate(date)).format(format)
    }
  }

  datePicked = () => {
    this.props.onDateChange(this.getDateStr(this.state.date), this.state.date)
  }

  getTitleElement = () => {
    const {date, placeholder, customStyle} = this.props

    if (!date && placeholder) {
      return (
        <Text
          style={[defaultStyle.placeholderText, customStyle.placeholderText]}
        >
          {placeholder}
        </Text>
      )
    }

    return (
      <Text style={[defaultStyle.dateText, customStyle.dateText]}>
        {this.getDateStr()}
      </Text>
    )
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
    const {
      mode,
      androidMode,
      format = FORMATS[mode],
      is24Hour = !format.match(/h|a/),
    } = this.props

    if (action !== DatePickerAndroid.dismissedAction) {
      let timeMoment = moment(this.state.date)

      TimePickerAndroid.open({
        hour: timeMoment.hour(),
        minute: timeMoment.minutes(),
        is24Hour: is24Hour,
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
      this.setState(() => ({date: new Date(year, month, day, hour, minute)}))
      this.datePicked()
    } else {
      this.onPressCancel()
    }
  }

  showAndroidPicker = () => {
    const {
      mode,
      androidMode,
      format = FORMATS[mode],
      minDate,
      maxDate,
      is24Hour = !format.match(/h|a/),
    } = this.props

    if (mode === 'date') {
      DatePickerAndroid.open({
        date: this.state.date,
        minDate: minDate && this.getDate(minDate),
        maxDate: maxDate && this.getDate(maxDate),
        mode: androidMode,
      }).then(this.onDatePicked)
    } else if (mode === 'time') {
      let timeMoment = moment(this.state.date)

      TimePickerAndroid.open({
        hour: timeMoment.hour(),
        minute: timeMoment.minutes(),
        is24Hour: is24Hour,
      }).then(this.onTimePicked)
    } else if (mode === 'datetime') {
      DatePickerAndroid.open({
        date: this.state.date,
        minDate: minDate && this.getDate(minDate),
        maxDate: maxDate && this.getDate(maxDate),
        mode: androidMode,
      }).then(this.onDateTimePicked)
    }
  }

  onPressDate = () => {
    if (this.props.disabled) {
      return true
    }

    Keyboard.dismiss()

    // reset state
    this.setState(() => ({
      date: this.getDate(),
    }))

    if (Platform.OS === 'ios') {
      this.setModalVisible()
    } else {
      this.showAndroidPicker()
    }

    if (this.props.onOpenModal) {
      this.props.onOpenModal()
    }
  }

  _renderios = () => {
    const {
      mode,
      customStyle,
      minDate,
      maxDate,
      minuteInterval,
      timeZoneOffsetInMinutes,
      cancelBtnText,
      confirmBtnText,
      TouchableComponent,
    } = this.props

    const picker = (
      <View pointerEvents={this.state.allowPointerEvents ? 'auto' : 'none'}>
        <DatePickerIOS
          date={this.state.date}
          mode={mode}
          minimumDate={minDate ? this.getDate(minDate) : undefined}
          maximumDate={maxDate ? this.getDate(maxDate) : undefined}
          onDateChange={this.onDateChange}
          minuteInterval={minuteInterval}
          timeZoneOffsetInMinutes={timeZoneOffsetInMinutes}
          style={[defaultStyle.datePicker, customStyle.datePicker]}
        />
      </View>
    )

    const cancel = (
      <TouchableComponent
        underlayColor="transparent"
        onPress={this.onPressCancel}
        style={[
          defaultStyle.btnText,
          defaultStyle.btnCancel,
          customStyle.btnCancel,
        ]}
      >
        <Text
          style={[
            defaultStyle.btnTextText,
            defaultStyle.btnTextCancel,
            customStyle.btnTextCancel,
          ]}
        >
          {cancelBtnText}
        </Text>
      </TouchableComponent>
    )

    const confirm = (
      <TouchableComponent
        underlayColor="transparent"
        onPress={this.onPressConfirm}
        style={[
          defaultStyle.btnText,
          defaultStyle.btnConfirm,
          customStyle.btnConfirm,
        ]}
      >
        <Text style={[defaultStyle.btnTextText, customStyle.btnTextConfirm]}>
          {confirmBtnText}
        </Text>
      </TouchableComponent>
    )

    return (
      <Modal
        transparent={true}
        animationType="none"
        visible={this.state.modalVisible}
        supportedOrientations={SUPPORTED_ORIENTATIONS}
        onRequestClose={this.setModalHidden}
      >
        <View style={defaultStyle.flex}>
          <TouchableComponent
            style={defaultStyle.datePickerMask}
            activeOpacity={1}
            underlayColor="#00000077"
            onPress={this.onPressMask}
          >
            <TouchableComponent underlayColor="#fff" style={defaultStyle.flex}>
              <Animated.View
                style={[
                  defaultStyle.datePickerCon,
                  {height: this.state.animatedHeight},
                  customStyle.datePickerCon,
                ]}
              >
                {picker}
                {cancel}
                {confirm}
              </Animated.View>
            </TouchableComponent>
          </TouchableComponent>
        </View>
      </Modal>
    )
  }

  render() {
    const {style, customStyle, disabled, TouchableComponent} = this.props

    const dateInputStyle = [
      defaultStyle.dateInput,
      customStyle.dateInput,
      disabled && defaultStyle.disabled,
      disabled && customStyle.disabled,
    ]

    return (
      <TouchableComponent
        style={[defaultStyle.dateTouch, style]}
        underlayColor="transparent"
        onPress={this.onPressDate}
      >
        <View style={[defaultStyle.dateTouchBody, customStyle.dateTouchBody]}>
          {!this.props.hideText
            ? <View style={dateInputStyle}>
                {this.getTitleElement()}
              </View>
            : null}
          {Platform.OS === 'ios' && this._renderios()}
        </View>
      </TouchableComponent>
    )
  }
}

/* eslint-disable react-native/no-color-literals */
const defaultStyle = StyleSheet.create({
  dateTouch: {
    flexDirection: 'row',
  },
  flex: {
    flex: 1,
  },
  dateTouchBody: {
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#aaa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    color: '#333',
  },
  placeholderText: {
    color: '#c9c9c9',
  },
  datePickerMask: {
    flex: 1,
    alignItems: 'flex-end',
    flexDirection: 'row',
    backgroundColor: '#00000077',
  },
  datePickerCon: {
    backgroundColor: '#fff',
    height: 0,
    overflow: 'hidden',
  },
  btnText: {
    position: 'absolute',
    top: 0,
    height: 42,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTextText: {
    fontSize: 16,
    color: '#46cf98',
  },
  btnTextCancel: {
    color: '#666',
  },
  btnCancel: {
    left: 0,
  },
  btnConfirm: {
    right: 0,
  },
  datePicker: {
    marginTop: 42,
    borderTopColor: '#ccc',
    borderTopWidth: 1,
  },
  disabled: {
    backgroundColor: '#eee',
  },
})
/* eslint-enable react-native/no-color-literals */
