import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import Animated, {useAnimatedStyle, useSharedValue, withSpring} from 'react-native-reanimated'
import {PanGestureHandler} from 'react-native-gesture-handler'

const styles = StyleSheet.create({ container: { marginBottom: 8 } })

type Props = {
  index: number
  onReorder: (from: number, to: number) => void
  enabled?: boolean
  children: React.ReactNode
}

export function DraggableSection({index, onReorder, enabled, children}: Props) {
  const translateY = useSharedValue(0)
  const startY = useSharedValue(0)

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }))

  const onGestureEvent = (evt: any) => {
    if (!enabled) return
    const {translationY} = evt.nativeEvent || evt
    translateY.value = startY.value + translationY
    const to = Math.round(translationY / 100 + index)
    if (to !== index) {
      onReorder(index, to)
      translateY.value = 0
      startY.value = 0
    }
  }

  const onEnd = () => { translateY.value = withSpring(0) }

  return (
    <PanGestureHandler enabled={enabled} onGestureEvent={onGestureEvent as any} onEnded={onEnd} onCancelled={onEnd} onFailed={onEnd}>
      <Animated.View style={[styles.container, style]}>{children}</Animated.View>
    </PanGestureHandler>
  )
}
