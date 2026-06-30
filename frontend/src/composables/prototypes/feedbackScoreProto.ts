// feedbackScore based on last days consumtion vs. average of last 7 days. argument should be of type DailyConsumption[]

import type { DailyConsumption } from "./pointsPrototype";

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