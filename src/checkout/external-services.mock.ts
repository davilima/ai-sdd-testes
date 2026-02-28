export interface Product { id: string; name: string; price: number; inventory: number; }
export interface CartItem { productId: string; quantity: number; priceAtAddition: number; }
export interface Cart { id: string; items: CartItem[]; }

export class ProductService {
  private products: Map<string, Product> = new Map([
    ['prod-1', { id: 'prod-1', name: 'Product 1', price: 100.00, inventory: 10 }],
    ['prod-2', { id: 'prod-2', name: 'Product 2', price: 50.00, inventory: 5 }]
  ]);
  public async getProduct(id: string): Promise<Product | null> { return this.products.get(id) || null; }
}

export class CartService {
  public async getCart(id: string): Promise<Cart | null> {
    if (id === 'valid-cart') return { id: 'valid-cart', items: [{ productId: 'prod-1', quantity: 2, priceAtAddition: 100.00 }] };
    return null;
  }
}

export class AuthService {
  private registeredEmails = new Set(['user1@example.com']);
  public async isEmailRegistered(email: string): Promise<boolean> { return this.registeredEmails.has(email.toLowerCase()); }
}

export class ShippingService {
  public async calculateShipping(zipCode: string): Promise<number> {
    return zipCode.startsWith('0') ? 10.00 : 25.00;
  }
}

export class PaymentGateway {
  public async authorize(token: string): Promise<{ success: boolean, requires3DS?: boolean, challengeUrl?: string }> {
    if (token === 'token-3ds') return { success: false, requires3DS: true, challengeUrl: 'https://bank.com/3ds' };
    if (token === 'token-fail') return { success: false };
    return { success: true };
  }
}

export class OrderService {
  public async createOrder(data: any): Promise<string> { return `ORD-${Math.floor(Math.random() * 10000)}`; }
}

export class NotificationService {
  public async sendSMS(phone: string, message: string): Promise<boolean> {
    console.log(`[Twilio SMS to ${phone}]: ${message}`);
    return true;
  }
}
