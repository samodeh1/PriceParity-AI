=== PriceParity AI Widget ===
Contributors: priceparityai
Tags: pricing, woocommerce, purchasing power parity, localization
Requires at least: 5.8
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

== Description ==

Displays a purchasing-power price based on the visitor's location.

After activation, the widget script loads automatically on public pages. WooCommerce product prices are marked automatically. For regular WordPress pages, use the Shortcode block with:

[priceparity_price price="100"]

The plugin changes the displayed price only. It does not modify cart or checkout totals.

== Installation ==

1. Upload the `priceparity-ai` folder to `/wp-content/plugins/`, or upload a ZIP from Plugins > Add New > Upload Plugin.
2. Activate PriceParity AI Widget.
3. For WooCommerce, no additional setup is required for displayed product prices.
4. For regular WordPress pages, add a Shortcode block containing `[priceparity_price price="100"]`.
5. Configure matching discounts or server-side checkout pricing before launch.