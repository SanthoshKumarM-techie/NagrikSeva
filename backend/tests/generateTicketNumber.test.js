import { describe, it, expect } from 'vitest';
import generateTicketNumber from '../src/utils/generateTicketNumber.js';

describe('Generate Ticket Number', () => {
  it('should generate a ticket number matching pattern BLR-YYYY-XXXX', () => {
    const currentYear = new Date().getFullYear();
    const ticket = generateTicketNumber();
    const regex = new RegExp(`^BLR-${currentYear}-[0-9]{4}$`);
    expect(ticket).toMatch(regex);
  });

  it('should generate unique values across calls', () => {
    const set = new Set();
    for (let i = 0; i < 50; i++) {
      set.add(generateTicketNumber());
    }
    // High probability of uniqueness across 50 calls in 4-digit range
    expect(set.size).toBeGreaterThan(40);
  });
});

