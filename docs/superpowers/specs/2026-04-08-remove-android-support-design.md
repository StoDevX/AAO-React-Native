# Remove Android Support

## Goal

Fully remove Android platform support from the AAO React Native app, leaving an iOS-only project.

## Deletions

### Entire directories/files to delete

- `android/` — native Android project (Java, Gradle, resources, manifests, keystore)
- All `.android.tsx` platform-specific files:
  - `source/views/directory/detail.android.tsx`
  - `modules/datepicker/datepicker-android.tsx`
  - `modules/event-list/event-detail-android.tsx`
  - `source/views/student-orgs/detail-android.tsx`
  - `source/views/sis/student-work/detail-android.tsx`
  - `source/views/building-hours/detail/schedule-row-android.tsx`
  - `source/views/building-hours/detail/schedule-table-android.tsx`
  - `source/views/building-hours/detail/link-table-android.tsx`
- `fastlane/platforms/android.rb`
- `.github/workflows/validate-gradle-wrapper.yml`

### Rename `.ios.tsx` to `.tsx`

Where a `.android.tsx` file had a paired `.ios.tsx`, rename the iOS file to plain `.tsx` and update imports referencing it.

## Code simplification

~16 files contain `Platform.OS === 'android'` checks or `Platform.select()` calls. For each:

1. Remove the Android branch, keeping only the iOS code path.
2. Remove `Platform` import if no longer needed.
3. Remove `isAndroid` constants if they exist.

Files:
- `source/views/transportation/bus/line.tsx`
- `modules/touchable/index.tsx`
- `source/views/transportation/bus/components/progress-chunk.tsx`
- `modules/button/index.tsx`
- `modules/lists/list-separator.tsx`
- `modules/lists/list-row.tsx`
- `modules/lists/list-section-header.tsx`
- `modules/lists/disclosure-arrow.tsx`
- `source/views/stoprint/print-jobs.tsx`
- `source/views/settings/screens/overview/component-library/colors.tsx`
- `modules/tableview/cells/textfield.tsx`
- `modules/constants/index.ts`
- `source/views/building-hours/report/overview.tsx`
- `source/views/sis/balances-acknowledgement.tsx`
- `modules/tableview/cells/toggle.tsx`

## Configuration updates

- `mise.toml` — remove `android` and `bundle:android` tasks
- `.github/workflows/build-and-deploy.yml` — remove disabled Android build job
- `.github/workflows/check.yml` — remove disabled Android bundle and build jobs
- `CLAUDE.md` — remove `.android.tsx` references from conventions
- `README.md` — remove Android emulator setup instructions
- `CONTRIBUTING.md` — remove Gradle reference if appropriate
- `fastlane/README.md` — remove Android lane documentation

## Out of scope

- Cross-platform npm dependencies (still needed for iOS)
- React Native framework itself
- Any feature changes

## Risk

Low. Android CI is already disabled. All changes are deletions or simplifications with no behavioral impact on iOS.
