package com.allaboutolaf;

import com.facebook.react.ReactActivity;
import com.bugsnag.BugsnagReactNative;
import com.calendarevents.CalendarEventsPackage;
import android.os.Bundle;
import com.facebook.react.modules.storage.ReactDatabaseSupplier;

public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "AllAboutOlaf";
    }

    // Set up Bugsnag
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (!BuildConfig.DEBUG) {
            BugsnagReactNative.start(this);
        }
        long size = 50L * 1024L * 1024L; // 50 MB
        ReactDatabaseSupplier.getInstance(getApplicationContext()).setMaximumSize(size);
    }

    // Required for react-native-calendar-events
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        CalendarEventsPackage.onRequestPermissionsResult(requestCode, permissions, grantResults);
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }
}
