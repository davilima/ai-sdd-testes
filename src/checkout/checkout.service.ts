import { type CheckoutSession, type ShippingDetails, CheckoutSessionService } from './session.service.js';
import { CartService, ProductService, AuthService, ShippingService, PaymentGateway, OrderService, NotificationService } from './external-services.mock.js';

export class CheckoutError extends Error {
  constructor(public message: string, public code: string) {
    super(message);
  }
}

export class CheckoutService {
  constructor(
    private sessionService: CheckoutSessionService,
    private cartService: CartService,
    private productService: ProductService,
    private authService: AuthService,
    private shippingService: ShippingService,
    private paymentGateway: PaymentGateway,
    private orderService: OrderService,
    private notificationService: NotificationService
  ) {}

  public async startCheckout(cartId: string, userId?: string): Promise<CheckoutSession> {
    const cart = await this.cartService.getCart(cartId);
    if (!cart || cart.items.length === 0) throw new CheckoutError('Cart is empty', 'EMPTY_CART');

    // TAREFA 5.1 (P): Chamadas paralelas para validação e busca de preços
    await Promise.all(cart.items.map(async (item) => {
      const product = await this.productService.getProduct(item.productId);
      if (!product) throw new CheckoutError(`Product ${item.productId} not found`, 'NOT_FOUND');
      if (product.inventory < item.quantity) throw new CheckoutError(`Out of stock: ${product.name}`, 'OUT_OF_STOCK');
    }));

    return this.sessionService.createSession(cartId, userId);
  }

  public async setGuestEmail(sessionId: string, email: string): Promise<{ session: CheckoutSession, alertMessage?: string }> {
    const session = this.sessionService.getSession(sessionId);
    if (!session || session.userId) throw new CheckoutError('Invalid session for guest', 'INVALID_SESSION');
    
    const isRegistered = await this.authService.isEmailRegistered(email);
    const updated = this.sessionService.updateSession(sessionId, { guestEmail: email })!;
    return { session: updated, alertMessage: isRegistered ? 'Email registered, consider login' : undefined };
  }

  // TAREFA 2.2: Informações de Entrega e Frete
  public async setShippingInfo(sessionId: string, info: ShippingDetails): Promise<CheckoutSession> {
    const session = this.sessionService.getSession(sessionId);
    if (!session) throw new CheckoutError('Session not found', 'NOT_FOUND');

    const shippingCost = await this.shippingService.calculateShipping(info.zipCode);
    const updated = this.sessionService.updateSession(sessionId, {
      shippingInfo: info,
      shippingCost,
      status: 'shipping_set'
    })!;
    return updated;
  }

  // TAREFA 3.1 & 3.2: Pagamento e 3DS
  public async processPayment(sessionId: string, paymentToken: string): Promise<{ session: CheckoutSession, orderId?: string }> {
    const session = this.sessionService.getSession(sessionId);
    if (!session || session.status !== 'shipping_set') throw new CheckoutError('Invalid status', 'INVALID_STATUS');

    const result = await this.paymentGateway.authorize(paymentToken);
    
    if (result.requires3DS) {
      const updated = this.sessionService.updateSession(sessionId, {
        status: '3DS_CHALLENGE_PENDING',
        tdsChallengeUrl: result.challengeUrl,
        paymentToken
      })!;
      return { session: updated };
    }

    if (!result.success) throw new CheckoutError('Payment failed', 'PAYMENT_FAILED');

    // TAREFA 4.1 & 4.2: Finalização e Notificação
    return this.finalizeOrder(sessionId);
  }

  public async finalize3DS(sessionId: string, tdsToken: string): Promise<{ session: CheckoutSession, orderId: string }> {
    const session = this.sessionService.getSession(sessionId);
    if (!session || session.status !== '3DS_CHALLENGE_PENDING') throw new CheckoutError('Invalid status', 'INVALID_STATUS');

    // Em um cenário real, validaria o tdsToken com o Gateway
    const updated = this.sessionService.updateSession(sessionId, { status: '3DS_AUTHENTICATED' })!;
    return this.finalizeOrder(sessionId);
  }

  private async finalizeOrder(sessionId: string): Promise<{ session: CheckoutSession, orderId: string }> {
    const session = this.sessionService.getSession(sessionId)!;
    const orderId = await this.orderService.createOrder(session);
    
    this.sessionService.updateSession(sessionId, { status: 'completed' });
    
    // TAREFA 4.2: Notificação Assíncrona via Twilio
    const phone = session.shippingInfo?.phone || '';
    if (phone) {
      this.notificationService.sendSMS(phone, `Order ${orderId} confirmed! Thank you.`)
        .catch(err => console.error('SMS notification failed', err));
    }

    const finalSession = this.sessionService.getSession(sessionId)!;
    return { session: finalSession, orderId };
  }
}
