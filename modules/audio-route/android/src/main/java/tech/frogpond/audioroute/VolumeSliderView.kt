package tech.frogpond.audioroute

import android.annotation.SuppressLint
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.Color
import android.media.AudioManager
import android.os.Build
import android.view.MotionEvent
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.types.ColorCompat
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.views.OptimizedComposeProps
import kotlin.math.roundToInt
import androidx.compose.ui.graphics.Color as ComposeColor

@OptimizedComposeProps
data class VolumeSliderProps(
  /** The colour of the slider's filled part. */
  val tint: MutableState<Color?> = mutableStateOf(null),
  /** The colour of the slider's empty part. */
  val trackTint: MutableState<Color?> = mutableStateOf(null)
) : ComposeProps

/**
 * The device's media volume as a slider, which sets it and follows the
 * hardware buttons, drawn as Music draws its own: a bar with no thumb, filled
 * as far as the volume goes. A tap jumps to where it lands and a drag sets it
 * as it goes, and TalkBack can set it as it does any slider.
 *
 * Android's media volume moves in steps, fifteen or so, so the bar moves in
 * them too.
 */
@SuppressLint("ViewConstructor")
class VolumeSliderView(context: Context, appContext: AppContext) :
  ExpoComposeView<VolumeSliderProps>(context, appContext, withHostingView = true) {
  override val props = VolumeSliderProps()

  private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

  /** The media volume, from 0 to 1. */
  private val volume = mutableFloatStateOf(currentVolume())

  /** Hears the volume change, whatever changed it: the hardware buttons, another app, this slider. */
  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      volume.floatValue = currentVolume()
    }
  }
  private var listening = false

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (!listening) {
      ContextCompat.registerReceiver(
        context,
        receiver,
        IntentFilter(VOLUME_CHANGED_ACTION),
        ContextCompat.RECEIVER_NOT_EXPORTED
      )
      listening = true
    }
    volume.floatValue = currentVolume()
  }

  override fun onDetachedFromWindow() {
    if (listening) {
      context.unregisterReceiver(receiver)
      listening = false
    }
    super.onDetachedFromWindow()
  }

  override fun dispatchTouchEvent(ev: MotionEvent): Boolean {
    // A drag along the slider is the slider's, not the sheet's or the scroll view's around it.
    if (ev.actionMasked == MotionEvent.ACTION_DOWN) {
      parent?.requestDisallowInterceptTouchEvent(true)
    }
    return super.dispatchTouchEvent(ev)
  }

  private fun currentVolume(): Float {
    val max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
    if (max <= 0) {
      return 0f
    }
    return audioManager.getStreamVolume(AudioManager.STREAM_MUSIC).toFloat() / max
  }

  private fun setVolume(fraction: Float) {
    val max = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
    if (max <= 0) {
      return
    }
    val index = (fraction.coerceIn(0f, 1f) * max).roundToInt()
    try {
      // No flags: the slider is the volume's display, so the system's own panel stays away.
      audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, index, 0)
    } catch (_: SecurityException) {
      // Do Not Disturb can refuse a change; the slider then stays where the volume is.
    }
    volume.floatValue = currentVolume()
  }

  @Composable
  override fun ComposableScope.Content() {
    val fill = props.tint.value?.toCompose() ?: defaultTint()
    val track = props.trackTint.value?.toCompose() ?: fill.copy(alpha = 0.25f)
    val fraction = volume.floatValue
    val percent = (fraction * 100).roundToInt()

    Box(
      modifier = Modifier
        .fillMaxSize()
        .semantics {
          contentDescription = "Volume"
          stateDescription = "$percent%"
          progressBarRangeInfo = ProgressBarRangeInfo(fraction, 0f..1f)
          setProgress { target ->
            setVolume(target)
            true
          }
        }
        .pointerInput(Unit) {
          detectTapGestures { position ->
            setVolume(position.x / size.width)
          }
        }
        .pointerInput(Unit) {
          detectHorizontalDragGestures(
            onDragStart = { position -> setVolume(position.x / size.width) }
          ) { change, _ ->
            change.consume()
            setVolume(change.position.x / size.width)
          }
        }
        .drawBehind {
          val barHeight = BAR_HEIGHT.dp.toPx()
          val top = (size.height - barHeight) / 2
          val corner = CornerRadius(barHeight / 2, barHeight / 2)
          drawRoundRect(
            color = track,
            topLeft = Offset(0f, top),
            size = Size(size.width, barHeight),
            cornerRadius = corner
          )
          drawRoundRect(
            color = fill,
            topLeft = Offset(0f, top),
            size = Size(size.width * fraction.coerceIn(0f, 1f), barHeight),
            cornerRadius = corner
          )
        }
    )
  }

  /** The system's accent where it has one (Android 12 on), and Material's primary before. */
  private fun defaultTint(): ComposeColor {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      return ComposeColor(context.getColor(android.R.color.system_accent1_500))
    }
    return ComposeColor(0xFF6750A4)
  }

  companion object {
    /**
     * Sent by the system whenever a stream's volume changes. It is not in the
     * SDK's constants, but the system has sent it under this name since
     * Android's first releases, and apps such as this one listen for it.
     */
    private const val VOLUME_CHANGED_ACTION = "android.media.VOLUME_CHANGED_ACTION"

    /** The bar's thickness, in dp, as Music's. */
    private const val BAR_HEIGHT = 6
  }
}

internal fun Color.toCompose(): ComposeColor = ComposeColor(ColorCompat.toArgb(this))
