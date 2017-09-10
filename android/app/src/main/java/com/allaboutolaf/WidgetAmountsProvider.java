package com.allaboutolaf;

import org.json.JSONException;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;

/**
 * All About Olaf
 * App widget provider
 */

public class WidgetAmountsProvider {
    String fileName;

    private String flexAmount;
    private String oleAmount;
    private String printAmount;
    private String mealsTodayAmount;
    private String mealsThisWeekAmount;

    private static final String DEFAULT_MONEY_AMOUNT = "$?.?? ";
    private static final String DEFAULT_MEALS_AMOUNT = "? ";

    public WidgetAmountsProvider(String file) {
        fileName = file;
        FileInputStream fileInputStream = null;
        try {
            fileInputStream = new FileInputStream(fileName);
            BufferedReader bufferedReader = new BufferedReader(new InputStreamReader(fileInputStream));
            StringBuilder stringBuilder = new StringBuilder();
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                stringBuilder.append(line);
            }
            JSONObject jsonObject = new JSONObject(stringBuilder.toString());
            this.flexAmount = jsonObject.getString("flex");
            this.oleAmount = jsonObject.getString("ole");
            this.printAmount = jsonObject.getString("print");
            this.mealsThisWeekAmount = jsonObject.getString("daily");
            this.mealsTodayAmount = jsonObject.getString("weekly");

        } catch (IOException | JSONException e) {
            e.printStackTrace();
        }
    }

    public String getFileName() {
        return fileName;
    }

    public String getFlexAmount() {
        if (flexAmount != null) {
            if (!flexAmount.isEmpty()) {
                return flexAmount;
            }
        }
        return DEFAULT_MONEY_AMOUNT;
    }

    public String getOleAmount() {
         if (oleAmount != null) {
            if (!oleAmount.isEmpty()) {
                return oleAmount;
            }
        }
        return DEFAULT_MONEY_AMOUNT;
    }

    public String getPrintAmount() {
        if (printAmount != null) {
            if (!printAmount.isEmpty()) {
                return printAmount;
            }
        }
        return DEFAULT_MONEY_AMOUNT;
    }

    public String getMealsTodayAmount() {
        if (mealsTodayAmount != null) {
            if (!mealsTodayAmount.isEmpty()) {
                return mealsTodayAmount;
            }
        }
        return DEFAULT_MEALS_AMOUNT;
    }

    public String getMealsThisWeekAmount() {
        if (mealsThisWeekAmount != null) {
            if (!mealsThisWeekAmount.isEmpty()) {
                return mealsThisWeekAmount;
            }
        }
        return DEFAULT_MEALS_AMOUNT;
    }
}
