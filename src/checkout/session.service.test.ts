import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CheckoutSessionService } from './session.service.js';

describe('CheckoutSessionService', () => {
  let service: CheckoutSessionService;

  beforeEach(() => {
    service = new CheckoutSessionService();
  });

  it('should create a new checkout session with UUID v4', () => {
    const session = service.createSession('cart-123', 'user-456');
    expect(session.id).toBeDefined();
    expect(session.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(session.cartId).toBe('cart-123');
    expect(session.userId).toBe('user-456');
    expect(session.status).toBe('started');
  });

  it('should retrieve an active session', () => {
    const created = service.createSession('cart-123');
    const retrieved = service.getSession(created.id);
    expect(retrieved).toEqual(created);
  });

  it('should return null for expired sessions', () => {
    jest.useFakeTimers();
    const session = service.createSession('cart-123');
    
    // Avança o tempo em 31 minutos
    jest.advanceTimersByTime(31 * 60 * 1000);
    
    expect(service.getSession(session.id)).toBeNull();
    jest.useRealTimers();
  });

  it('should update session status correctly', () => {
    const session = service.createSession('cart-123');
    service.updateStatus(session.id, 'shipping_set');
    const updated = service.getSession(session.id);
    expect(updated?.status).toBe('shipping_set');
  });

  it('should invalidate a session', () => {
    const session = service.createSession('cart-123');
    service.invalidateSession(session.id);
    expect(service.getSession(session.id)).toBeNull();
  });
});
