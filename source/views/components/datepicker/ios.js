// @flow

import React from 'react'
import {
  View,
  Text,
  Modal,
  TouchableHighlight,
  DatePickerAndroid,
  DatePickerIOS,
  Animated,
  Keyboard,
  StyleSheet,
} from 'react-native'
import * as c from '../colors'

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

;[]
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
    this.props.onDatePicked()
    this.setModalHidden()
  }

  onDateChange = (date: Date) => {
    this.setState(() => ({
      allowPointerEvents: false,
    }))

    this.props.onDateChange(date)

    const timeoutId = setTimeout(() => {
      this.setState(() => ({allowPointerEvents: true}))
      clearTimeout(timeoutId)
    }, 200)
  }

  onPressDate = () => {
    Keyboard.dismiss()

    this.setModalVisible()
  }

  render() {
    const {formattedDate, mode, minuteInterval} = this.props

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
      <TouchableHighlight
        style={defaultStyle.dateTouch}
        underlayColor="transparent"
        onPress={this.onPressDate}
      >
        <View style={defaultStyle.dateTouchBody}>
          <View style={defaultStyle.dateInput}>
            <Text style={defaultStyle.dateText}>
              {formattedDate}
            </Text>
          </View>

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
                <TouchableHighlight
                  underlayColor="#fff"
                  style={defaultStyle.flex}
                >
                  <Animated.View
                    style={[
                      defaultStyle.datePickerCon,
                      {height: this.state.animatedHeight},
                    ]}
                  >
                    <DatePickerIOS
                      date={this.state.date}
                      mode={mode}
                      onDateChange={this.onDateChange}
                      minuteInterval={minuteInterval}
                      style={defaultStyle.datePicker}
                      pointerEvents={
                        this.state.allowPointerEvents ? 'auto' : 'none'
                      }
                    />

                    {cancel}
                    {confirm}
                  </Animated.View>
                </TouchableHighlight>
              </TouchableHighlight>
            </View>
          </Modal>
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
