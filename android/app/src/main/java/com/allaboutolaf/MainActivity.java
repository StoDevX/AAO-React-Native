package com.allaboutolaf;

import com.facebook.react.ReactActivity;
import com.bugsnag.BugsnagReactNative;
import android.os.Bundle;

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
    }
}
