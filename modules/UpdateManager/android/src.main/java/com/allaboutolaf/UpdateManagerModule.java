// UpdateManagerModule.java
package com.allaboutolaf;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

public class UpdateManagerModule extends ReactContextBaseJavaModule {
    UpdateManagerModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "UpdateManager";
    }

    @ReactMethod
    public void getAvailableUpdates(Promise promise) {
        try {
            String nativeVersion = BuildConfig.VERSION_NAME;
            android.content.SharedPreferences prefs = getReactApplicationContext().getSharedPreferences("ota", android.content.Context.MODE_PRIVATE);
            String channel = prefs.getString("updateChannel", "release");
            String platform = "android";
            String currentJSVersion = prefs.getString("currentJSVersion", "0.0.0");

            java.net.URL url = new java.net.URL("https://ghcr.io/v2/all-about-olaf/all-about-olaf/tags/list");
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");

            java.io.InputStream inputStream = connection.getInputStream();
            java.util.Scanner scanner = new java.util.Scanner(inputStream).useDelimiter("\\A");
            String response = scanner.hasNext() ? scanner.next() : "";

            org.json.JSONObject json = new org.json.JSONObject(response);
            org.json.JSONArray tags = json.getJSONArray("tags");

            com.facebook.react.bridge.WritableArray filteredTags = com.facebook.react.bridge.Arguments.createArray();
            for (int i = 0; i < tags.length(); i++) {
                String tag = tags.getString(i);
                String[] components = tag.split("-");
                if (components.length == 3) {
                    String tagVersion = components[0];
                    String tagNativeVersion = components[1];
                    String tagPlatform = components[2];

                    boolean channelMatches;
                    if (channel.equals("release")) {
                        channelMatches = tagVersion.startsWith("v");
                    } else {
                        channelMatches = tagVersion.startsWith(channel);
                    }

                    if (tagPlatform.equals(platform) &&
                        tagNativeVersion.equals(nativeVersion) &&
                        channelMatches &&
                        isSemanticallyNewer(tagVersion, currentJSVersion)) {
                        filteredTags.pushString(tag);
                    }
                }
            }
            promise.resolve(filteredTags);

        } catch (Exception e) {
            promise.reject("E_UPDATE_DISCOVERY_FAILED", e);
        }
    }

    private boolean isSemanticallyNewer(String newVersion, String currentVersion) {
        // Simplified semver compare, in a real app use a proper library
        return newVersion.compareTo(currentVersion) > 0;
    }

    @ReactMethod
    public void downloadUpdate(String tag, Promise promise) {
        new Thread(() -> {
            try {
                android.content.SharedPreferences prefs = getReactApplicationContext().getSharedPreferences("ota", android.content.Context.MODE_PRIVATE);
                String channel = prefs.getString("updateChannel", "release");

                java.io.File updatesDir = new java.io.File(getReactApplicationContext().getFilesDir(), "updates/" + channel);
                if (!updatesDir.exists()) {
                    updatesDir.mkdirs();
                }
                java.io.File updateDir = new java.io.File(updatesDir, tag);

                // 1. Fetch Manifest
                java.net.URL manifestUrl = new java.net.URL("https://ghcr.io/v2/all-about-olaf/all-about-olaf/manifests/" + tag);
                java.net.HttpURLConnection manifestConnection = (java.net.HttpURLConnection) manifestUrl.openConnection();
                manifestConnection.setRequestProperty("Accept", "application/vnd.oci.image.manifest.v1+json");
                manifestConnection.setRequestMethod("GET");

                String manifestResponse = new java.util.Scanner(manifestConnection.getInputStream()).useDelimiter("\\A").next();
                org.json.JSONObject manifestJson = new org.json.JSONObject(manifestResponse);
                String digest = manifestJson.getJSONArray("layers").getJSONObject(0).getString("digest");

                // 2. Download Blob
                java.net.URL blobUrl = new java.net.URL("https://ghcr.io/v2/all-about-olaf/all-about-olaf/blobs/" + digest);
                java.net.HttpURLConnection blobConnection = (java.net.HttpURLConnection) blobUrl.openConnection();
                java.io.InputStream inputStream = blobConnection.getInputStream();

                if (!updateDir.exists()) {
                    updateDir.mkdirs();
                }
                java.io.File destinationFile = new java.io.File(updateDir, "update.tar.gz");
                java.io.FileOutputStream outputStream = new java.io.FileOutputStream(destinationFile);

                byte[] buffer = new byte[1024];
                int bytesRead;
                while ((bytesRead = inputStream.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, bytesRead);
                }
                outputStream.close();
                inputStream.close();

                // Extract the archive
                Process process = Runtime.getRuntime().exec("tar -xzf " + destinationFile.getAbsolutePath() + " -C " + updateDir.getAbsolutePath());
                process.waitFor();
                destinationFile.delete();

                // 3. Cleanup old updates
                cleanupOldUpdates(updatesDir);

                // 4. Save path for activation
                String bundlePath = new java.io.File(updateDir, "bundles/main.jsbundle").getAbsolutePath();
                android.content.SharedPreferences.Editor editor = prefs.edit();
                editor.putString("jsBundlePath_pending", bundlePath);
                editor.apply();

                promise.resolve(bundlePath);

            } catch (Exception e) {
                promise.reject("E_DOWNLOAD_FAILED", e);
            }
        }).start();
    }

    private void cleanupOldUpdates(java.io.File channelDir) {
        java.io.File[] updateDirs = channelDir.listFiles();
        if (updateDirs != null && updateDirs.length > 3) {
            java.util.Arrays.sort(updateDirs, (f1, f2) -> Long.compare(f1.lastModified(), f2.lastModified()));
            for (int i = 0; i < updateDirs.length - 3; i++) {
                deleteRecursively(updateDirs[i]);
            }
        }
    }

    private void deleteRecursively(java.io.File fileOrDirectory) {
        if (fileOrDirectory.isDirectory()) {
            for (java.io.File child : fileOrDirectory.listFiles()) {
                deleteRecursively(child);
            }
        }
        fileOrDirectory.delete();
    }

    @ReactMethod
    public void setUpdateChannel(String channelName, Promise promise) {
        android.content.SharedPreferences prefs = getReactApplicationContext().getSharedPreferences("ota", android.content.Context.MODE_PRIVATE);
        android.content.SharedPreferences.Editor editor = prefs.edit();
        editor.putString("updateChannel", channelName);
        editor.apply();
        promise.resolve(null);
    }

    @ReactMethod
    public void markUpdateAsGood(Promise promise) {
        android.content.SharedPreferences prefs = getReactApplication-Context().getSharedPreferences("ota", android.content.Context.MODE_PRIVATE);
        android.content.SharedPreferences.Editor editor = prefs.edit();
        editor.remove("isUpdatePendingVerification");
        editor.apply();
        promise.resolve(null);
    }
}
