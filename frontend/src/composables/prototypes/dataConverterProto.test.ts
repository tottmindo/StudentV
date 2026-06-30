import { describe, it, expect } from 'vitest';
import { convertToDailyConsumption } from './dataConverterProto';
import type { DailyConsumption, ConsumptionHistory } from './pointsPrototype';

describe('convertToDailyConsumption', () => {

  it('should return daily history in ascending date order', () => {

    const rawData = [
      { id: 3, room: 'C1', type: 'cold', amount: 30, timestamp: '2025-04-05T12:00:00Z', dorm_id: 1 },
      { id: 2, room: 'C1', type: 'cold', amount: 20, timestamp: '2025-05-07T12:00:00Z', dorm_id: 1 },
      { id: 1, room: 'C1', type: 'hot', amount: 10, timestamp: '2025-04-03T12:00:00Z', dorm_id: 1 },
    ];

    const result = convertToDailyConsumption(rawData);

    const dates = result.history.map(day => day.date);

    expect(dates).toEqual(['2025-04-03', '2025-04-05', '2025-05-07']);
  });


});