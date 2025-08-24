import { daysSince } from './dates';

describe('daysSince', () => {
  test('returns 0 for today', () => {
    const today = new Date();
    expect(daysSince(today)).toBe(0);
  });

  test('returns 7 for one week ago', () => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    expect(daysSince(oneWeekAgo)).toBe(7);
  });

  test('returns 30 for one month ago', () => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    expect(daysSince(oneMonthAgo)).toBe(30);
  });
});
