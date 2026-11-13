package tech.frogpond.messissuetile

import android.content.Context
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.luminance
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ComposableScope
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.ExpoComposeView
import expo.modules.kotlin.views.OptimizedComposeProps

/** The tile's props, as index.tsx's `NativeProps` sends them. */
@OptimizedComposeProps
data class MessIssueTileProps(
  /** The paper's name across the top of the sheet, "The Olaf Messenger" */
  val nameplate: MutableState<String> = mutableStateOf(""),
  val title: MutableState<String> = mutableStateOf(""),
  /** The issue's date as words; the tile sets it in capitals */
  val date: MutableState<String> = mutableStateOf(""),
  val special: MutableState<Boolean> = mutableStateOf(false),
  /** Whether the lead has a photo: the tile keeps a photo's layout, with a placeholder, while it has none */
  val hasPhoto: MutableState<Boolean> = mutableStateOf(false),
  val photoUrl: MutableState<String?> = mutableStateOf(null),
  val stains: MutableState<List<StainMark>> = mutableStateOf(emptyList()),
  val stainKind: MutableState<StainKind> = mutableStateOf(StainKind.COFFEE),
  val photoTone: MutableState<PhotoTone> = mutableStateOf(PhotoTone.AUTO),
  val layout: MutableState<TileLayout> = mutableStateOf(TileLayout.GRID),
  /** The lead story's words, for the top tile's columns, or below a photo-less grid tile's fold */
  val paragraphs: MutableState<List<String>> = mutableStateOf(emptyList()),
  val sheet: MutableState<SheetShape> = mutableStateOf(SheetShape()),
  /** All TalkBack reads of the tile */
  val label: MutableState<String> = mutableStateOf(""),
  val testID: MutableState<String?> = mutableStateOf(null)
) : ComposeProps

/**
 * One Messenger issue's tile, composed inside an `@expo/ui` `<Host>` as the iOS tile is inside a
 * SwiftUI one. The whole sheet is one button, and TalkBack reads only its label.
 */
class MessIssueTileView(context: Context, appContext: AppContext) :
  ExpoComposeView<MessIssueTileProps>(context, appContext) {

  override val props = MessIssueTileProps()
  private val onTilePress by EventDispatcher<Unit>()

  @Composable
  override fun ComposableScope.Content() {
    val content = TileContent(
      nameplate = props.nameplate.value,
      title = props.title.value,
      date = props.date.value,
      special = props.special.value,
      hasPhoto = props.hasPhoto.value,
      stains = props.stains.value,
      stainKind = props.stainKind.value,
      photoTone = props.photoTone.value,
      layout = props.layout.value,
      paragraphs = props.paragraphs.value,
      sheet = props.sheet.value
    )
    val url = props.photoUrl.value?.takeIf { it.isNotBlank() }
    // A grid tile's photo is about 180 dp wide and the top tile's up to about 460 on a phone, at
    // three pixels a dp, or 660 across a tablet, at two.
    val maxPixels = if (content.layout == TileLayout.GRID) 600 else 1400
    val wanted = content.hasPhoto && url != null

    var image by remember(url, maxPixels) {
      mutableStateOf<ImageBitmap?>(url?.let { TilePhotos.cached(it, maxPixels) })
    }
    var failed by remember(url, maxPixels) { mutableStateOf(false) }
    // Tied to the tile's time in the composition: a tile scrolled out of a lazy list stops its
    // load, and one that comes back without its photo starts again.
    LaunchedEffect(url, maxPixels, wanted) {
      if (!wanted || url == null || image != null) return@LaunchedEffect
      val loaded = TilePhotos.load(url, maxPixels)
      if (loaded != null) image = loaded else failed = true
    }

    // Follows the Host's Material colour scheme, which follows the system unless the app sets one.
    val dark = MaterialTheme.colorScheme.surface.luminance() < 0.5f

    FoldedTile(
      content = content,
      photo = PhotoState(
        image = if (wanted) image else null,
        loading = wanted && image == null && !failed
      ),
      dark = dark,
      label = props.label.value,
      testID = props.testID.value,
      onPress = { onTilePress(Unit) }
    )
  }
}
