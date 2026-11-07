import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
}

android {
    namespace = "io.github.chiddekel.rudijs"
    compileSdk = 37

    defaultConfig {
        applicationId = "io.github.chiddekel.rudijs"
        minSdk = 26            // Android 8.0 Oreo
        targetSdk = 37
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
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
