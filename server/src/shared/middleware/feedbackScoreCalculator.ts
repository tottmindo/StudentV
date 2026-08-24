/**
 * Calculates a feedback score based on the comparison between the latest consumption value
 * and the average of the previous 7 days' consumption.
 * 
 * The function analyzes consumption patterns by comparing the most recent day's consumption
 * against a 7-day moving average. It returns a normalized score between 0 and 100, where:
 * - A score of 66.67 represents consumption equal to the 7-day average (100/1.5)
 * - A score of 100 represents consumption at 150% or more of the 7-day average
 * - A score of 0 is returned for invalid data or insufficient history
 * 
 * @param history - Array of daily consumption records, ordered chronologically
 * @returns A number between 0 and 100 representing the feedback score. 
 * Returns 0 if:
 * - The history array is empty
 * - There's insufficient data (less than 8 days of history)
 * - The last day's consumption is invalid
 * - The 7-day average consumption is 0
 */
import type { DailyConsumption } from "./xpCalculator";

export function updateFeedbackScore(history: DailyConsumption[]) {
    if (history.length === 0) return 0; // Prevent empty history from causing issues
  
    // Get the last item in the history (assume it's an object and contains an 'amount' property)
    const lastDay = history.slice(-1)[0]?.amount; // Use optional chaining to avoid errors if 'amount' is missing
    if (typeof lastDay !== 'number' || isNaN(lastDay)) {
      console.error("Invalid lastDay value:", lastDay);
      return 0;
    }
  
    // Get the last 7 items, excluding the last day (the last 7 days before the last day)
    const lastSevenDays = history.slice(-8, -1); // This slices the array to get the 7 items before the last one
    if (lastSevenDays.length < 7) {
      console.error("Not enough data for a 7-day window:", lastSevenDays);
      return 0;
    }
  
    // Calculate the average consumption of the last 7 days (before the last day)
    const avgConsumption = lastSevenDays.reduce((sum, obj) => {
      const amount = obj?.amount; // Extract the 'amount' from each object
      if (typeof amount !== 'number' || isNaN(amount)) {
        console.error("Invalid value in lastSevenDays:", amount);
        return sum; // Skip invalid values
      }
      return sum + amount;
    }, 0) / lastSevenDays.length;
  
    if (avgConsumption === 0) {
      console.error("Average consumption is 0, preventing division by zero.");
      return 0; // Prevent division by zero
    }
  
    // Calculate percentage based on the last day's value vs. the average of the last 7 days
    const percentage = 100 * (lastDay / avgConsumption);
    const feedbackIndex = percentage / 1.5; // Baseline is half of the percentage. 150% of average means screaming red
    return Math.min(100, feedbackIndex);
  }