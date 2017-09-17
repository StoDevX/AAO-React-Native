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
import * as c from '../colors'

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

type StyleSheetRules = Object | number | false | Array<StyleSheetRules>

type Props = {
  androidMode: 'calendar' | 'spinner' | 'default',
  initialDate: Date,
  duration?: number,
  format?: string,
  height?: number,
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30,
  mode: 'date' | 'datetime' | 'time',
  onDateChange: (Date) => any,
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

  onPressMask = () => {
    this.onPressCancel()
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
    } = this.props

    switch (mode) {
      case 'date': {
        DatePickerAndroid.open({
          date: this.state.date,
          mode: androidMode,
        }).then(this.onDatePicked)
        break
      }

      case 'time': {
        let timeMoment = moment(this.state.date)

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

    // reset state
    this.setState(() => ({date: this.props.initialDate}))

    if (Platform.OS === 'ios') {
      this.setModalVisible()
    } else {
      this.showAndroidPicker()
    }
  }

  _renderios = () => {
    const {mode, minuteInterval} = this.props

    const picker = (
      <View pointerEvents={this.state.allowPointerEvents ? 'auto' : 'none'}>
        <DatePickerIOS
          date={this.state.date}
          mode={mode}
          onDateChange={this.onDateChange}
          minuteInterval={minuteInterval}
          style={[defaultStyle.datePicker]}
        />
      </View>
    )

    const cancel = (
      <TouchableHighlight
        underlayColor="transparent"
        onPress={this.onPressCancel}
        style={[defaultStyle.btnText, defaultStyle.btnCancel]}
      >
        <Text style={[defaultStyle.btnTextText, defaultStyle.btnTextCancel]}>
          Cancel
        </Text>
      </TouchableHighlight>
    )

    const confirm = (
      <TouchableHighlight
        underlayColor="transparent"
        onPress={this.onPressConfirm}
        style={[defaultStyle.btnText, defaultStyle.btnConfirm]}
      >
        <Text style={defaultStyle.btnTextText}>
          Confirm
        </Text>
      </TouchableHighlight>
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
          <TouchableHighlight
            style={defaultStyle.datePickerMask}
            activeOpacity={1}
            underlayColor="#00000077"
            onPress={this.onPressMask}
          >
            <TouchableHighlight underlayColor="#fff" style={defaultStyle.flex}>
              <Animated.View
                style={[
                  defaultStyle.datePickerCon,
                  {height: this.state.animatedHeight},
                ]}
              >
                {picker}
                {cancel}
                {confirm}
              </Animated.View>
            </TouchableHighlight>
          </TouchableHighlight>
        </View>
      </Modal>
    )
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

          {Platform.OS === 'ios' && this._renderios()}
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
})
/* eslint-enable react-native/no-color-literals */
