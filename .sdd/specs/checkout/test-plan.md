# Test Plan - Checkout Feature

## 1. Overview
This test plan defines the strategy, test cases, and pass/fail criteria for the Checkout feature. The goal is to ensure high quality, security, and performance (< 3s response time) for both Guest and Registered user flows.

## 2. Test Strategy

| Type | Scope | Target |
|------|-------|--------|
| **Unit Tests** | Individual functions/classes | Session logic, Price re-validation, 3DS state gating. |
| **Integration Tests** | Service-to-service communication | CheckoutService ↔ PaymentGateway, Twilio SMS. |
| **E2E Tests** | Full user journeys | Guest Checkout Flow, Registered User Checkout Flow. |
| **Security Tests** | Vulnerability assessment | IDOR prevention, PCI compliance (tokenization). |
| **Performance Tests** | Latency & Throughput | Response time under load for parallel service calls. |

## 3. Test Cases

### 3.1 Authentication & Entry (Req 1.x)
- **TC-1.1**: Verify that an anonymous user is prompted with login/guest options upon initiating checkout.
- **TC-1.2**: Verify that an authenticated user bypasses the auth choice and proceeds to shipping.
- **TC-1.3**: Verify session expiration (30-minute timeout) redirects user back to start.

### 3.2 Guest Checkout (Req 2.x)
- **TC-2.1**: Verify successful checkout with new guest email and shipping details.
- **TC-2.2**: Verify account suggestion alert when a guest enters a registered email address.
- **TC-2.3**: Verify that guest data (PII) is masked in application logs.

### 3.3 Registered User Checkout (Req 3.x)
- **TC-3.1**: Verify pre-filling of saved shipping addresses for authenticated users.
- **TC-3.2**: Verify automatic shipping cost update when a saved address is selected.

### 3.4 Payment & 3D Secure (Req 4.x, 5.x)
- **TC-4.1**: Verify successful payment using a secure payment token.
- **TC-4.2**: Verify 3DS challenge redirection when triggered by the bank.
- **TC-4.3**: Verify order creation is BLOCKED if 3DS challenge is bypassed or cancelled.
- **TC-4.4**: Verify idempotent behavior: retrying a payment confirmation does not result in double charging.

### 3.5 Fulfillment & Notifications (Req 6.x)
- **TC-5.1**: Verify that a unique Order ID is generated upon successful completion.
- **TC-5.2**: Verify that an SMS confirmation is sent via Twilio (async) containing the Order ID.
- **TC-5.3**: Verify that SMS failure does not block the checkout success page.

### 3.6 Performance & Security
- **TC-6.1**: Verify critical path response time is < 3 seconds using parallel service orchestration.
- **TC-6.2**: Verify that changing item prices in the local cart does not affect the final checkout price (Server-side validation).
- **TC-6.3**: Verify that a user cannot access or modify a checkout session belonging to another user (IDOR check).

## 4. Requirements Traceability Matrix

| Requirement ID | Test Case(s) |
|----------------|--------------|
| 1.1            | TC-1.1       |
| 1.2            | TC-1.2       |
| 2.1            | TC-2.1       |
| 2.2            | TC-2.2       |
| 3.1            | TC-3.1       |
| 3.2            | TC-3.2       |
| 4.1            | TC-4.1, TC-6.2|
| 5.1, 5.2       | TC-4.2, TC-4.3|
| 6.1, 6.2       | TC-5.2       |

## 5. Pass/Fail Criteria
- **Pass**: 100% of P0 (Critical) and P1 (High) test cases pass. Response time < 3s.
- **Fail**: Any P0 security vulnerability found or critical flow (payment/order creation) failure.
