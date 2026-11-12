package tech.frogpond.campussearchbar

import androidx.activity.compose.BackHandler
import androidx.activity.compose.LocalOnBackPressedDispatcherOwner
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.Crossfade
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.testTagsAsResourceId
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.kotlin.views.ComposeProps
import expo.modules.kotlin.views.FunctionalComposableScope
import expo.modules.kotlin.views.OptimizedComposeProps

/** Material 3's search bar height: the field's floor, as 44pt is on iOS. */
private val FieldHeight = 56.dp

/** Material 3's minimum touch target, which every icon here gets. */
private val IconSlot = 48.dp

/**
 * The bar owns its text. JavaScript hears every change through `onTextChange`
 * and never writes text back: the one change it could want, clearing on
 * Cancel, the bar does itself before reporting it.
 */
@OptimizedComposeProps
data class CampusSearchBarProps(
  val placeholder: String = "",
  val testID: String? = null
) : ComposeProps

@OptimizedRecord
data class CampusSearchBarTextEvent(
  @Field val value: String = ""
) : Record

/** `hasText` is read at the moment focus changes, as on iOS. */
@OptimizedRecord
data class CampusSearchBarFocusEvent(
  @Field val value: Boolean = false,
  @Field val hasText: Boolean = false
) : Record

/**
 * Material 3's search bar: a 56dp pill on the surface-container-high tone, a
 * search glyph that turns into a back arrow while there is something to
 * cancel, and a clear button while the field holds text.
 *
 * The back arrow, and system Back, play the part of iOS's Cancel button: the
 * field is cleared, focus and the keyboard go, and `onTextChange("")` then
 * `onCancel` are reported, in that order.
 */
@Composable
fun FunctionalComposableScope.CampusSearchBarContent(
  props: CampusSearchBarProps,
  onTextChange: (String) -> Unit,
  onFocusChange: (focused: Boolean, hasText: Boolean) -> Unit,
  onCancel: () -> Unit
) {
  var text by remember { mutableStateOf("") }
  var focused by remember { mutableStateOf(false) }
  val focusRequester = remember { FocusRequester() }
  val focusManager = LocalFocusManager.current
  val keyboard = LocalSoftwareKeyboardController.current
  val colors = MaterialTheme.colorScheme

  // Cancel is offered whenever there is something to cancel: an active edit,
  // or text left in the field after focus moved away.
  val cancellable = focused || text.isNotEmpty()

  val cancel = {
    // Cleared before focus goes, so the focus report says there is no text.
    text = ""
    focusManager.clearFocus()
    keyboard?.hide()
    onTextChange("")
    onCancel()
  }

  // Without a dispatcher owner (a host with no Activity above it) BackHandler
  // throws, so the arrow alone cancels there.
  if (LocalOnBackPressedDispatcherOwner.current != null) {
    BackHandler(enabled = cancellable) { cancel() }
  }

  Surface(
    shape = CircleShape,
    color = colors.surfaceContainerHigh,
    contentColor = colors.onSurfaceVariant,
    modifier = Modifier
      .fillMaxWidth()
      .heightIn(min = FieldHeight)
      .applyTestTag(props.testID)
  ) {
    Row(
      verticalAlignment = Alignment.CenterVertically,
      modifier = Modifier
        .heightIn(min = FieldHeight)
        .padding(horizontal = 4.dp)
    ) {
      Crossfade(targetState = cancellable, label = "leadingIcon") { showBack ->
        if (showBack) {
          IconButton(onClick = cancel) {
            Icon(
              imageVector = Icons.AutoMirrored.Filled.ArrowBack,
              contentDescription = "Cancel search"
            )
          }
        } else {
          Box(modifier = Modifier.size(IconSlot), contentAlignment = Alignment.Center) {
            Icon(imageVector = Icons.Filled.Search, contentDescription = null)
          }
        }
      }

      BasicTextField(
        value = text,
        onValueChange = { newText ->
          if (newText != text) {
            text = newText
            onTextChange(newText)
          }
        },
        singleLine = true,
        textStyle = MaterialTheme.typography.bodyLarge.copy(color = colors.onSurface),
        cursorBrush = SolidColor(colors.primary),
        keyboardOptions = KeyboardOptions(
          capitalization = KeyboardCapitalization.None,
          autoCorrectEnabled = false,
          keyboardType = KeyboardType.Text,
          imeAction = ImeAction.Search
        ),
        keyboardActions = KeyboardActions(
          // Search ends the edit and leaves the text, as iOS's Search key does.
          onSearch = {
            focusManager.clearFocus()
            keyboard?.hide()
          }
        ),
        modifier = Modifier
          .weight(1f)
          .padding(horizontal = 4.dp)
          .focusRequester(focusRequester)
          .onFocusChanged { state ->
            // Compose reports the initial unfocused state too; only real
            // changes reach JavaScript.
            if (state.isFocused != focused) {
              focused = state.isFocused
              onFocusChange(state.isFocused, text.isNotEmpty())
            }
          },
        decorationBox = { innerTextField ->
          Box(contentAlignment = Alignment.CenterStart) {
            if (text.isEmpty()) {
              Text(
                text = props.placeholder,
                style = MaterialTheme.typography.bodyLarge,
                color = colors.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
              )
            }
            innerTextField()
          }
        }
      )

      AnimatedVisibility(
        visible = text.isNotEmpty(),
        enter = fadeIn() + scaleIn(),
        exit = fadeOut() + scaleOut()
      ) {
        IconButton(
          onClick = {
            // Clearing keeps the edit going, as Android's search fields do.
            text = ""
            onTextChange("")
            focusRequester.requestFocus()
          }
        ) {
          Icon(imageVector = Icons.Filled.Close, contentDescription = "Clear search")
        }
      }
    }
  }
}

/** Exposes `testID` to UI Automator as a resource id, as @expo/ui does. */
@OptIn(ExperimentalComposeUiApi::class)
private fun Modifier.applyTestTag(testID: String?): Modifier =
  if (testID.isNullOrEmpty()) {
    this
  } else {
    this
      .semantics { testTagsAsResourceId = true }
      .testTag(testID)
  }
