package com.allaboutolaf;

import android.util.JsonReader;

/**
 * Created by everdoorn on 6/18/17.
 */

public class WidgetAmountsProvider {
    String fileName;

    private String flexAmount;
    private String oleAmount;
    private String printAmount;
    private String mealsTodayAmount;
    private String mealsThisWeekAmount;

    public WidgetAmountsProvider(String file) {
        fileName = file;

        JsonReader
    }

    public String getFileName() {
        return fileName;
    }

    public String getFlexAmount() {
        return flexAmount;
    }

    public String getOleAmount() {
        return oleAmount;
    }

    public String getPrintAmount() {
        return printAmount;
    }

    public String getMealsTodayAmount() {
        return mealsTodayAmount;
    }

    public String getMealsThisWeekAmount() {
        return mealsThisWeekAmount;
    }
}
