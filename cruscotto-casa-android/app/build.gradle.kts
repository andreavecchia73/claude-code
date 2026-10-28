plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "it.novalux.cruscottocasa"
    compileSdk = 34

    defaultConfig {
        applicationId = "it.novalux.cruscottocasa"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    // Keystore di debug fisso nel progetto: il codice SHA-1 non cambia tra una build e l'altra,
    // così il client OAuth Android registrato su Google Cloud continua a funzionare.
    signingConfigs {
        getByName("debug") {
            storeFile = file("cruscotto-debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    // Login Google e token OAuth per leggere il foglio su Drive (sola lettura)
    implementation("com.google.android.gms:play-services-auth:21.2.0")
}
