/* 
DESCRIPTION: This file contains the logic for converting raw data from the Cubicmeter IoT devices into the "DailyConsumption" 
interface format or into the "HourlyConsumption" format. DailyConsumption is the vaild input for the waterXPCalculator, Hourly is for 
the data visualization graphs in the frontend. 
The functions take raw data as input and returns an array of "DailyConsumption" and "HourlyConsumption" objects respectively. The 
algorithm is to group the raw data readings by date or by hour.


// NOTE: This implementation of convertToHourlyConsumption contains a known ambiguity related to daylight saving time (DST).
// During the fall DST transition (typically around 31 Oct in CET), the local hour between 02:00–02:59 
// occurs twice. As a result, readings during that overlap may be grouped together, even though they 
// occurred in separate actual hours. This is deemed acceptable for the current application context.

_____________________________________________________________________________________________________________________ */

import type { DailyConsumption } from './xpCalculator';

//Inputs:
export interface RawReading {
  id: number,
  room: string,
  type: string,
  amount: number,
  timestamp: string | Date // ISO format e.g. "2025-04-30T16:19:01:018Z"
}

export interface HourlyConsumption {
  hour: string, // YYYY-MM-DD-HH:00:00
  amount: number // in liters
}

export function convertToDailyConsumption(rawData: RawReading[]): DailyConsumption[] {
    
  
  const dailyTotals = new Map<string, number>(); // Map to temporarily store key-value pairs of dates and consumption in liters

  for (const entry of rawData) {
    const isoDate = typeof entry.timestamp === 'string' //ensure date value is of type string 
      ? entry.timestamp 
      : entry.timestamp.toISOString();
    
    const date = isoDate.split('T')[0]; // Extract date part from timestamp

    const prevAmount = dailyTotals.get(date) || 0; // Check if the date already exists in the map and if so, fetch the current registered liters consumed
    dailyTotals.set(date, Number(prevAmount) + Number(entry.amount)); // Update the total amount for each date, or insert a new entry for the date if it doesn't exist in the map yet 
  }

  // Convert map to sorted array of DailyConsumption objects in ascending order of date
  const history: DailyConsumption[] = Array.from(dailyTotals.entries()).map(([date, amount]) => ({date, amount}));
  history.sort((a, b) => a.date.localeCompare(b.date)); //AI magic


  return history

}

export function convertToHourlyConsumption(rawData: RawReading[]): HourlyConsumption[] {
  
  const hourlyTotals = new Map<string, number>(); // Map to temporarily store key-value pairs of hours and consumption in liters
  console.log("Converting raw data to hourly consumption...");
  // 15 rows below are for pre-populating the map with entries for the past 24 hours 
  const oneHourInMs = 60 * 60 * 1000;
  const now = new Date();
  now.setMinutes(0, 0, 0);
  const past24Hours: Date[] = [];
  
  for (let i = 23; i >= 0; i--) {
    const hourAgo = new Date(now.getTime() - i * oneHourInMs)
    const year = hourAgo.getFullYear();
    const month = pad(hourAgo.getMonth() + 1); //getMonth returns 0-based values so they must be incremented by 1
    const day = pad(hourAgo.getDate());
    const hour = pad(hourAgo.getHours()); //getHours() converts raw data UTC time into local time
    
    const mapEntry = `${year}-${month}-${day} ${hour}:00:00`;
    hourlyTotals.set(mapEntry, 0);

  }

  for (const entry of rawData) {
    try {
      const timestamp = typeof entry.timestamp === 'string' ? new Date(entry.timestamp) : entry.timestamp;

      //adjust timestamp forward by one hour, e.g timestamp 06.00 shows water consumption during 05.00 - 05:59.
      const adjustedTimestamp = new Date(timestamp.getTime());
      
      adjustedTimestamp.setTime(adjustedTimestamp.getTime() + oneHourInMs);

      const year = adjustedTimestamp.getFullYear();
      const month = pad(adjustedTimestamp.getMonth() + 1); //getMonth returns 0-based values so they must be incremented by 1
      const day = pad(adjustedTimestamp.getDate());
      const hour = pad(adjustedTimestamp.getHours()); //getHours() converts raw data UTC time into local time

      const date = `${year}-${month}-${day} ${hour}:00:00`;

      const prevAmount = hourlyTotals.get(date) || 0; //Check for currently registered amount in the map for this hour, default to 0 
      hourlyTotals.set(date, Number(prevAmount) + Number(entry.amount)); // Update the total amount for each hour, or insert a new entry for the hour if it doesn't exist in the map yet 

    } catch(err) {
      console.log("Error converting raw data into hourly consumption: ", err);
      throw new Error("Could not create date objects from date values in database");
    }
  }

  //Convert map into sorted array with the past 24 hours water consumption, latest hour at the end of the array.
  const history: HourlyConsumption[] = Array.from(hourlyTotals.entries()).map(([hour, amount]) => ({hour, amount}));
  history.sort((a, b) => a.hour.localeCompare(b.hour));
  const last24Hours = history.slice(-24); 

  return last24Hours

}

//Helper function for padding months and hours with zeros if needed:

function pad(n:number): string {
  return n < 10 ? '0' + n : n.toString();
}


