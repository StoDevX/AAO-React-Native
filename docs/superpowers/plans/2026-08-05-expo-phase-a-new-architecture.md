# Expo Phase A: New Architecture and SDK Ladder — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable the React Native New Architecture and reach Expo SDK 57 / RN 0.86.2, with `ios/` still tracked and hand-maintained.

**Architecture:** Six stacked PRs. The runtime-model change (New Architecture) lands alone on the RN version already shipping, so a failure is attributable to the architecture rather than to a version bump. Only then does the SDK ladder step 54→55→56→57, one SDK per PR.

**Tech Stack:** Expo SDK, React Native, CocoaPods, XCUITest, GitHub Actions, mise.

**Spec:** `docs/superpowers/specs/2026-08-05-expo-sdk57-newarch-cng-design.md`

## Global Constraints

- iOS is the only supported platform. There is no `android/` directory; ignore Android instructions in upstream Expo/RN guides.
- `ios/` stays tracked for all of Phase A. Do not run `expo prebuild` in this plan.
- Every task ends green on: `mise run agent:pre-commit`, `xcodebuild build-for-testing`, and both UITest shards.
- Never disable, delete, or rename a test to make a task pass. The one deliberate skip (`ModuleCampusMapTests`, tracked by #7611) already landed in PR #7612 and is a prerequisite for this plan.
- Never skip or bypass the `hk` pre-commit hook.
- TypeScript for all new code; no `any`. Prettier config lives in `package.json` (tabs, single quotes, no semicolons).
- Target versions, exact: Expo 57 → React Native 0.86.2, React 19.2.3, `react-native-reanimated` 4.5.1, `react-native-worklets` 0.10.1, `react-native-gesture-handler` ~2.32.0, `react-native-screens` ~4.26.0.
- Intermediate rungs, exact: SDK 55 → RN 0.83.10, React 19.2.0, Reanimated 4.2.1, worklets 0.7.4, gesture-handler ~2.30.0, screens ~4.23.0. SDK 56 → RN 0.85.3, React 19.2.3, Reanimated 4.3.1, worklets 0.8.3, gesture-handler ~2.31.1, screens ~4.26.0.
- `@react-native-async-storage/async-storage` (3.1.0) and `@sentry/react-native` (8.11.0) are intentionally **ahead** of Expo's pins. Do not let `expo install --fix` downgrade them; see Task 4 Step 2.
- Reanimated lands at **4.3.1** with `react-native-worklets` **0.8.3** in Task 3, not at SDK 57's 4.5.1: 4.4.x and 4.5.x both require `react-native: 0.83 - 0.86` and cannot install on RN 0.81.5. 4.3.1 spans `0.81 - 0.85`, so it survives Tasks 3 through 5 untouched. Do not let `expo install --fix` downgrade it to SDK 55's 4.2.1 in Task 4 — 4.3.1 already satisfies that SDK. It is bumped to 4.5.1/0.10.1 only in Task 6, where RN reaches 0.86.

## Prerequisites

PR #7612 (skip the flaky Campus Map UITest) must be merged to master. Without it the UITest gate fails ~90% of runs and every task below is unverifiable.

## What every SDK rung needs (learned in Task 4)

These four apply to Tasks 4, 5 and 6 alike. None were in the original plan.

1. **Reject every downgrade `expo install --fix` proposes.** It aligns to the SDK's exact pins, and this repo runs ahead of them in ten packages. Diff `package.json` before and after, and restore anything it lowered. Downgrading to a rung we leave two PRs later is churn in both directions — and SDK 55's `@react-native-community/datetimepicker@8.6.0` is genuinely broken here, because `modules/datepicker` pins `9.1.0` and 8.6.0 drags in a `react-native-windows` peer wanting a different React Native.

2. **Bump the workspace peer ranges.** 25 packages under `modules/` declare `peerDependencies: {"react-native": "^0.<minor>.0"}`. A caret on a 0.x version pins the minor, so RN 0.83 does not satisfy `^0.81.0` and `npm install` fails with ERESOLVE before anything else can run. Sweep them:

```bash
node -e '
const fs=require("fs"); const to="^0.85.0";   // set to the new RN minor
for (const f of fs.readdirSync("modules")) {
  const p=`modules/${f}/package.json`;
  if (!fs.existsSync(p)) continue;
  const j=JSON.parse(fs.readFileSync(p,"utf8"));
  if (j.peerDependencies?.["react-native"]) {
    j.peerDependencies["react-native"] = to;
    fs.writeFileSync(p, JSON.stringify(j,null,2)+"\n");
  }
}'
```

Then check every other workspace peer against the new root versions, which is how `modules/open-url`'s stale `expo-web-browser` pin surfaced:

```bash
node -e '
const fs=require("fs"), semver=require("semver");
const root=JSON.parse(fs.readFileSync("package.json","utf8")).dependencies;
for (const f of fs.readdirSync("modules")) {
  const p=`modules/${f}/package.json`;
  if (!fs.existsSync(p)) continue;
  const j=JSON.parse(fs.readFileSync(p,"utf8"));
  for (const [dep,range] of Object.entries(j.peerDependencies||{})) {
    if (root[dep] && !semver.satisfies(root[dep], range))
      console.log(`${p} ${dep}: peer ${range} vs root ${root[dep]}`);
  }
}'
```

3. **Regenerate the pods from scratch.** `pod install` cannot cross a major React Native version in place: `Podfile.lock` and `Pods/Local Podspecs` keep the old `RCT-Folly`/`fmt` pairing and CocoaPods aborts with a `fmt` version conflict. `pod update fmt` only moves the conflict. Delete and rebuild — the lockfile is deterministic and git holds the previous one:

```bash
rm -rf ios/Pods ios/Podfile.lock
mise run pod:install
```

4. **Re-apply and re-verify the contrib patches.** `npm install` reinstalls React Native and silently drops `0002-rn-abortsignal.patch`. Run `mise run prepare` and confirm all four sentinels pass. Check `0003-fmt-disable-consteval.patch` specifically: it targets fmt's `#elif` branches, and React Native changes fmt versions between releases (0.81 shipped 11.0.2, 0.83 ships 12.1.0). It survived that jump, but confirm rather than assume.

---

### Task 1: New Architecture readiness audit (PR A1)

Verify the two modules that depend on the legacy-module interop layer, and rule out JS libraries touching removed internals. Still on the legacy architecture, so any change here is verifiable in isolation.

**Files:**
- Modify: `package.json` (only if a blocker is found)
- Create: `docs/superpowers/notes/2026-08-05-new-arch-audit.md`

**Interfaces:**
- Consumes: nothing.
- Produces: the audit note, which Task 2 uses to decide what to smoke-test manually.

- [ ] **Step 1: Grep for APIs removed under the New Architecture**

`findNodeHandle` and direct `UIManager` dispatch do not work under Fabric. Find every use in first-party code and in the JS-only libraries.

```bash
rg -n 'findNodeHandle|UIManager\.|requireNativeComponent|NativeModules\.' \
  source/ modules/ \
  node_modules/react-native-tableview-simple/ \
  node_modules/react-native-popover-view/ \
  node_modules/react-native-network-logger/ \
  node_modules/react-native-button/ \
  node_modules/react-native-typography/ \
  node_modules/react-native-paper/
```

Expected: hits in first-party code are the ones that matter. A hit inside `react-native-paper` is likely already guarded by that library. Record every hit in the audit note with a verdict of `safe` or `must-fix`.

- [ ] **Step 2: Confirm the two interop-dependent modules**

```bash
node -p "require('./node_modules/react-native-device-info/package.json').codegenConfig ?? 'none'"
node -p "require('./node_modules/react-native-zeroconf/package.json').codegenConfig ?? 'none'"
```

Expected: both print `none`. This confirms they are legacy `RCTBridgeModule`s that will run through the interop layer rather than as TurboModules. That is not a failure — it is the thing Task 2 must smoke-test on device.

- [ ] **Step 3: Check for newer releases that add codegen**

```bash
npm view react-native-device-info version
npm view react-native-zeroconf version
```

If a newer major exists, read its changelog for New Architecture support. If it adds codegen, upgrade it in this task — that removes a Task 2 risk. If not, leave it; the interop layer is the plan.

- [ ] **Step 4: Write the audit note**

Record, for each of the 19 native modules and 6 JS-only libraries: name, installed version, whether it declares `codegenConfig`, and a verdict. Include this command's output as the evidence for the native side:

```bash
for p in @react-native-async-storage/async-storage @react-native-clipboard/clipboard \
  @react-native-community/datetimepicker @react-native-community/netinfo \
  @react-native-picker/picker @sentry/react-native react-native-change-icon \
  react-native-device-info react-native-gesture-handler react-native-ios-context-menu \
  react-native-ios-utilities react-native-keychain react-native-reanimated \
  react-native-restart-newarch react-native-safe-area-context react-native-screens \
  react-native-webview react-native-zeroconf; do
  printf "%-50s %-10s %s\n" "$p" \
    "$(node -p "require('./node_modules/$p/package.json').version")" \
    "$(node -p "require('./node_modules/$p/package.json').codegenConfig?'codegen':'legacy'")"
done
```

- [ ] **Step 5: Fix anything the grep marked `must-fix`**

Only first-party `must-fix` hits. If there are none, this step is a no-op — say so in the note rather than inventing work.

- [ ] **Step 6: Verify the gate**

```bash
mise run agent:pre-commit
```

Expected: prettier, eslint, tsc, jest all pass.

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/notes/2026-08-05-new-arch-audit.md package.json package-lock.json
git commit -m "chore: audit New Architecture readiness of native modules"
```

---

### Task 2: Enable the New Architecture (PR A2)

The checkpoint that matters. Still Expo 54 / RN 0.81.5 — only the runtime model changes.

**Files:**
- Modify: `ios/Podfile:29-32`
- Modify: `ios/AllAboutOlaf/Info.plist` (`RCTNewArchEnabled`)

**Interfaces:**
- Consumes: Task 1's audit note.
- Produces: an app running on Fabric/TurboModules/Bridgeless at RN 0.81.5. Tasks 3–6 all assume the New Architecture is on.

- [ ] **Step 1: Flip the Podfile opt-out**

`ios/Podfile` currently reads:

```ruby
# Opt out of the New Architecture (Fabric/TurboModules/Bridgeless).
# The Old Architecture is fully supported through RN 0.76.
# See: https://github.com/StoDevX/AAO-React-Native/issues/7453
ENV['RCT_NEW_ARCH_ENABLED'] = '0'
```

Replace with:

```ruby
# The New Architecture (Fabric/TurboModules/Bridgeless) is required from
# React Native 0.82 onward, and enabled here ahead of that upgrade so the
# runtime-model change stays separable from the version change.
# See: https://github.com/StoDevX/AAO-React-Native/issues/7453
ENV['RCT_NEW_ARCH_ENABLED'] = '1'
```

- [ ] **Step 2: Flip the Info.plist key**

In `ios/AllAboutOlaf/Info.plist`, change:

```xml
	<key>RCTNewArchEnabled</key>
	<false/>
```

to:

```xml
	<key>RCTNewArchEnabled</key>
	<true/>
```

- [ ] **Step 3: Reinstall pods and confirm codegen runs**

```bash
mise run pod:install
```

Expected: output includes codegen activity (`Running codegen`, generated `ReactCodegen` artifacts) and pods resolve without error. If a pod fails to resolve, that is a real New Architecture incompatibility — stop and record which pod, do not work around it.

- [ ] **Step 4: Build the app and the test bundle**

```bash
set -o pipefail
xcodebuild build-for-testing \
  -workspace ios/AllAboutOlaf.xcworkspace \
  -scheme AllAboutOlaf \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath ios/build \
  -only-testing:AllAboutOlafUITests \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO \
  | xcbeautify
```

Expected: `** TEST BUILD SUCCEEDED **`.

- [ ] **Step 5: Run the UITests locally**

```bash
xcodebuild test-without-building \
  -xctestrun "$(find ios/build/Build/Products -name '*.xctestrun' -print -quit)" \
  -destination 'platform=iOS Simulator,name=iPhone 17e' \
  | xcbeautify
```

Expected: all suites pass; `ModuleCampusMapTests` reports **skipped**.

- [ ] **Step 6: Manual device verification**

The UITests cover navigation and rendering. They do not cover the four things most likely to break under interop. Check each on a real device or simulator by hand and record the result in the PR description:

1. **Alternate app icons** (`react-native-change-icon`) — Settings → change the app icon to the windmill variant, confirm the home-screen icon changes.
2. **mDNS server discovery** (`react-native-zeroconf`, legacy interop) — start `ccc-server` with `mise run stolaf-college:mdns`, open Settings → Server URL, confirm the server appears and tapping it fills the field.
3. **Device info readouts** (`react-native-device-info`, legacy interop) — open Settings and confirm the app/device version strings render rather than showing blank or `unknown`.
4. **Restart** (`react-native-restart-newarch`) — trigger whatever action restarts the JS bundle and confirm the app comes back rather than hanging.

Any failure here is a Task 2 blocker, not a follow-up.

- [ ] **Step 7: Check whether the restart fork is still needed**

```bash
npm view react-native-restart version
```

Read its changelog for New Architecture support. If upstream now supports it, note that in the PR description as a candidate for Task 6 cleanup. Do not swap it here — that would add a dependency change to the architecture PR.

- [ ] **Step 8: Verify the gate**

```bash
mise run agent:pre-commit
```

- [ ] **Step 9: Commit**

```bash
git add ios/Podfile ios/AllAboutOlaf/Info.plist ios/Podfile.lock
git commit -m "feat: enable the React Native New Architecture

Closes #7453."
```

---

### Task 3: Reanimated 4 (PR A3)

Reanimated 4 requires the New Architecture but only RN 0.78+, so it lands on RN 0.81.5 as its own change rather than riding along with an RN bump.

**Files:**
- Modify: `package.json`
- Modify: `babel.config.js`

**Interfaces:**
- Consumes: the New Architecture from Task 2.
- Produces: `react-native-worklets` as a direct dependency. Tasks 4–6 keep it pinned to each SDK's version.

- [ ] **Step 1: Read the migration guide before touching anything**

Fetch <https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x>. Reanimated 4 moved the worklets runtime into a separate `react-native-worklets` package and changed the Babel plugin's name.

As of writing, no first-party code imports Reanimated — it is a transitive requirement of `react-native-screens`, `react-native-gesture-handler`, and `react-native-paper`. Confirm that is still true:

```bash
rg -n 'react-native-reanimated' source/ modules/
```

Expected: no matches. If that holds, this task has no first-party API surface to migrate and the risk is confined to the native build and to animations those three libraries drive. If there *are* matches, read the migration guide's breaking-changes list against each one before continuing.

- [ ] **Step 2: Install Reanimated 4 and worklets**

```bash
npm install react-native-reanimated@4.3.1 react-native-worklets@0.8.3
```

**Not** SDK 57's pins. Reanimated 4.5.1 declares `react-native: 0.83 - 0.86` and cannot install on RN 0.81.5; 4.4.x is the same. 4.3.1 declares `0.81 - 0.85` and is the newest 4.x that runs here, and it requires `react-native-worklets` `0.8.x`.

4.3.1 is also exactly SDK 56's pin, so it matches unchanged at Task 5 and needs bumping only at Task 6. Verify the constraint rather than trusting this note:

```bash
npm view react-native-reanimated@4.3.1 peerDependencies
```

Expected: `'react-native': '0.81 - 0.85'`, `'react-native-worklets': '0.8.x'`.

- [ ] **Step 3: Update the Babel plugin**

Reanimated 4 ships its Babel plugin from the worklets package. In `babel.config.js`, change the last entry of `plugins`:

```js
		// the react-native-reanimated plugin must come last
		'react-native-reanimated/plugin',
```

to:

```js
		// the worklets plugin must come last
		'react-native-worklets/plugin',
```

It must stay last in the array — the existing comment says so for a reason.

- [ ] **Step 4: Reinstall pods**

```bash
mise run pod:install
```

- [ ] **Step 5: Build and run the UITests**

Use the same two commands as Task 2 Steps 4 and 5. Expected: build succeeds, UITests pass.

- [ ] **Step 6: Manually verify animations**

Reanimated failures are usually runtime and visual, not compile-time, and the UITests assert on element existence rather than motion. Because our Reanimated use is entirely transitive, exercise the three libraries that drive it:

1. **Navigation transitions** (`react-native-screens`) — push and pop several screens; confirm they slide rather than snapping or freezing.
2. **Gestures** (`react-native-gesture-handler`) — swipe-to-dismiss on the Reddit post detail screen, and any swipeable list rows.
3. **Paper components** (`react-native-paper`) — open anything using ripples, FABs, or snackbars and confirm they animate.

- [ ] **Step 7: Verify the gate**

```bash
mise run agent:pre-commit
```

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json babel.config.js ios/Podfile.lock
git commit -m "feat: upgrade react-native-reanimated to 4.x"
```

---

### Task 4: Expo SDK 55 / RN 0.83.10 (PR A4)

**Files:**
- Modify: `package.json`
- Modify: `ios/Podfile`, `ios/AllAboutOlaf/AppDelegate.swift` (only as the RN upgrade diff requires)
- Modify: `CLAUDE.md` (the React Native version reference)

**Interfaces:**
- Consumes: Reanimated 4 from Task 3.
- Produces: RN 0.83.10. Tasks 5 and 6 repeat this shape.

- [ ] **Step 1: Upgrade Expo, then align the rest**

```bash
npm install expo@^55.0.0
npx expo install --fix
```

`expo install --fix` rewrites dependency versions to the SDK's pins, including `react-native` and `react`.

- [ ] **Step 2: Restore the two intentionally-ahead dependencies**

`expo install --fix` will try to downgrade `@react-native-async-storage/async-storage` to 2.2.0 and `@sentry/react-native` to the 7.x line. Both are deliberately ahead of Expo's pins. Check and restore:

```bash
git diff package.json
npm install @react-native-async-storage/async-storage@3.1.0 @sentry/react-native@8.11.0
```

Expected end state: `package.json` shows async-storage 3.1.0 and Sentry 8.11.0.

- [ ] **Step 3: Confirm the versions landed**

```bash
node -p "const p=require('./package.json').dependencies; \
  ['expo','react','react-native','react-native-reanimated','react-native-worklets', \
   'react-native-gesture-handler','react-native-screens'].map(k=>k+'='+p[k]).join('\n')"
```

Expected: `react-native=0.83.10`, `react=19.2.0`, gesture-handler ~2.30.0, screens ~4.23.0. Reanimated and worklets stay at the Task 3 versions (4.5.1 / 0.10.1), which satisfy SDK 55's floor.

- [ ] **Step 4: Apply the React Native native-file diff**

`ios/` is still hand-maintained, so RN's own changes to `Podfile` and `AppDelegate.swift` must be applied by hand. Open the upgrade helper for 0.81.5 → 0.83.10:

<https://react-native-community.github.io/upgrade-helper/?from=0.81.5&to=0.83.10>

Apply only the iOS diffs, and only the parts that do not conflict with our four deliberate `AppDelegate.swift` customizations (`URLCache` sizing, `AVAudioSession` playback category, `--reset-state` handling, pre-bundled-jsbundle fallback). Keep all four.

- [ ] **Step 5: Run Expo's own diagnostic**

```bash
npx expo-doctor
```

Expected: it will flag async-storage and Sentry as off-pin. That is intended — note it in the PR description. Any *other* finding must be resolved before merging.

- [ ] **Step 6: Reinstall pods, build, and test**

```bash
mise run pod:install
```

Then the build and UITest commands from Task 2 Steps 4 and 5.

- [ ] **Step 7: Update the version reference in CLAUDE.md**

CLAUDE.md's project overview names the React Native version. Change `React Native 0.81.5` to `React Native 0.83.10`. Stale version references there mislead future sessions.

- [ ] **Step 8: Verify the gate**

```bash
mise run agent:pre-commit
```

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json ios/ CLAUDE.md
git commit -m "feat: upgrade to Expo SDK 55 and React Native 0.83.10"
```

---

### Task 5: Expo SDK 56 / RN 0.85.3 (PR A5)

Identical in shape to Task 4. The steps are repeated rather than cross-referenced, because tasks may be read out of order.

**Files:**
- Modify: `package.json`
- Modify: `ios/Podfile`, `ios/AllAboutOlaf/AppDelegate.swift` (only as the RN upgrade diff requires)
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: RN 0.83.10 from Task 4.
- Produces: RN 0.85.3.

- [ ] **Step 1: Upgrade Expo, then align the rest**

```bash
npm install expo@^56.0.0
npx expo install --fix
```

- [ ] **Step 2: Restore the two intentionally-ahead dependencies**

```bash
git diff package.json
npm install @react-native-async-storage/async-storage@3.1.0 @sentry/react-native@8.11.0
```

- [ ] **Step 3: Confirm the versions landed**

```bash
node -p "const p=require('./package.json').dependencies; \
  ['expo','react','react-native','react-native-gesture-handler','react-native-screens'] \
  .map(k=>k+'='+p[k]).join('\n')"
```

Expected: `react-native=0.85.3`, `react=19.2.3`, gesture-handler ~2.31.1, screens ~4.26.0.

- [ ] **Step 4: Apply the React Native native-file diff**

<https://react-native-community.github.io/upgrade-helper/?from=0.83.10&to=0.85.3>

iOS diffs only. Preserve all four `AppDelegate.swift` customizations.

- [ ] **Step 5: Run Expo's own diagnostic**

```bash
npx expo-doctor
```

Expected: only the two known off-pin dependencies.

- [ ] **Step 6: Reinstall pods, build, and test**

```bash
mise run pod:install
```

Then the build and UITest commands from Task 2 Steps 4 and 5.

- [ ] **Step 7: Update the version reference in CLAUDE.md**

Change `React Native 0.83.10` to `React Native 0.85.3`.

- [ ] **Step 8: Verify the gate**

```bash
mise run agent:pre-commit
```

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json ios/ CLAUDE.md
git commit -m "feat: upgrade to Expo SDK 56 and React Native 0.85.3"
```

---

### Task 6: Expo SDK 57 / RN 0.86.2 (PR A6)

The last rung. After this the app is on target versions with `ios/` still hand-maintained.

**Files:**
- Modify: `package.json`
- Modify: `ios/Podfile`, `ios/AllAboutOlaf/AppDelegate.swift` (only as the RN upgrade diff requires)
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: RN 0.85.3 from Task 5.
- Produces: Expo 57 / RN 0.86.2. Phase B's plan assumes this as its starting state.

- [ ] **Step 1: Upgrade Expo, then align the rest**

```bash
npm install expo@^57.0.0
npx expo install --fix
```

- [ ] **Step 2: Restore the two intentionally-ahead dependencies**

```bash
git diff package.json
npm install @react-native-async-storage/async-storage@3.1.0 @sentry/react-native@8.11.0
```

- [ ] **Step 3: Confirm the versions landed**

```bash
node -p "const p=require('./package.json').dependencies; \
  ['expo','react','react-native','react-native-reanimated','react-native-worklets', \
   'react-native-gesture-handler','react-native-screens'].map(k=>k+'='+p[k]).join('\n')"
```

Expected: `react-native=0.86.2`, `react=19.2.3`, Reanimated 4.5.1, worklets 0.10.1, gesture-handler ~2.32.0, screens ~4.26.0.

- [ ] **Step 4: Apply the React Native native-file diff**

<https://react-native-community.github.io/upgrade-helper/?from=0.85.3&to=0.86.2>

iOS diffs only. Preserve all four `AppDelegate.swift` customizations.

- [ ] **Step 5: Run Expo's own diagnostic**

```bash
npx expo-doctor
```

- [ ] **Step 6: Reinstall pods, build, and test**

```bash
mise run pod:install
```

Then the build and UITest commands from Task 2 Steps 4 and 5.

- [ ] **Step 7: Resolve the restart fork**

Task 2 Step 7 recorded whether upstream `react-native-restart` supports the New Architecture. If it does, swap it now and delete the fork:

```bash
npm uninstall react-native-restart-newarch
npm install react-native-restart
```

Update the import sites found by `rg -n 'react-native-restart' source/ modules/`, reinstall pods, and re-run the build and UITests. If upstream still lacks support, leave the fork and say so in the PR description — do not leave the question open.

- [ ] **Step 8: Update the version reference in CLAUDE.md**

Change `React Native 0.85.3` to `React Native 0.86.2`.

- [ ] **Step 9: Verify the gate**

```bash
mise run agent:pre-commit
```

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json ios/ CLAUDE.md
git commit -m "feat: upgrade to Expo SDK 57 and React Native 0.86.2"
```

---

## Rollback

Every task in this plan reverts cleanly: `ios/` stays tracked throughout, so reverting a version bump restores a known-good Xcode project and `Podfile.lock`. After reverting, run `mise run pod:install` to bring `ios/Pods` back in line.

## Exit criteria

- `package.json` shows `expo` 57.x and `react-native` 0.86.2.
- `ios/Podfile` sets `RCT_NEW_ARCH_ENABLED=1` and `Info.plist` sets `RCTNewArchEnabled` true.
- `npx expo-doctor` reports only the two intentional off-pin dependencies.
- Both UITest shards green on CI, with `ModuleCampusMapTests` skipped.
- The four manual checks from Task 2 Step 6 pass.
- CLAUDE.md names React Native 0.86.2.
