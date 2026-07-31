import { classifyTicket } from '../ticket-router';

describe('classifyTicket', () => {
  it('routes a clear IT match to the IT department', () => {
    const result = classifyTicket(
      'Cannot login to the student portal',
      'My wifi keeps disconnecting whenever I try to access my account.',
    );

    expect(result).toEqual({
      department: 'IT',
      category: 'it',
      classificationSource: 'rule-engine',
    });
  });

  it('routes a clear Finance match to the Finance department', () => {
    const result = classifyTicket(
      'Refund request for tuition overpayment',
      'Please check my invoice, I think my scholarship was not applied to the bill.',
    );

    expect(result).toEqual({
      department: 'Finance',
      category: 'finance',
      classificationSource: 'rule-engine',
    });
  });

  it('returns nulls when there is no keyword signal', () => {
    const result = classifyTicket('General question', 'The weather has been nice this week.');

    expect(result).toEqual({
      department: null,
      category: null,
      classificationSource: null,
    });
  });

  it('returns nulls on a tie between two departments', () => {
    const result = classifyTicket('Wifi and a leak', 'Not sure which team should handle this.');

    expect(result).toEqual({
      department: null,
      category: null,
      classificationSource: null,
    });
  });

  it('routes an "account" ticket to IT without a false Maintenance tie from "ac"', () => {
    const result = classifyTicket(
      'Cannot access my account',
      'I forgot my password and need help logging back into my account.',
    );

    expect(result).toEqual({
      department: 'IT',
      category: 'it',
      classificationSource: 'rule-engine',
    });
  });
});
