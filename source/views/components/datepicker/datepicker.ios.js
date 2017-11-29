// @flow

import * as React from 'react'
import {
  View,
  Text,
  Modal,
  TouchableHighlight,
  DatePickerIOS,
  Animated,
  Keyboard,
  StyleSheet,
} from 'react-native'
import moment from 'moment-timezone'
import * as c from '../colors'
import type {StyleSheetRules} from './types'

type Props = {
  date: moment,
  formattedDate: string,
  duration: number,
  format?: string,
  height: number,
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30,
  mode: 'date' | 'datetime' | 'time',
  onDateChange: moment => any,
  style?: StyleSheetRules,
  timezone: string,
}

type State = {
  modalVisible: boolean,
  animatedHeight: Animated.Value,
  allowPointerEvents: boolean,
}

export class DatePicker extends React.Component<Props, State> {
  static defaultProps = {
    mode: 'date',
    height: 259, // 216 (DatePickerIOS) + 1 (borderTop) + 42 (marginTop), iOS only
    duration: 300, // slide animation duration time, default to 300ms, iOS only
    onChange: () => null,
  }

  state = {
    modalVisible: false,
    animatedHeight: new Animated.Value(0),
    allowPointerEvents: true,
  }

  showModal = () => {
    // slide animation
    this.setState(() => ({modalVisible: true}))
    return Animated.timing(this.state.animatedHeight, {
      toValue: this.props.height,
      duration: this.props.duration,
    }).start()
  }

  hideModal = () => {
    return Animated.timing(this.state.animatedHeight, {
      toValue: 0,
      duration: this.props.duration,
    }).start(() => {
      this.setState(() => ({modalVisible: false}))
    })
  }

  onDateChange = (date: Date) => {
    this.setState(() => ({allowPointerEvents: false}))

    this.props.onDateChange(moment.tz(date, this.props.timezone))

    const timeoutId = setTimeout(() => {
      this.setState(() => ({allowPointerEvents: true}))
      clearTimeout(timeoutId)
    }, this.props.duration)
  }

  onPressDate = () => {
    Keyboard.dismiss()
    this.showModal()
  }

  render() {
    return (
      <TouchableHighlight
        onPress={this.onPressDate}
        style={defaultStyle.dateTouch}
        underlayColor="transparent"
      >
        <View style={defaultStyle.dateTouchBody}>
          <View style={defaultStyle.dateInput}>
            <Text style={defaultStyle.dateText}>
              {this.props.formattedDate}
            </Text>
          </View>

          <DatePickerModal
            allowPointerEvents={this.state.allowPointerEvents}
            date={this.props.date}
            height={this.state.animatedHeight}
            minuteInterval={this.props.minuteInterval}
            mode={this.props.mode}
            onDateChange={this.onDateChange}
            onHide={this.hideModal}
            timezone={this.props.timezone}
            visible={this.state.modalVisible}
          />
        </View>
      </TouchableHighlight>
    )
  }
}

type ModalProps = {
  date: moment,
  height: any, // actually AnimatedValue
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30,
  mode: 'date' | 'datetime' | 'time',
  allowPointerEvents: boolean,
  visible: boolean,
  onDateChange: moment => any,
  onHide: () => any,
  timezone: string,
}

class DatePickerModal extends React.PureComponent<ModalProps> {
  static SUPPORTED_ORIENTATIONS = [
    'portrait',
    'portrait-upside-down',
    'landscape',
    'landscape-left',
    'landscape-right',
  ]

  render() {
    const {
      mode,
      date,
      minuteInterval,
      height,
      allowPointerEvents,
      onDateChange,
      onHide,
      visible,
      timezone,
    } = this.props

    let tzOffset = 0
    if (date.tz()) {
      // We need to negate the offset, because moment inverts the offset for
      // POSIX compatability. So, GMT-5 (CST) is shown to be GMT+5.
      const dateInUnixMs = date.valueOf()
      tzOffset = -moment.tz.zone(timezone).offset(dateInUnixMs)
    }

    return (
      <Modal
        animationType="none"
        onRequestClose={onHide}
        supportedOrientations={DatePickerModal.SUPPORTED_ORIENTATIONS}
        transparent={true}
        visible={visible}
      >
        <View style={defaultStyle.flex}>
          <TouchableHighlight
            activeOpacity={1}
            onPress={onHide}
            style={defaultStyle.datePickerMask}
            underlayColor="#00000077"
          >
            <TouchableHighlight style={defaultStyle.flex} underlayColor="#fff">
              <Animated.View style={[defaultStyle.datePickerCon, {height}]}>
                <DatePickerIOS
                  date={date.toDate()}
                  minuteInterval={minuteInterval}
                  mode={mode}
                  onDateChange={onDateChange}
                  pointerEvents={allowPointerEvents ? 'auto' : 'none'}
                  style={defaultStyle.datePicker}
                  timeZoneOffsetInMinutes={tzOffset}
                />

                <Button
                  onPress={onHide}
                  style={defaultStyle.btnCancel}
                  text="Cancel"
                  textStyle={defaultStyle.btnTextCancel}
                />
                <Button
                  onPress={onHide}
                  style={defaultStyle.btnConfirm}
                  text="Confirm"
                />
              </Animated.View>
            </TouchableHighlight>
          </TouchableHighlight>
        </View>
      </Modal>
    )
  }
}

type StyleSheetRule = number | Object | Array<StyleSheetRule>

type ButtonProps = {
  style?: StyleSheetRule,
  textStyle?: StyleSheetRule,
  onPress: () => any,
  text: string,
}

const Button = ({style, textStyle, onPress, text}: ButtonProps) => (
  <TouchableHighlight
    onPress={onPress}
    style={[defaultStyle.btnText, style]}
    underlayColor="transparent"
  >
    <Text style={[defaultStyle.btnTextText, textStyle]}>{text}</Text>
  </TouchableHighlight>
)

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
    color: c.infoBlue,
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
