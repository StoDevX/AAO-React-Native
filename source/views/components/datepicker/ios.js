// @flow

import React from 'react'
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
  timeZoneOffsetInMinutes: number,
}

type State = {
  modalVisible: boolean,
  animatedHeight: Animated.Value,
  allowPointerEvents: boolean,
}

export class IosDatePicker extends React.Component<any, Props, State> {
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

  onDateChange = (date: moment) => {
    this.setState(() => ({allowPointerEvents: false}))

    this.props.onDateChange(date)

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
        style={defaultStyle.dateTouch}
        underlayColor="transparent"
        onPress={this.onPressDate}
      >
        <View style={defaultStyle.dateTouchBody}>
          <View style={defaultStyle.dateInput}>
            <Text style={defaultStyle.dateText}>
              {this.props.formattedDate}
            </Text>
          </View>

          <DatePickerModal
            date={this.props.date}
            mode={this.props.mode}
            height={this.state.animatedHeight}
            minuteInterval={this.props.minuteInterval}
            allowPointerEvents={this.state.allowPointerEvents}
            onDateChange={this.props.onDateChange}
            onHide={this.hideModal}
            visible={this.state.modalVisible}
            timeZoneOffsetInMinutes={this.props.timeZoneOffsetInMinutes}
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
  timeZoneOffsetInMinutes: number,
}

class DatePickerModal extends React.PureComponent<void, ModalProps, void> {
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
      timeZoneOffsetInMinutes,
    } = this.props

    return (
      <Modal
        transparent={true}
        animationType="none"
        visible={visible}
        supportedOrientations={DatePickerModal.SUPPORTED_ORIENTATIONS}
        onRequestClose={onHide}
      >
        <View style={defaultStyle.flex}>
          <TouchableHighlight
            style={defaultStyle.datePickerMask}
            activeOpacity={1}
            underlayColor="#00000077"
            onPress={onHide}
          >
            <TouchableHighlight underlayColor="#fff" style={defaultStyle.flex}>
              <Animated.View style={[defaultStyle.datePickerCon, {height}]}>
                <DatePickerIOS
                  date={date.toDate()}
                  mode={mode}
                  onDateChange={onDateChange}
                  minuteInterval={minuteInterval}
                  style={defaultStyle.datePicker}
                  timeZoneOffsetInMinutes={timeZoneOffsetInMinutes}
                  pointerEvents={allowPointerEvents ? 'auto' : 'none'}
                />

                <Button
                  text="Cancel"
                  onPress={onHide}
                  style={defaultStyle.btnCancel}
                  textStyle={defaultStyle.btnTextCancel}
                />
                <Button
                  text="Confirm"
                  onPress={onHide}
                  style={defaultStyle.btnConfirm}
                />
              </Animated.View>
            </TouchableHighlight>
          </TouchableHighlight>
        </View>
      </Modal>
    )
  }
}

const Button = ({style, textStyle, onPress, text}) =>
  <TouchableHighlight
    underlayColor="transparent"
    onPress={onPress}
    style={[defaultStyle.btnText, style]}
  >
    <Text style={[defaultStyle.btnTextText, textStyle]}>
      {text}
    </Text>
  </TouchableHighlight>

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
