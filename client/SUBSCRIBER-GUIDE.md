# PriceParity AI Subscriber Guide

Use this guide to show purchasing-power prices on your website and keep the amount shown by PriceParity consistent with the amount charged by your payment gateway.

## Important: what the script does

The script detects the visitor's country from their IP address and changes the content of elements marked with `data-pp-price`. It displays a localized price; it does not automatically change a Stripe, Paystack, Paddle, Gumroad, Shopify, or other checkout.

Your checkout must use the same tier rules as the widget:

| PriceParity tier | Discount |         Amount charged |
| ---------------- | -------: | ---------------------: |
| `NONE`           |       0% | 100% of original price |
| `LOW`            |      20% |  80% of original price |
| `MID`            |      50% |  50% of original price |
| `HIGH`           |      70% |  30% of original price |

## 1. Add the price marker

Replace `100` with the normal price in your base currency. Add the marker anywhere the localized price should appear.

```html
<span data-pp-price="100"></span>
```

You can use more than one marker on the same page:

```html
<div class="product-price">
  <span data-pp-price="49"></span>
</div>
```

The value in `data-pp-price` must be a positive number and should be the same base price used by your checkout.

## 2. Add the one-line script

Paste this once before the closing `</body>` tag. Do not add it once per price.

```html
<script src="https://priceparity-api-live.onrender.com/api/widget"></script>
```

Publish the page and confirm that the marker is replaced by a localized price.

## 3. Create gateway discounts

Create three discounts in your payment gateway. The names can be different, but the percentages must match:

```text
LOW  = 20% off
MID  = 50% off
HIGH = 70% off
```

Example subscriber-owned codes:

```text
LOW  -> MYSHOP20
MID  -> MYSHOP50
HIGH -> MYSHOP70
```

Do not use the PriceParity AI codes in your own store. Use codes created in your own gateway account.

## 4. Connect checkout to the same tier

The widget and checkout must receive the same country/tier decision. Use one of these approaches:

### Recommended: server-side checkout

1. Your server receives the checkout request.
2. Your server detects the visitor IP country.
3. Your server maps the country to `NONE`, `LOW`, `MID`, or `HIGH`.
4. Your server calculates the final amount or selects the matching gateway coupon.
5. Your server creates the checkout session.
6. Redirect the customer to the returned checkout URL.

Never trust a discount tier sent only by browser JavaScript. The customer can edit browser requests.

### Gateway coupon approach

Use your gateway's server-side API or checkout-link feature:

```text
NONE -> normal checkout
LOW  -> your 20% coupon
MID  -> your 50% coupon
HIGH -> your 70% coupon
```

### Direct amount approach

If your gateway supports custom amounts, charge the calculated amount instead of applying a coupon:

```text
final amount = original amount * tier multiplier
NONE multiplier = 1.0
LOW  multiplier = 0.8
MID  multiplier = 0.5
HIGH multiplier = 0.3
```

Use either a reduced amount or a coupon, not both, or the customer may receive a double discount.

## 5. Gateway notes

### Lemon Squeezy

Use a checkout link or create a checkout through the Lemon Squeezy API. Pass the discount code in `checkout_data.discount_code` when creating the checkout. Keep the API key on your server, never in the page script.

### Stripe

Use Stripe Checkout, Payment Links, or a server-created Checkout Session. Apply the matching promotion code or calculate the amount server-side. Do not expose Stripe secret keys in HTML or client JavaScript.

### Paystack

Initialize the transaction on your server with the final amount in the smallest currency unit. Verify the transaction on your server before granting access or marking an order as paid.

### Paddle

Create the checkout using Paddle's supported client or server integration. Apply a Paddle discount or final amount according to the tier. Confirm the final transaction with Paddle webhooks.

### Gumroad

Use separate product or checkout links with the appropriate coupon configuration, or use a server-side integration if your Gumroad setup supports it. Confirm that each link produces the same amount shown by the widget.

### Shopify

Use Shopify discount URLs, automatic discounts, Shopify Functions, or a custom app depending on your store plan. Do not rely on changing visible text alone: the Shopify checkout must apply the same discount or price rule.

## 6. Test that the amounts tally

Test every tier before sending customers to the page:

1. Use a test visitor location from a `HIGH` country and confirm the widget shows 30% of the base amount.
2. Confirm checkout applies your 70% coupon or charges 30% of the base amount.
3. Repeat for `MID`: checkout should charge 50%.
4. Repeat for `LOW`: checkout should charge 80%.
5. Test a `NONE` country: checkout should charge the normal amount.
6. Check taxes, currency conversion, rounding, shipping, and gateway fees separately.
7. Test on mobile and in a private browser window.
8. Remove test-country overrides before production launch.

For a base price of `100`, the expected pre-tax totals are:

```text
NONE = 100
LOW  = 80
MID  = 50
HIGH = 30
```

## 7. Common problems

### The widget price is different from checkout

The checkout is using a different tier, coupon, currency conversion rate, or rounding rule. Make the checkout use the same server-side decision as the widget.

### The discount says invalid

Check that the code exists in your own gateway account, is active, applies to the selected product or variant, and has not expired or reached its usage limit.

### Everyone sees the same country

Check that your server receives the real visitor IP through your hosting proxy. Do not treat a local development IP as a real country. Test from real networks or use a temporary test-country feature only during testing.

### The script does not change the price

Confirm that the marker contains a numeric value, the script is loaded once, and the browser can reach:

```text
https://priceparity-api-live.onrender.com/api/widget
```

## Recommended wording for your customers

> PriceParity AI displays a purchasing-power price based on the visitor's location. Your payment gateway remains responsible for charging the customer. To keep both amounts consistent, configure your gateway's 20%, 50%, and 70% discounts and connect checkout to the same tier rules before going live.
