import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CheckoutService } from './checkout.service.js';
import { CheckoutSessionService } from './session.service.js';
import { CartService, ProductService, AuthService } from './external-services.mock.js';

/**
 * Testes para a Tarefa 2.1: Implement Authentication Strategy for Checkout.
 * Mapeado conforme Requirements 1.1, 1.2, 2.1 e 2.2.
 */
describe('CheckoutService - Task 2.1 (Auth Strategy)', () => {
  let checkoutService: CheckoutService;
  let sessionService: CheckoutSessionService;
  let cartService: CartService;
  let productService: ProductService;
  let authService: AuthService;

  beforeEach(() => {
    sessionService = new CheckoutSessionService();
    cartService = new CartService();
    productService = new ProductService();
    authService = new AuthService();
    checkoutService = new CheckoutService(sessionService, cartService, productService, authService);
  });

  describe('Guest Checkout Flow (Req 2.1, 2.2)', () => {
    it('should allow a guest user to provide their email to proceed (Req 2.1)', async () => {
      // Setup: Inicia checkout anônimo
      const session = await checkoutService.startCheckout('valid-cart');
      
      // Action: Define e-mail de convidado
      const { session: updated } = await checkoutService.setGuestEmail(session.id, 'new-guest@example.com');
      
      // Assert
      expect(updated.guestEmail).toBe('new-guest@example.com');
      expect(updated.userId).toBeUndefined();
    });

    it('should suggest logging in if email is already registered but allow proceeding (Req 2.2)', async () => {
      // Setup: 'registered@test.com' está no mock de e-mails registrados
      const session = await checkoutService.startCheckout('valid-cart');
      
      // Action
      const { alertMessage, session: updated } = await checkoutService.setGuestEmail(session.id, 'registered@test.com');
      
      // Assert
      expect(alertMessage).toContain('belongs to a registered account');
      expect(updated.guestEmail).toBe('registered@test.com'); // Permite prosseguir mesmo com alerta
    });
  });

  describe('Registered User Flow (Req 1.2)', () => {
    it('should bypass auth choice if user is already authenticated (Req 1.2)', async () => {
      // Setup: Inicia checkout já logado
      const session = await checkoutService.startCheckout('valid-cart', 'user-123');
      
      // Action & Assert: Tentar definir e-mail de convidado deve falhar pois ele já está autenticado
      await expect(checkoutService.setGuestEmail(session.id, 'guest@test.com'))
        .rejects.toThrow('User already authenticated');
      
      expect(session.userId).toBe('user-123');
      expect(session.guestEmail).toBeUndefined();
    });
  });

  describe('Edge Cases & Security', () => {
    it('should throw an error if trying to set guest email for a non-existent session', async () => {
      await expect(checkoutService.setGuestEmail('invalid-uuid', 'test@test.com'))
        .rejects.toThrow('Session not found');
    });

    it('should ensure guestEmail is not persisted across different sessions', async () => {
      const session1 = await checkoutService.startCheckout('valid-cart');
      await checkoutService.setGuestEmail(session1.id, 'guest1@test.com');
      
      const session2 = await checkoutService.startCheckout('valid-cart');
      expect(session2.guestEmail).toBeUndefined();
    });
  });
});
