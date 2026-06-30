import { describe, it, expect } from 'vitest';
import { calculateScore } from './pointsPrototype';
import type { DailyConsumption, ConsumptionHistory } from './pointsPrototype';

describe('calculateScore', () => {

  it('gives max score for 15% improvement', () => {

    const history = Array.from({ length: 30 }, (_, i) => ({ //Don't ask, this is AI magic
      date: `2024-04-${i + 1}`,
      amount: i < 23 ? 100 : 85 // last 7 days = lower consumption
    }));

    const input = { corridor: 1, history };

    const result = calculateScore(input);

    expect(result).toBe(100);
  });

  it('gives no score for no improvement and hight consumption', () => {

    const input: ConsumptionHistory = {
      corridor: 1,
      history: generateMockData({
        days: 30,
        startAmount: 150,
        endAmount: 150
      })
  };

  const result = calculateScore(input);

  expect(result).toBe(0);
  });

  it('gives high score for no improvement but close to baseline', () => {

    const input: ConsumptionHistory = {
      corridor: 1,
      history: generateMockData({
        days: 30,
        startAmount: 105,
        endAmount: 105
      })
  };

  const result = calculateScore(input);

  expect(result).toBe(90);
  });

  it('gives max score for no improvement but below baseline', () => {

    const input: ConsumptionHistory = {
      corridor: 1,
      history: generateMockData({
        days: 30,
        startAmount: 99,
        endAmount: 99
      })
  };

  const result = calculateScore(input);

  expect(result).toBe(100);
  });

});

function generateMockData({ days, startAmount, endAmount }: {days: number, startAmount: number, endAmount: number}): DailyConsumption[] {
  const history: DailyConsumption[] = [];
  const step = (endAmount - startAmount) / (days - 1);
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() - (days - 1 - i));

    history.push({
      date: date.toISOString().split('T')[0],
      amount: parseFloat((startAmount + step * i).toFixed(2))
    });
    
  }

  return history;

}
