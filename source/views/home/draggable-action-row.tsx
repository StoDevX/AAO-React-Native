import * as React from 'react'
import {StyleSheet, View} from 'react-native'
import Animated, {useAnimatedStyle, useSharedValue, withSpring, runOnJS} from 'react-native-reanimated'
import {PanGestureHandler} from 'react-native-gesture-handler'
import {ActionChip} from './action-chip'
import type {ViewType} from '../views'

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  itemWrap: { marginRight: 8 },
})

type Props = {
  items: ViewType[]
  onPress: (v: ViewType) => void
  onReorder: (from: number, to: number) => void
  enabled?: boolean
}

export function DraggableActionRow({items, onPress, onReorder, enabled}: Props) {
  return (
    <View style={styles.row}>
      {items.map((it, index) => (
        <DraggableChip
          key={it.title}
          index={index}
          onReorder={onReorder}
          enabled={!!enabled}
        >
          <View style={styles.itemWrap}>
            <ActionChip item={it} onPress={onPress} />
          </View>
        </DraggableChip>
      ))}
    </View>
  )
}

type DraggableProps = {
  index: number
  onReorder: (from: number, to: number) => void
  children: React.ReactNode
  enabled: boolean
}

function DraggableChip({index, onReorder, children, enabled}: DraggableProps) {
  const translateX = useSharedValue(0)
  const startX = useSharedValue(0)
  const curIndex = React.useRef(index)

  React.useEffect(() => { curIndex.current = index }, [index])

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }))

  const onGestureEvent = (evt: any) => {
    if (!enabled) return
    const {translationX, state} = evt.nativeEvent || evt
    translateX.value = startX.value + translationX
    // naive boundaries ~80px per chip; swap when crossing multiples
    const to = Math.round(translateX.value / 80 + curIndex.current)
    if (to !== curIndex.current) {
      runOnJS(onReorder)(curIndex.current, to)
      startX.value = 0
      translateX.value = 0
    }
  }

  const onGestureEnd = () => {
    translateX.value = withSpring(0)
  }

  return (
    <PanGestureHandler enabled={enabled} onGestureEvent={onGestureEvent as any} onEnded={onGestureEnd} onCancelled={onGestureEnd} onFailed={onGestureEnd}>
      <Animated.View style={style}>{children}</Animated.View>
    </PanGestureHandler>
  )
}
