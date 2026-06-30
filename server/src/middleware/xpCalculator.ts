/* 
DESCRIPTION: This file contains the logic for computing points based on weekly water consumption. It accepts consumption data for a single corridor
in the form of a sorted array in descending order containing the historical daily consumption data for the corridor.
The function calculates score based on the following Logic:
1. Corridors can achieve score based on either an improvement in water usage is decreasing or proximity to a predefined "sustainable" level of water usage.
2. The trend score is calculated based on comparing moving averages over 7 and 30 days.
3. The proximity score is calculated based on the average water usage over the last 7 days compared to the baseline

UNCERTAINTIES: 
1. Assumption about difficulty of lowering water consumption: Right now, a 15% drop gives full points, which 
   might be very hard or very easy depending on the corrior's habits, time of year and variance in daily usage.
   Therefore, the improvement score tiers are stored in a config array, so non-devs can tweak them without code changes. 
2. Right now, corridors only get max points for proximity if they are exactly at the "sutainable" level, which might be a bit harsh.
_____________________________________________________________________________________________________________________ */

//Earlier input, not currently used but kept if necessary in the future
export interface ConsumptionHistory {
  corridor: number;
  history: DailyConsumption[];
}

//Currently uses Input:
export interface DailyConsumption {
    date: string;
    amount: number; // in liters
  }

  
  //Improvement score tier config. Current tier config is: less than 5% drop = 10 points, 5% = 25 points, 10% = 50 points, 15% = 100 points:
  
  const improvementScoreMap = [
    {min: 1, score: 10},
    {min: 1.05, score: 25},
    {min: 1.10, score: 50},
    {min: 1.15, score: 100},
  ];
  
  //Max score and sustainable level config:
  const maxScore = 100;
  const sustainableLevel = 100; // in liters
  
  //Points calculation Logic:
  
  export function calculateScore(userHistory: DailyConsumption[]): number {
    const last30Days = userHistory.slice(-30);
    const last7Days = last30Days.slice(-7);
  
    // Check if loaded data is valid (must be at least 30 days)
    if (last30Days.length < 30 || last7Days.length < 7) {
      console.error("Insufficient data to calculate score. Expected 30 days of data, got " + last30Days.length + 
                    " days. Expected 7 days of data, got " + last7Days.length + " days.");
      return 0;
    }
  
    const avg7 = last7Days.reduce((sum, day) => sum + day.amount, 0) / last7Days.length;
    const avg30 = last30Days.reduce((sum, day) => sum + day.amount, 0) / last30Days.length;
    console.log('Average 30: ', avg30) 
    console.log('Average 7: ', avg7);
    console.log('_________');

    const trendQuote = avg30 / avg7; // >1 means consumption has dropped, <1 means consumption has increased
    console.log('Trendquote: ', trendQuote);
    console.log('_________');
  
    // Logic for calculating trend score. If consumption has not decreased, score is 0.
    let improvementScore = 0;
    if (trendQuote > 1) {
      for (let i = improvementScoreMap.length - 1; i >= 0; i--) {
        if (trendQuote >= improvementScoreMap[i].min) {
          improvementScore = improvementScoreMap[i].score;
          break;
        }
      }
    }
  
    // Logic for calculating score based on proximity to sustainable level.
    let proximityCoefficient = 1 - (2 * (avg7 - sustainableLevel)) / sustainableLevel; // Coefficient is 1 if avg7 == sustainableLevel and decreases linearly to 0 as avg7 approaches 1.5 * baseline
    proximityCoefficient = Math.min(1, Math.max(0, proximityCoefficient)); // Coefficient is capped between 0 and 1
    let proximityScore = Math.round(proximityCoefficient * maxScore); // Score is coefficient * maximum possible score 
    
    console.log('Improvementscore: ', improvementScore);
    console.log('Proximityscore: ', proximityScore);

    // Final score
    const score = Math.min(maxScore, Math.max(improvementScore, proximityScore)); // Score is capped at 100, otherwise takes the higher of trend- or proximity score
  
    return score;
  
  }

  