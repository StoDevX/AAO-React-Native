package com.allaboutolaf;

import android.util.JsonReader;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;

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

        } catch (FileNotFoundException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        } catch (JSONException e) {
            e.printStackTrace();
        }
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
