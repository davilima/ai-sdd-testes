import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { CheckoutService } from './checkout.service.js';
import { CheckoutSessionService } from './session.service.js';
import { CartService, ProductService } from './external-services.mock.js';

describe('CheckoutService - Cart Re-validation', () => {
  let checkoutService: CheckoutService;
  let sessionService: CheckoutSessionService;
  let cartService: CartService;
  let productService: ProductService;

  beforeEach(() => {
    sessionService = new CheckoutSessionService();
    cartService = new CartService();
    productService = new ProductService();
    checkoutService = new CheckoutService(sessionService, cartService, productService);
  });

  it('should successfully start checkout for a valid cart with available stock', async () => {
    const session = await checkoutService.startCheckout('valid-cart', 'user-1');
    expect(session).toBeDefined();
    expect(session.cartId).toBe('valid-cart');
    expect(session.status).toBe('started');
  });

  it('should throw an error if the cart is not found', async () => {
    await expect(checkoutService.startCheckout('invalid-cart'))
      .rejects.toThrow('Cart is empty or not found');
  });

  it('should throw an error if a product is out of stock', async () => {
    // 'out-of-stock-cart' contém 'prod-out-of-stock' com inventory: 0
    await expect(checkoutService.startCheckout('out-of-stock-cart'))
      .rejects.toThrow('Product No Stock is out of stock');
  });

  it('should demonstrate ignoring client prices by using master prices (conceptual check)', async () => {
    // O mock 'valid-cart' tem o prod-1 com preço 90.00 (desconto fake no cliente)
    // O master database (ProductService) tem prod-1 com preço 100.00.
    // O startCheckout apenas passa se a validação contra o Master passar.
    const session = await checkoutService.startCheckout('valid-cart');
    expect(session).toBeDefined();
    
    // Verificamos se o getProduct foi chamado para garantir que a validação mestre ocorreu
    const spy = jest.spyOn(productService, 'getProduct');
    await checkoutService.startCheckout('valid-cart');
    expect(spy).toHaveBeenCalledWith('prod-1');
  });
});
