import { v4 as uuidv4 } from 'uuid';

export interface ShippingDetails {
  firstName: string;
  lastName: string;
  addressLine1: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export interface CheckoutSession {
  id: string;
  cartId: string;
  userId?: string;
  guestEmail?: string;
  shippingInfo?: ShippingDetails;
  shippingCost?: number;
  paymentToken?: string;
  tdsChallengeUrl?: string;
  status: 'started' | 'shipping_set' | 'payment_pending' | '3DS_CHALLENGE_PENDING' | '3DS_AUTHENTICATED' | 'completed' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

const SESSIONS_TTL_MS = 30 * 60 * 1000;

export class CheckoutSessionService {
  private sessions: Map<string, CheckoutSession> = new Map();

  public createSession(cartId: string, userId?: string): CheckoutSession {
    const now = new Date();
    const session: CheckoutSession = {
      id: uuidv4(),
      cartId,
      userId,
      status: 'started',
      createdAt: now,
      expiresAt: new Date(now.getTime() + SESSIONS_TTL_MS)
    };
    this.sessions.set(session.id, session);
    return session;
  }

  public getSession(id: string): CheckoutSession | null {
    const session = this.sessions.get(id);
    if (!session) return null;
    if (new Date() > session.expiresAt) {
      this.sessions.delete(id);
      return null;
    }
    return session;
  }

  public updateSession(id: string, updates: Partial<CheckoutSession>): CheckoutSession | null {
    const session = this.getSession(id);
    if (!session) return null;
    Object.assign(session, updates);
    return session;
  }

  public invalidateSession(id: string): void {
    this.sessions.delete(id);
  }
}
