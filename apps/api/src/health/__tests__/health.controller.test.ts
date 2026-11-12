import { describe, it, expect, beforeEach } from 'vitest';
import { HealthController } from '../health.controller';

describe('HealthController', () => {
  let healthController: HealthController;

  beforeEach(() => {
    healthController = new HealthController();
  });

  it('should return status ok with service details', () => {
    const response = healthController.getHealth();

    expect(response).toBeDefined();
    expect(response.status).toBe('ok');
    expect(response.service).toBe('FeedbackHub API Gateway');
    expect(response.version).toBe('0.1.0');
    expect(typeof response.uptimeSeconds).toBe('number');
    expect(typeof response.timestamp).toBe('string');
    expect(response.environment).toBeDefined();
  });

  it('timestamp should be a valid ISO string', () => {
    const response = healthController.getHealth();
    const date = new Date(response.timestamp);
    expect(date.toISOString()).toBe(response.timestamp);
  });
});
