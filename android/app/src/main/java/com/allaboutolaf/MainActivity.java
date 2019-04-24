package com.allaboutolaf;

import com.facebook.react.modules.storage.ReactDatabaseSupplier;
import com.reactnativenavigation.NavigationActivity;
import com.calendarevents.CalendarEventsPackage;

import android.os.Bundle;
import android.support.annotation.NonNull;

public class MainActivity extends NavigationActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        long size = 50L * 1024L * 1024L; // 50 MB
        ReactDatabaseSupplier.getInstance(getApplicationContext()).setMaximumSize(size);
    }

    // Required for react-native-calendar-events
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        CalendarEventsPackage.onRequestPermissionsResult(requestCode, permissions, grantResults);
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }
}
