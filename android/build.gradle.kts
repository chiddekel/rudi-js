plugins {
    id("com.android.application") version "9.5.1" apply false
    // AGP 9 has built-in Kotlin; pinning a current Kotlin Gradle plugin replaces the bundled 2.2.x.
    id("org.jetbrains.kotlin.android") version "2.4.21" apply false
}
