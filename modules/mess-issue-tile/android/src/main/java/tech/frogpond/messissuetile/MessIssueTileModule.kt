package tech.frogpond.messissuetile

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class MessIssueTileModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("MessIssueTile")

    // Registered under the class's name, MessIssueTileView, as index.tsx asks for it.
    View(MessIssueTileView::class) {
      Events("onTilePress")
    }

    OnDestroy {
      TilePhotos.clear()
    }
  }
}
