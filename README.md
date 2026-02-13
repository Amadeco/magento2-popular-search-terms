# Magento 2 Search Terms Module

[![Latest Stable Version](https://img.shields.io/github/v/release/Amadeco/magento2-popular-search-terms)](https://github.com/Amadeco/magento2-popular-search-terms/releases)
[![License](https://img.shields.io/github/license/Amadeco/magento2-popular-search-terms)](https://github.com/Amadeco/magento2-popular-search-terms/blob/main/LICENSE)
[![Magento](https://img.shields.io/badge/Magento-2.4.x-brightgreen.svg)](https://magento.com)
[![PHP](https://img.shields.io/badge/PHP-8.3+-blue.svg)](https://www.php.net)

[SPONSOR: Amadeco](https://www.amadeco.fr)

A Magento 2 module that enhances the search experience by displaying popular search terms and personal search history. Optimizes product discovery and conversion rates by suggesting relevant terms based on both collective and individual user behaviors, all configurable from the admin and with no performance impact thanks to intelligent caching and hybrid loading.

## Features

This professional module for Magento 2 enhances the search experience by combining two powerful features:

- **Popular Search Terms**: Display the most popular search terms on your store, sorted by frequency or search date.
- **Recent Searches**: Save and display each visitor's personal search history.
- **Hybrid Loading Modes**: Choose between **Direct Injection** (best for SEO and Core Web Vitals) or **AJAX Loading** (best for Full Page Cache/Varnish environments).
- **Smart Block Caching**: Native Magento caching mechanism with configurable TTL to ensure zero database impact on frontend rendering.
- **Native LocalStorage**: Uses namespaced browser storage for instant history retrieval without dependency on Magento's `customer-data` JS sections.
- **Easy Configuration**: Fully configurable through the admin panel.
- **Customizable**: Extensive layout customization options via XML.
- **Internationalization**: Complete translations available (en_US, fr_FR).

## Screenshots

![screenshot](https://github.com/user-attachments/assets/9ed66fe2-b511-4c0e-8394-9cb9718fa182)

## Requirements

- Magento 2.4.x
- PHP 8.3+

## Installation

### Via Composer (Recommended)

```bash
composer require amadeco/module-popular-search-terms
bin/magento module:enable Amadeco_PopularSearchTerms
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento cache:clean

```

### Manual Installation

1. Download the code and extract to `app/code/Amadeco/PopularSearchTerms/`
2. Run the following commands:

```bash
bin/magento module:enable Amadeco_PopularSearchTerms
bin/magento setup:upgrade
bin/magento setup:di:compile
bin/magento cache:clean

```

## Configuration

1. Go to **Stores > Configuration > Catalog > Popular Search Terms**
2. Configure the options:
* **Enable Module**: Activate or deactivate the widget.
* **Data Loading Method**:
* *Direct*: Injects terms directly into HTML (better for SEO/LCP).
* *AJAX*: Fetches terms asynchronously (better for Varnish/FPC).


* **Number of Terms**: Number of search terms to display (Range: 1-50).
* **Max Recent Searches**: Maximum number of recent searches to save in browser history (Range: 1-10).
* **Sort Order**: Sort by popularity or recency.
* **Time Period (days)**: Number of days to look back for search terms.
* **Cache Lifetime (seconds)**: Time to cache the search terms data (e.g., 3600 for 1 hour).

## Customization

### XML Layout

The module is now deeply integrated with Magento's `jsLayout` system. You can override any configuration parameter directly in your layout XML:

```xml
<referenceContainer name="sidebar.additional">
    <block class="Amadeco\PopularSearchTerms\Block\SearchTerms"
           name="amadeco.popular.search.terms"
           template="Amadeco_PopularSearchTerms::search_terms.phtml"
           ifconfig="catalog/popular_search_terms/enabled">
        <arguments>
            <argument name="jsLayout" xsi:type="array">
                <item name="components" xsi:type="array">
                    <item name="search-terms" xsi:type="array">
                        <item name="component" xsi:type="string">Amadeco_PopularSearchTerms/js/search-terms</item>
                        <item name="config" xsi:type="array">
                            <item name="template" xsi:type="string">Amadeco_PopularSearchTerms/search-terms-template</item>
                            <item name="maxRecentSearches" xsi:type="number">5</item>
                            <item name="numberOfTerms" xsi:type="number">10</item>
                            <item name="searchFormId" xsi:type="string">search_mini_form</item>
                            <item name="searchInputName" xsi:type="string">q</item>
                            <item name="storageKey" xsi:type="string">recent-searches</item>
                        </item>
                    </item>
                </item>
            </argument>
        </arguments>
    </block>
</referenceContainer>
```

### Configuration Parameters

These parameters are available within the `config` node of the `search-terms` component:

* **max_recent_searches**: Maximum number of recent searches to display and save (default: 5).
* **number_of_terms**: Overrides the system configuration for the number of popular terms to fetch (Direct mode only).
* **search_form_id**: The HTML ID of the search form to monitor for building the history (default: "search_mini_form").
* **search_input_name**: The `name` attribute of the search input field (default: "q").
* **storage_key**: The key used in LocalStorage, prefixed by `amadeco:` (default: "recent-searches").

### Styling

The module includes LESS styles that can be overridden in your theme. The main styles are defined in:
`view/frontend/web/css/source/_module.less`.

## How it Works

1. **Popular Terms**: Uses Magento's built-in search query collection. Depending on the loading method, terms are either rendered server-side with block caching or fetched via a secure AJAX controller.
2. **Recent Searches**: Utilizes browser **LocalStorage** with a specific namespace (`amadeco:`) to persist and retrieve user history instantly.
3. **Performance**: Implements **Block Caching** with automatic cache key generation based on store ID, loading method, and sort parameters to ensure high performance.

## License

This module is licensed under the Open Software License ("OSL") v3.0. See the [LICENSE.txt](https://www.google.com/search?q=LICENSE.txt) file for details.

## Support

If you encounter any issues or have questions, please [open an issue](https://github.com/Amadeco/magento2-popular-search-terms/issues) on GitHub.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
