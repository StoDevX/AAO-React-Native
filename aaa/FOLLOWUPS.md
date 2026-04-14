# All About Anything — Post-MVP Followups

Items deferred during MVP implementation. Most have detailed implementation plans linked below; execute with the `superpowers:subagent-driven-development` or `superpowers:executing-plans` skill.

## Planned

### UX / Features

- **Drag-to-reorder grid items** — gesture for reordering items in edit mode. `HomeFeature.moveItem` reducer action already exists; needs UI. Plan: [`2026-04-13-drag-to-reorder.md`](../docs/superpowers/plans/2026-04-13-drag-to-reorder.md)
- **URL destinations open in-app browser** — route `destinationUrl` items to `SFSafariViewController` instead of the placeholder screen. Plan: [`2026-04-13-url-destinations-in-app-browser.md`](../docs/superpowers/plans/2026-04-13-url-destinations-in-app-browser.md)
- **Bottom-sheet drawer for hidden items** — replace inline hidden section with a Shortcuts-app-style pull-up sheet. Plan: [`2026-04-13-bottom-sheet-drawer.md`](../docs/superpowers/plans/2026-04-13-bottom-sheet-drawer.md)

### Code Quality

Seven refactors bundled into one plan: [`2026-04-13-code-quality-sweep.md`](../docs/superpowers/plans/2026-04-13-code-quality-sweep.md)

- Remove redundant `@ObservableState` from `PlaceholderFeature`
- Unify `HiddenItemCell` opacity into a single `.opacity` layer (moot if bottom-sheet runs first)
- Switch `DatabaseClient.testValue` from `fatalError` to `unimplemented`
- Add `previewValue` for `DatabaseClient` with fixture data
- Route `liveValue` init failures through `reportIssue` for Sentry visibility
- Batch `persistCustomizations` into a single transaction via new `replaceCustomizations` API
- Move `HomeFeature.onAppear` DB calls off the main actor via `.run { send in ... }` effects

