<?php
/**
 * Plugin Name: PriceParity AI Widget
 * Description: Displays purchasing-power prices for WooCommerce products and WordPress shortcode price markers.
 * Version: 1.0.0
 * Author: PriceParity AI
 * License: GPL-2.0-or-later
 */

if (!defined('ABSPATH')) {
    exit;
}

define('PRICEPARITY_AI_WIDGET_URL', 'https://priceparity-api-live.onrender.com/api/widget');

function priceparity_ai_enqueue_widget() {
    if (is_admin()) {
        return;
    }

    wp_enqueue_script(
        'priceparity-ai-widget',
        PRICEPARITY_AI_WIDGET_URL,
        array(),
        null,
        true
    );
}
add_action('wp_enqueue_scripts', 'priceparity_ai_enqueue_widget');

function priceparity_ai_shortcode($attributes) {
    $attributes = shortcode_atts(
        array('price' => ''),
        $attributes,
        'priceparity_price'
    );

    $price = filter_var($attributes['price'], FILTER_VALIDATE_FLOAT);
    if ($price === false || $price <= 0) {
        return '';
    }

    return '<span data-pp-price="' . esc_attr(number_format((float) $price, 2, '.', '')) . '"></span>';
}
add_shortcode('priceparity_price', 'priceparity_ai_shortcode');

function priceparity_ai_woocommerce_price_marker($price_html, $product) {
    if (!$product || !is_a($product, 'WC_Product')) {
        return $price_html;
    }

    $base_price = $product->get_regular_price();
    if ($base_price === '') {
        $base_price = $product->get_price();
    }

    $base_price = filter_var($base_price, FILTER_VALIDATE_FLOAT);
    if ($base_price === false || $base_price <= 0) {
        return $price_html;
    }

    $marker = '<span class="priceparity-ai-marker" data-pp-price="' . esc_attr(number_format((float) $base_price, 2, '.', '')) . '"></span>';
    return $price_html . $marker;
}
add_filter('woocommerce_get_price_html', 'priceparity_ai_woocommerce_price_marker', 10, 2);
