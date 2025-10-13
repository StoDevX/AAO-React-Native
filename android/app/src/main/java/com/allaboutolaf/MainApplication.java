package com.allaboutolaf;

import android.app.Application;
import android.net.http.HttpResponseCache;
import android.util.Log;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;

import java.io.File;
import java.io.IOException;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

    private final ReactNativeHost mReactNativeHost = new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
            return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
            @SuppressWarnings("UnnecessaryLocalVariable")
            List<ReactPackage> packages = new PackageList(this).getPackages();
            // Packages that cannot be autolinked yet can be added manually here, for example:
            // packages.add(new MyReactNativePackage());
            return packages;
        }

        @Override
        protected String getJSMainModuleName() {
            return "index";
        }

        @Override
        protected String getJSBundleFile() {
            android.content.SharedPreferences prefs = getApplication().getSharedPreferences("ota", android.content.Context.MODE_PRIVATE);
            String pendingBundlePath = prefs.getString("jsBundlePath_pending", null);

            // 1. Activate new update if one is pending
            if (pendingBundlePath != null) {
                android.content.SharedPreferences.Editor editor = prefs.edit();
                editor.putString("jsBundlePath", pendingBundlePath);
                editor.putBoolean("isUpdatePendingVerification", true);
                editor.remove("jsBundlePath_pending");

                // Also save the version tag of the new update
                java.io.File pendingBundle = new java.io.File(pendingBundlePath);
                String versionTag = pendingBundle.getParentFile().getParentFile().getName();
                editor.putString("currentJSVersion", versionTag);

                editor.apply();
            }

            // 2. Check if the last update caused a crash
            if (prefs.getBoolean("isUpdatePendingVerification", false)) {
                // Crash detected! Start rollback.
                android.content.SharedPreferences.Editor editor = prefs.edit();
                editor.remove("isUpdatePendingVerification");

                String currentBundlePath = prefs.getString("jsBundlePath", null);
                if (currentBundlePath != null) {
                    java.io.File currentBundle = new java.io.File(currentBundlePath);
                    java.io.File updateDir = currentBundle.getParentFile().getParentFile();

                    // Delete the faulty update
                    deleteRecursively(updateDir);

                    // Find the next best update
                    String channel = prefs.getString("updateChannel", "release");
                    java.io.File channelDir = new java.io.File(getApplication().getFilesDir(), "updates/" + channel);
                    java.io.File[] availableUpdates = getSortedUpdatesInDirectory(channelDir);

                    boolean foundViableUpdate = false;
                    for (int i = 0; i < Math.min(3, availableUpdates.length); i++) {
                        java.io.File nextBestUpdate = availableUpdates[i];
                        String nextBestBundlePath = new java.io.File(nextBestUpdate, "bundles/main.jsbundle").getAbsolutePath();

                        if (new java.io.File(nextBestBundlePath).exists()) {
                            editor.putString("jsBundlePath", nextBestBundlePath);
                            foundViableUpdate = true;
                            break;
                        }
                    }

                    if (!foundViableUpdate) {
                        editor.remove("jsBundlePath");

                        // Cross-channel fallback
                        if (!channel.equals("release")) {
                            deleteRecursively(channelDir);
                            editor.remove("updateChannel");

                            java.io.File releaseChannelDir = new java.io.File(getApplication().getFilesDir(), "updates/release");
                            java.io.File[] releaseUpdates = getSortedUpdatesInDirectory(releaseChannelDir);

                            if (releaseUpdates.length > 0) {
                                java.io.File latestReleaseUpdate = releaseUpdates[0];
                                String latestReleaseBundlePath = new java.io.File(latestReleaseUpdate, "bundles/main.jsbundle").getAbsolutePath();
                                editor.putString("jsBundlePath", latestReleaseBundlePath);
                            }
                        }
                    }
                }
                editor.apply();
            }

            // 3. Determine the final path
            String jsBundlePath = prefs.getString("jsBundlePath", null);
            if (jsBundlePath != null) {
                java.io.File file = new java.io.File(jsBundlePath);
                if (file.exists()) {
                    return jsBundlePath;
                }
            }

            return super.getJSBundleFile();
        }

        private java.io.File[] getSortedUpdatesInDirectory(java.io.File directory) {
            java.io.File[] files = directory.listFiles();
            if (files == null) {
                return new java.io.File[0];
            }
            java.util.Arrays.sort(files, (f1, f2) -> Long.compare(f2.lastModified(), f1.lastModified()));
            return files;
        }

        private void deleteRecursively(java.io.File fileOrDirectory) {
            if (fileOrDirectory.isDirectory()) {
                for (java.io.File child : fileOrDirectory.listFiles()) {
                    deleteRecursively(child);
                }
            }
            fileOrDirectory.delete();
        }

        @Override
        protected boolean isNewArchEnabled() {
            return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }

        @Override
        protected Boolean isHermesEnabled() {
            return BuildConfig.IS_HERMES_ENABLED;
        }        
    };

    @Override
    public ReactNativeHost getReactNativeHost() {
        return mReactNativeHost;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);

        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            // If you opted-in for the New Architecture, we load the native entry point for this app.
            DefaultNewArchitectureEntryPoint.load();
        }

        // set up network cache
        try {
            File httpCacheDir = new File(getApplicationContext().getCacheDir(), "http");
            long httpCacheSize = 20 * 1024 * 1024; // 20 MiB
            HttpResponseCache.install(httpCacheDir, httpCacheSize);
        } catch (IOException e) {
            Log.i("allaboutolaf", "HTTP response cache installation failed:", e);
        }

        ReactNativeFlipper.initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
    }
}
