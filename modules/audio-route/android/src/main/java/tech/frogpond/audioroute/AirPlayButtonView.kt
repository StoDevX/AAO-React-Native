package tech.frogpond.audioroute

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.media.AudioAttributes
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.mutableStateOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.graphics.vector.rememberVectorPainter
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import androidx.mediarouter.app.SystemOutputSwitcherDialogController
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.views.OptimizedComposeProps
import androidx.compose.ui.graphics.Color as ComposeColor

@OptimizedComposeProps
data class AirPlayButtonProps(
  /** The colour of the button's icon, in use or not. */
  val tint: MutableState<Color?> = mutableStateOf(null)
) : ComposeProps

/**
 * A button that opens the system's output switcher: the list of places the
 * audio can play, phone, headphones, Bluetooth, cast devices, as the media
 * controls in the notification shade open it. It stands where iOS has its
 * AirPlay picker, and like it, it shows when the audio is playing somewhere
 * other than the phone, from AudioManager's output devices, kept current by
 * its device callback.
 */
@SuppressLint("ViewConstructor")
class AirPlayButtonView(context: Context, appContext: AppContext) :
  ExpoComposeView<AirPlayButtonProps>(context, appContext, withHostingView = true) {
  override val props = AirPlayButtonProps()

  private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

  /** Whether media is playing somewhere other than the phone's own speaker. */
  private val routedAway = mutableStateOf(isRoutedAway())

  private val deviceCallback = object : AudioDeviceCallback() {
    override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>?) {
      routedAway.value = isRoutedAway()
    }

    override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>?) {
      routedAway.value = isRoutedAway()
    }
  }
  private var listening = false

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    if (!listening) {
      audioManager.registerAudioDeviceCallback(deviceCallback, Handler(Looper.getMainLooper()))
      listening = true
    }
    routedAway.value = isRoutedAway()
  }

  override fun onDetachedFromWindow() {
    if (listening) {
      audioManager.unregisterAudioDeviceCallback(deviceCallback)
      listening = false
    }
    super.onDetachedFromWindow()
  }

  /**
   * Where media plays: the devices the system routes it to, from Android 13,
   * and before that, whether any device other than the phone's own is
   * connected, which media then goes to.
   */
  private fun isRoutedAway(): Boolean {
    val devices = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      val media = AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).build()
      try {
        audioManager.getAudioDevicesForAttributes(media)
      } catch (_: SecurityException) {
        audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS).toList()
      }
    } else {
      audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS).toList()
    }
    return devices.any { it.type in EXTERNAL_OUTPUTS }
  }

  private fun showOutputSwitcher() {
    SystemOutputSwitcherDialogController.showDialog(appContext.currentActivity ?: context)
  }

  @Composable
  override fun ComposableScope.Content() {
    val tint = props.tint.value?.toCompose() ?: ComposeColor.Gray
    val active = routedAway.value
    val icon = if (active) CAST_CONNECTED else CAST

    Box(
      contentAlignment = Alignment.Center,
      modifier = Modifier
        .fillMaxSize()
        .semantics {
          contentDescription = "Audio output"
          stateDescription = if (active) "Playing on another device" else "Playing on this device"
        }
        .clickable(role = Role.Button, onClickLabel = "Choose where audio plays") {
          showOutputSwitcher()
        }
    ) {
      Image(
        painter = rememberVectorPainter(icon),
        contentDescription = null,
        colorFilter = ColorFilter.tint(tint),
        modifier = Modifier.size(ICON_SIZE.dp)
      )
    }
  }

  companion object {
    private const val ICON_SIZE = 24

    /** Outputs that are not the phone's own speaker or earpiece. */
    @SuppressLint("InlinedApi")
    private val EXTERNAL_OUTPUTS = setOf(
      AudioDeviceInfo.TYPE_BLUETOOTH_A2DP,
      AudioDeviceInfo.TYPE_BLUETOOTH_SCO,
      AudioDeviceInfo.TYPE_WIRED_HEADPHONES,
      AudioDeviceInfo.TYPE_WIRED_HEADSET,
      AudioDeviceInfo.TYPE_USB_HEADSET,
      AudioDeviceInfo.TYPE_USB_DEVICE,
      AudioDeviceInfo.TYPE_USB_ACCESSORY,
      AudioDeviceInfo.TYPE_HDMI,
      AudioDeviceInfo.TYPE_HDMI_ARC,
      AudioDeviceInfo.TYPE_LINE_ANALOG,
      AudioDeviceInfo.TYPE_LINE_DIGITAL,
      AudioDeviceInfo.TYPE_DOCK,
      AudioDeviceInfo.TYPE_HEARING_AID,
      AudioDeviceInfo.TYPE_BLE_HEADSET,
      AudioDeviceInfo.TYPE_BLE_SPEAKER,
      AudioDeviceInfo.TYPE_BLE_BROADCAST,
      AudioDeviceInfo.TYPE_REMOTE_SUBMIX
    )

    /** Material's cast icon: a screen with waves rising from its corner. */
    private val CAST = icon(
      "M21,3L3,3c-1.1,0 -2,0.9 -2,2v3h2L3,5h18v14h-7v2h7c1.1,0 2,-0.9 2,-2L23,5c0,-1.1 -0.9,-2 -2,-2z" +
        "M1,18v3h3c0,-1.66 -1.34,-3 -3,-3zM1,14v2c2.76,0 5,2.24 5,5h2c0,-3.87 -3.13,-7 -7,-7z" +
        "M1,10v2c4.97,0 9,4.03 9,9h2c0,-6.08 -4.93,-11 -11,-11z"
    )

    /** Material's cast-connected icon: the cast icon with its screen filled. */
    private val CAST_CONNECTED = icon(
      "M21,3L3,3c-1.1,0 -2,0.9 -2,2v3h2L3,5h18v14h-7v2h7c1.1,0 2,-0.9 2,-2L23,5c0,-1.1 -0.9,-2 -2,-2z" +
        "M1,18v3h3c0,-1.66 -1.34,-3 -3,-3zM1,14v2c2.76,0 5,2.24 5,5h2c0,-3.87 -3.13,-7 -7,-7z" +
        "M1,10v2c4.97,0 9,4.03 9,9h2c0,-6.08 -4.93,-11 -11,-11z" +
        "M19,7L5,7v1.63c3.96,1.28 7.09,4.41 8.37,8.37L19,17L19,7z"
    )

    private fun icon(path: String): ImageVector =
      ImageVector.Builder(
        defaultWidth = 24.dp,
        defaultHeight = 24.dp,
        viewportWidth = 24f,
        viewportHeight = 24f
      ).addPath(
        pathData = addPathNodes(path),
        fill = SolidColor(ComposeColor.Black)
      ).build()
  }
}
