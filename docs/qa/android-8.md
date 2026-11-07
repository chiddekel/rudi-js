# Android 8 end-to-end checks

Target: existing `rudi_api26`, Android 8.0 / API 26, x86_64, Pixel 5 AVD profile (not Nexus hardware).

## Issues

- ANDROID-01: First-lesson navigation throws `NS_ERROR_NOT_IMPLEMENTED` at `location.hash` on a `resource://` document. Kotlin host now copies bundled assets to app-private storage and loads a `file://` document. Device retest pending.
- ANDROID-02: Activity recreated with a saved Bundle opens a fresh Gecko session without loading any URI. Host now saves the current URI and loads it on recreation. Device retest pending.

## Reproduction tools

`python3 tests/android/ui.py emulator-5554` lists visible accessibility labels.
Append an exact label to tap it. This operates only on the explicitly named emulator; it does not clear app data.

## Test checklist

- Launch and render course path.
- Open guide and dismiss it.
- Complete first lesson, including choice and ordered-tile exercises.
- Verify completion and next lesson unlock.
- Restart app and verify saved progress.
- Navigate playground, ranking and profile.
- Android Back and activity recreation.

Existing JS course/engine unit tests pass. Release Kotlin compilation passes; final packaging/lint and device retest pending.
