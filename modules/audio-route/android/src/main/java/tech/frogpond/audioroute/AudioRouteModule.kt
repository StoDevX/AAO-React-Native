package tech.frogpond.audioroute

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

/**
 * The system's media volume as a slider, and a button that opens the system's
 * list of places the audio can play, as views. The JavaScript names them for
 * the iOS controls they stand in for.
 */
class AudioRouteModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AudioRoute")

    View(VolumeSliderView::class) {}

    View(AirPlayButtonView::class) {}
  }
}
