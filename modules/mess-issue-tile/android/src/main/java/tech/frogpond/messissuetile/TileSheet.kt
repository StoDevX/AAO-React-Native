package tech.frogpond.messissuetile

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.indication
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.TextAutoSize
import androidx.compose.material3.ripple
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.graphics.CompositingStrategy
import androidx.compose.ui.graphics.FilterQuality
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.layer.drawLayer
import androidx.compose.ui.graphics.rememberGraphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.onClick
import androidx.compose.ui.semantics.role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.dp
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

/**
 * What one tile draws, copied out of its props, so every layer of the sheet is drawn from the
 * same values.
 */
internal data class TileContent(
  val nameplate: String,
  val title: String,
  val date: String,
  val special: Boolean,
  val hasPhoto: Boolean,
  val stains: List<StainMark>,
  val stainKind: StainKind,
  val photoTone: PhotoTone,
  val layout: TileLayout,
  val paragraphs: List<String>,
  val sheet: SheetShape
)

/** The lead photo as the sheet has it: loaded, still loading, or never coming. */
internal class PhotoState(val image: ImageBitmap?, val loading: Boolean)

/**
 * One Messenger issue as a small folded broadsheet: nameplate, date, lead photo, headline, and on
 * the top tile the lead story in columns; then the rings of whatever the reader has read.
 *
 * The flat sheet is recorded once into a graphics layer and drawn twice, clipped at the fold: the
 * part above lies flat, the part below bends back away from the reader, photo, type and all. The
 * whole sheet then sits at its slight tilt over the two sheets behind it, which cast a Material
 * elevation shadow. The tile is one button: pressing it presses the sheet down a little, with a
 * ripple in the sheet's own outline, and TalkBack reads only its label.
 */
@OptIn(ExperimentalComposeUiApi::class)
@Composable
internal fun FoldedTile(
  content: TileContent,
  photo: PhotoState,
  dark: Boolean,
  label: String,
  testID: String?,
  onPress: () -> Unit,
  modifier: Modifier = Modifier
) {
  val palette = PaperPalette.of(dark)
  val sheet = content.sheet
  // How far along each edge a turned corner reaches: enough to nick a headline's last letter at most.
  val earSize = if (content.layout.isTop) 14.dp else 10.dp
  val outline = remember(sheet.edgeSeed, sheet.dogEar, earSize) {
    PaperOutline(seed = sheet.edgeSeed.toLong().toInt(), dogEar = sheet.dogEar, earSize = earSize)
  }

  val interaction = remember { MutableInteractionSource() }
  val pressed by interaction.collectIsPressedAsState()
  val pressScale by animateFloatAsState(
    targetValue = if (pressed) 0.97f else 1f,
    animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessMedium),
    label = "press"
  )
  val elevation by animateDpAsState(
    targetValue = if (pressed) 1.dp else 4.dp,
    animationSpec = spring(stiffness = Spring.StiffnessMedium),
    label = "elevation"
  )
  val sheetLayer = rememberGraphicsLayer()
  val density = LocalDensity.current

  Box(
    modifier
      .fillMaxWidth()
      // Room for the sheets showing behind, down and to the right.
      .padding(end = 5.dp, bottom = 5.dp)
      .aspectRatio(content.layout.aspect)
      .then(
        if (!testID.isNullOrEmpty()) {
          Modifier.semantics { testTagsAsResourceId = true }.testTag(testID)
        } else {
          Modifier
        }
      )
      .clickable(
        interactionSource = interaction,
        indication = null,
        role = Role.Button,
        onClick = onPress
      )
      .clearAndSetSemantics {
        contentDescription = label
        role = Role.Button
        onClick { onPress(); true }
      }
  ) {
    Box(
      Modifier
        .matchParentSize()
        .graphicsLayer {
          rotationZ = sheet.tilt.toFloat()
          scaleX = pressScale
          scaleY = pressScale
        }
    ) {
      BackSheet(outline, palette.edgeFar, 4.dp, elevation)
      BackSheet(outline, palette.edgeNear, 2.dp, 0.dp)

      // The flat sheet, recorded into the layer and drawn only through the two halves below.
      FlatSheet(
        content = content,
        photo = photo,
        dark = dark,
        outline = outline,
        earSize = earSize,
        modifier = Modifier
          .matchParentSize()
          .drawWithContent { sheetLayer.record { this@drawWithContent.drawContent() } }
      )
      // Above the fold, flat.
      Canvas(Modifier.matchParentSize()) {
        clipRect(
          left = -size.width, top = -size.height,
          right = size.width * 2, bottom = size.height * FOLD_LINE
        ) {
          drawLayer(sheetLayer)
        }
      }
      // Below the fold, bent back about the fold line.
      Canvas(
        Modifier
          .matchParentSize()
          .graphicsLayer {
            // A negative turn about the horizontal axis takes the part below the pivot away from the reader.
            rotationX = -sheet.bend.toFloat()
            transformOrigin = TransformOrigin(0.5f, FOLD_LINE)
            cameraDistance = 12f * density.density
          }
      ) {
        clipRect(
          left = -size.width, top = size.height * FOLD_LINE,
          right = size.width * 2, bottom = size.height * 1.2f
        ) {
          drawLayer(sheetLayer)
        }
      }
      // The press ripple and focus highlight, in the sheet's own outline.
      Box(
        Modifier
          .matchParentSize()
          .clip(outline)
          .indication(interaction, ripple(color = palette.ink))
      )
    }
  }
}

/** One of the sheets showing behind the top one, offset down and to the right. */
@Composable
private fun BackSheet(outline: PaperOutline, color: Color, offset: Dp, elevation: Dp) {
  Box(
    Modifier
      .fillMaxSize()
      .offset(x = offset, y = offset)
      .graphicsLayer {
        shadowElevation = elevation.toPx()
        shape = outline
        clip = false
      }
      .background(color, outline)
  )
}

/**
 * The flat sheet with everything on it: paper, the page, stains, creases, the shade the fold will
 * cast, and a turned corner.
 */
@Composable
private fun FlatSheet(
  content: TileContent,
  photo: PhotoState,
  dark: Boolean,
  outline: PaperOutline,
  earSize: Dp,
  modifier: Modifier
) {
  val palette = PaperPalette.of(dark)
  BoxWithConstraints(
    modifier.drawWithContent {
      drawContent()
      drawDogEarFlap(content.sheet.dogEar, earSize, palette)
    }
  ) {
    val scale = content.layout.typeScale(maxWidth.value)
    val width = maxWidth
    val height = maxHeight
    Box(
      Modifier
        .matchParentSize()
        .clip(outline)
        .drawBehind { drawPaper(palette) }
        .drawWithContent {
          drawContent()
          drawStains(content.stains, content.stainKind, dark)
          drawCreases(content.sheet.creases, dark)
          drawFoldShade(palette)
        }
    ) {
      SheetPage(content, photo, dark, scale, width, height)
    }
  }
}

/**
 * What is printed on a sheet: its nameplate and date, then its lead story laid out for the
 * sheet's shape. Every size here is the phone's, times `scale`, so a sheet set across a wider
 * window is the same page with larger type, not a small page lost on a large sheet.
 */
@Composable
private fun SheetPage(
  content: TileContent,
  photo: PhotoState,
  dark: Boolean,
  scale: Float,
  width: Dp,
  height: Dp
) {
  val palette = PaperPalette.of(dark)
  val margin = 7f * scale
  Box(Modifier.fillMaxSize()) {
    Box(
      Modifier
        .fillMaxSize()
        .padding(margin.dp)
    ) {
      when (content.layout) {
        TileLayout.GRID -> GridPage(content, photo, dark, palette, scale)
        TileLayout.TOP_PORTRAIT -> TopPortraitPage(content, photo, dark, palette, scale)
        TileLayout.TOP_LANDSCAPE, TileLayout.TOP_BROADSHEET -> TopWidePage(content, photo, dark, palette, scale)
      }
    }
    // A grid tile with no photo keeps its headline above the fold and sets its lead story in two
    // columns below it.
    if (content.layout == TileLayout.GRID && !content.hasPhoto && content.paragraphs.isNotEmpty()) {
      val top = height.value * FOLD_LINE + 5f * scale
      val columnHeight = max(height.value - top - margin, 0f)
      ColumnText(
        paragraphs = content.paragraphs,
        columns = 2,
        ink = palette.ink,
        rule = palette.columnRule,
        typeSize = 3.4f * scale,
        modifier = Modifier
          .offset(x = margin.dp, y = top.dp)
          .width(max(width.value - margin * 2, 0f).dp)
          .height(columnHeight.dp)
      )
    }
  }
}

@Composable
private fun Header(content: TileContent, palette: PaperPalette, scale: Float) {
  val density = LocalDensity.current
  val isTop = content.layout.isTop
  val nameSize = (if (isTop) 20f else 12f) * scale
  val smallSize = (if (isTop) 10f else 8f) * scale
  Column(
    Modifier.fillMaxWidth(),
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.spacedBy((3f * scale).dp)
  ) {
    val nameStyle = remember(density, nameSize, palette) {
      TextStyle(
        color = palette.ink,
        fontFamily = FontFamily.Serif,
        fontWeight = FontWeight.Bold,
        fontSize = density.sheetSp(nameSize),
        textAlign = TextAlign.Center
      )
    }
    BasicText(
      text = content.nameplate,
      style = nameStyle,
      maxLines = 1,
      softWrap = false,
      overflow = TextOverflow.Clip,
      autoSize = TextAutoSize.StepBased(
        minFontSize = density.sheetSp(nameSize * 0.7f),
        maxFontSize = density.sheetSp(nameSize)
      )
    )
    Rule(palette.rule, 1f * scale)
    BasicText(
      text = content.date.uppercase(),
      style = TextStyle(
        color = palette.ink,
        fontSize = density.sheetSp(smallSize),
        letterSpacing = density.sheetSp(0.8f * scale),
        textAlign = TextAlign.Center
      ),
      maxLines = 1
    )
    if (content.special) {
      BasicText(
        text = "SPECIAL EDITION",
        style = TextStyle(
          color = palette.special,
          fontSize = density.sheetSp(smallSize),
          fontWeight = FontWeight.ExtraBold,
          letterSpacing = density.sheetSp(scale),
          textAlign = TextAlign.Center
        ),
        maxLines = 1
      )
    }
    Rule(palette.rule, 0.5f * scale)
  }
}

@Composable
private fun Rule(color: Color, thickness: Float) {
  Box(
    Modifier
      .fillMaxWidth()
      .height(thickness.dp)
      .background(color)
  )
}

/**
 * A grid tile: photo and a headline that always has room for three lines, or, with no photo, a
 * larger headline of up to six.
 */
@Composable
private fun GridPage(content: TileContent, photo: PhotoState, dark: Boolean, palette: PaperPalette, scale: Float) {
  Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy((5f * scale).dp)) {
    Header(content, palette, scale)
    if (content.hasPhoto) {
      LeadPhoto(
        photo, content.photoTone, dark, palette, scale,
        Modifier
          .fillMaxWidth()
          .weight(1f)
      )
      Headline(
        content.title, 11f * scale, 3, palette.ink,
        Modifier
          .fillMaxWidth()
          .height((11f * 1.2f * 3f * scale).dp)
      )
    } else {
      Headline(
        content.title, 16f * scale, 6, palette.ink,
        Modifier
          .fillMaxWidth()
          .padding(top = (5f * scale).dp)
      )
    }
  }
}

/**
 * The tall sheet: the headline across it, the photo over two columns, the story flowing under it
 * and down the third. With no photo the story takes all three from the top.
 */
@Composable
private fun TopPortraitPage(content: TileContent, photo: PhotoState, dark: Boolean, palette: PaperPalette, scale: Float) {
  Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy((6f * scale).dp)) {
    Header(content, palette, scale)
    Headline(content.title, (if (content.hasPhoto) 18f else 22f) * scale, 3, palette.ink, Modifier.fillMaxWidth())
    BoxWithConstraints(
      Modifier
        .fillMaxWidth()
        .weight(1f)
    ) {
      val bodySize = 4.6f * scale
      val gutter = bodySize * 2
      val column = (maxWidth.value - gutter * 2) / 3
      val photoWidth = max(column * 2 + gutter, 0f)
      val photoHeight = if (content.hasPhoto) max(min(maxHeight.value * 0.62f, photoWidth * 0.75f), 0f) else 0f
      val underPhoto = photoHeight + 5f * scale
      ColumnText(
        paragraphs = content.paragraphs,
        columns = 3,
        ink = palette.ink,
        rule = palette.columnRule,
        typeSize = bodySize,
        modifier = Modifier.matchParentSize(),
        tops = if (content.hasPhoto) listOf(underPhoto, underPhoto) else emptyList()
      )
      if (content.hasPhoto) {
        LeadPhoto(photo, content.photoTone, dark, palette, scale, Modifier.size(photoWidth.dp, photoHeight.dp))
      }
    }
  }
}

/**
 * A wide sheet, strip or broadsheet, a front page: the photo over the left two of four columns and
 * the headline over the right two, the story flowing under both from the left, or on the strip
 * under the headline alone. With no photo the headline runs across the sheet and the story takes
 * all four from under it.
 */
@Composable
private fun TopWidePage(content: TileContent, photo: PhotoState, dark: Boolean, palette: PaperPalette, scale: Float) {
  val density = LocalDensity.current
  val measurer = rememberTextMeasurer()
  Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy((6f * scale).dp)) {
    Header(content, palette, scale)
    if (!content.hasPhoto) {
      Headline(content.title, 22f * scale, 2, palette.ink, Modifier.fillMaxWidth())
    }
    BoxWithConstraints(
      Modifier
        .fillMaxWidth()
        .weight(1f)
    ) {
      val bodySize = 4.6f * scale
      val gutter = bodySize * 2
      val column = (maxWidth.value - gutter * 3) / 4
      val half = max(column * 2 + gutter, 0f)
      // The strip is too short to set the story under its photo, which takes its whole height.
      val photoHeight = if (content.layout == TileLayout.TOP_LANDSCAPE) {
        maxHeight.value
      } else {
        min(maxHeight.value * 0.72f, half * 0.62f)
      }
      val leadSize = 17f * scale
      val halfPx = with(density) { half.dp.roundToPx() }
      val leadHeight = remember(content.title, leadSize, halfPx, density, palette) {
        val style = density.headlineStyle(leadSize, palette.ink)
        val measured = measurer.measure(
          content.title, style,
          overflow = TextOverflow.Ellipsis,
          maxLines = 4,
          constraints = Constraints(maxWidth = max(halfPx, 0))
        )
        measured.size.height / density.density
      }
      val underPhoto = photoHeight + 5f * scale
      val underHeadline = leadHeight + 5f * scale
      ColumnText(
        paragraphs = content.paragraphs,
        columns = 4,
        ink = palette.ink,
        rule = palette.columnRule,
        typeSize = bodySize,
        modifier = Modifier.matchParentSize(),
        tops = if (content.hasPhoto) listOf(underPhoto, underPhoto, underHeadline, underHeadline) else emptyList()
      )
      if (content.hasPhoto) {
        LeadPhoto(photo, content.photoTone, dark, palette, scale, Modifier.size(half.dp, photoHeight.dp))
        Headline(
          content.title, leadSize, 4, palette.ink,
          Modifier
            .offset(x = (half + gutter).dp)
            .width(half.dp)
        )
      }
    }
  }
}

/**
 * The lead photo as newsprint prints one: faded and grainy, soft at the edges, and toned as the
 * reader chose; by default greyscale in the dark appearance. Until it loads, its placeholder
 * breathes gently; once it arrives it fades in over the placeholder.
 */
@Composable
private fun LeadPhoto(
  photo: PhotoState,
  tone: PhotoTone,
  dark: Boolean,
  palette: PaperPalette,
  scale: Float,
  modifier: Modifier
) {
  val image = photo.image
  val shown by animateFloatAsState(
    targetValue = if (image != null) 1f else 0f,
    animationSpec = tween(durationMillis = 300, easing = FastOutSlowInEasing),
    label = "photo"
  )
  val pulse: State<Float>? = if (photo.loading && image == null) loadingPulse() else null
  val filter = remember(tone, dark) { photoFilter(tone, dark) }

  Canvas(
    modifier.graphicsLayer {
      // Offscreen, so the soft-edged mask cuts only the photo, not the paper beneath it.
      compositingStrategy = CompositingStrategy.Offscreen
    }
  ) {
    if (shown < 1f) {
      drawRect(palette.placeholder, alpha = pulse?.value ?: 1f)
    }
    if (image != null && shown > 0f) {
      drawCropped(image, alpha = shown, filter = filter)
      drawRect(Textures.grain, alpha = 0.55f * shown)
    }
    drawRect(
      Brush.radialGradient(
        0f to Color.Black,
        0.5f to Color.Black,
        1f to Color.Black.copy(alpha = 0.5f),
        center = center,
        radius = max((140f * scale).dp.toPx(), 1f)
      ),
      blendMode = BlendMode.DstIn
    )
  }
}

@Composable
private fun loadingPulse(): State<Float> {
  val transition = rememberInfiniteTransition(label = "placeholder")
  return transition.animateFloat(
    initialValue = 1f,
    targetValue = 0.6f,
    animationSpec = infiniteRepeatable(tween(durationMillis = 900, easing = FastOutSlowInEasing), RepeatMode.Reverse),
    label = "pulse"
  )
}

/**
 * The photo filling the frame, cropped a little inside it, as the photo has always been: scaled to
 * fill, then 1.12 times that, centred.
 */
private fun DrawScope.drawCropped(image: ImageBitmap, alpha: Float, filter: ColorFilter) {
  if (image.width <= 0 || image.height <= 0 || size.width < 1f || size.height < 1f) return
  val fill = max(size.width / image.width, size.height / image.height) * 1.12f
  val sourceWidth = min(size.width / fill, image.width.toFloat())
  val sourceHeight = min(size.height / fill, image.height.toFloat())
  val sourceSize = IntSize(max(sourceWidth.roundToInt(), 1), max(sourceHeight.roundToInt(), 1))
  val sourceOffset = IntOffset(
    ((image.width - sourceSize.width) / 2).coerceAtLeast(0),
    ((image.height - sourceSize.height) / 2).coerceAtLeast(0)
  )
  drawImage(
    image = image,
    srcOffset = sourceOffset,
    srcSize = sourceSize,
    dstOffset = IntOffset.Zero,
    dstSize = IntSize(size.width.roundToInt(), size.height.roundToInt()),
    alpha = alpha,
    colorFilter = filter,
    filterQuality = FilterQuality.Medium
  )
}

/**
 * The tone of a tile's lead photo, as one colour matrix. Automatic follows the appearance, near full
 * colour in light and greyscale in dark; Colour keeps light's tone in both; Sepia is greyscale under
 * a warm paper tone, as an old newspaper's photo, in both. Each is faded a little: less contrast,
 * a touch of brightness.
 */
private fun photoFilter(tone: PhotoTone, dark: Boolean): ColorFilter {
  val grey: Float
  val tint: FloatArray
  val brightness: Float
  when (tone) {
    PhotoTone.AUTO -> {
      grey = if (dark) 1f else 0.3f
      tint = floatArrayOf(1f, 1f, 1f)
      brightness = if (dark) -0.05f else 0.04f
    }
    PhotoTone.COLOR -> {
      grey = 0.3f
      tint = floatArrayOf(1f, 1f, 1f)
      brightness = 0.04f
    }
    PhotoTone.SEPIA -> {
      grey = 1f
      tint = floatArrayOf(0.96f, 0.80f, 0.58f)
      brightness = if (dark) -0.02f else 0.04f
    }
  }
  val contrast = 0.88f
  val saturation = 1f - grey
  // Rec. 709 luma, as greyscale takes it.
  val luma = floatArrayOf(0.2126f, 0.7152f, 0.0722f)
  val offset = 255f * (0.5f * (1f - contrast) + brightness)
  val values = FloatArray(20)
  for (row in 0 until 3) {
    for (column in 0 until 3) {
      val desaturated = luma[column] * (1f - saturation) + if (row == column) saturation else 0f
      values[row * 5 + column] = contrast * tint[row] * desaturated
    }
    values[row * 5 + 4] = offset
  }
  values[3 * 5 + 3] = 1f
  return ColorFilter.colorMatrix(ColorMatrix(values))
}
