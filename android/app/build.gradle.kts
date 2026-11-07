import java.util.Properties
import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
}

android {
    namespace = "io.github.chiddekel.rudijs"
    compileSdk {
        version = release(37) { minorApiLevel = 2 }   // GeckoView 159 needs API 37.2
    }

    defaultConfig {
        applicationId = "io.github.chiddekel.rudijs"
        minSdk = 26            // Android 8.0 Oreo
        targetSdk = 37
        versionCode = 1
        versionName = "0.1.0-beta.1"
    }

    // Release signing comes from a properties file kept OUTSIDE the repo
    // (default ~/.android/rudi-js-signing.properties, override with RUDI_SIGNING_PROPERTIES).
    // Without it the release APK is built unsigned (e.g. in CI).
    val signingFile = file(
        providers.environmentVariable("RUDI_SIGNING_PROPERTIES")
            .getOrElse("${System.getProperty("user.home")}/.android/rudi-js-signing.properties"),
    )
    val releaseSigning = if (signingFile.isFile) {
        val props = Properties().apply { signingFile.inputStream().use(::load) }
        signingConfigs.create("release") {
            storeFile = file(props.getProperty("storeFile"))
            storePassword = props.getProperty("storePassword")
            keyAlias = props.getProperty("keyAlias")
            keyPassword = props.getProperty("keyPassword")
        }
    } else {
        null
    }

    // GeckoView ships native code per CPU: one APK per ABI keeps each download small.
    splits {
        abi {
            isEnable = true
            reset()
            include("arm64-v8a", "armeabi-v7a", "x86_64")
            isUniversalApk = false
        }
    }

    packaging {
        jniLibs {
            useLegacyPackaging = true          // compress native libs: ~3x smaller download
            keepDebugSymbols += "**/*.so"      // GeckoView libs ship already stripped
        }
    }

    buildTypes {
        release {
            signingConfig = releaseSigning
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    lint {
        abortOnError = true
        warningsAsErrors = true
        checkReleaseBuilds = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget = JvmTarget.JVM_17
        allWarningsAsErrors = true   // clean code: every Kotlin warning fails the build
    }
}

dependencies {
    implementation("androidx.activity:activity-ktx:1.13.0")
    implementation("androidx.core:core-ktx:1.19.1")
    implementation("org.mozilla.geckoview:geckoview:159.0.20261102144711")   // bundled Gecko engine
}

/** Copies the web app (the folder above android/) into the APK as assets/web. */
abstract class SyncWebAssets : DefaultTask() {
    @get:Internal
    abstract val webRoot: DirectoryProperty

    @get:InputFiles
    @get:PathSensitive(PathSensitivity.RELATIVE)
    val webFiles: FileTree
        get() = webRoot.asFileTree.matching {
            include("app.html", "design-system.html", "manifest.webmanifest")
            include("css/**", "js/**", "fonts/**", "assets/**")
        }

    @get:OutputDirectory
    abstract val outputDir: DirectoryProperty

    @get:Inject
    abstract val fs: FileSystemOperations

    @TaskAction
    fun sync() {
        fs.sync {
            from(webFiles)
            into(outputDir.dir("web"))
        }
    }
}

val syncWeb = tasks.register<SyncWebAssets>("syncWeb") {
    webRoot.set(rootProject.layout.projectDirectory.dir(".."))
}

androidComponents {
    onVariants { variant ->
        variant.sources.assets?.addGeneratedSourceDirectory(syncWeb, SyncWebAssets::outputDir)
    }
}
