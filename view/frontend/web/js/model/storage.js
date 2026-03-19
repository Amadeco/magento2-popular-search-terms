/**
 * Amadeco PopularSearchTerms Module
 *
 * @category    Amadeco
 * @package     Amadeco_PopularSearchTerms
 * @author      Ilan Parmentier
 * @copyright   Copyright (c) Amadeco (https://www.amadeco.fr)
 * @license     OSL-3.0
 */
define([
    'jquery',
    'underscore',
    'jquery/jquery-storageapi'
], function ($, _) {
    'use strict';

    /**
     * Storage Model for managing recent user searches.
     * Utilizes Magento's jQuery Storage API wrapper for namespaced LocalStorage,
     * ensuring safe, JSON-parsed data retrieval without manual stringification.
     *
     * @api
     */
    return {
        /**
         * @property {Object} defaults - Default configuration parameters.
         * @property {String} defaults.storageKey - The key used within the namespace to store searches.
         * @property {String} defaults.formId - The default HTML ID of the Magento search form.
         * @property {String} defaults.inputName - The default name attribute of the search input field.
         * @property {String} defaults.namespace - The namespace prefix for LocalStorage.
         */
        defaults: {
            storageKey: 'recent-searches',
            formId: 'search_mini_form',
            inputName: 'q',
            namespace: 'amadeco'
        },

        /**
         * @property {Object|null} storage - The instantiated Magento storage namespace object.
         */
        storage: null,

        /**
         * @property {Object} config - The finalized configuration after merging defaults with block parameters.
         */
        config: {},

        /**
         * Initializes the storage model configuration and sets up the LocalStorage namespace.
         *
         * @param {Object} config - Dynamic configuration object injected from the Magento Block XML.
         * @returns {Object} Chainable reference to this storage model.
         */
        initialize: function (config) {
            this.config = _.extend({}, this.defaults, config || {});
            this.storage = $.initNamespaceStorage(this.config.namespace).localStorage;

            return this;
        },

        /**
         * Retrieves the recent searches array from local storage.
         * Guarantees an array return type to prevent UI Component rendering errors.
         *
         * @returns {Array<Object>} Array of search term objects containing query_text and timestamp.
         */
        getRecentSearches: function () {
            var data = this.storage.get(this.config.storageKey);
            return Array.isArray(data) ? data : [];
        },

        /**
         * Adds a new search term to the local storage history.
         * Automatically sanitizes, deduplicates, enforces history limits, and triggers a global UI update.
         *
         * @param {String} term - The raw search query entered by the user.
         * @param {Number} maxItems - The maximum number of terms to retain in history.
         * @returns {void}
         */
        addRecentSearch: function (term, maxItems) {
            if (!term || typeof term !== 'string') {
                return;
            }

            term = term.trim();
            if (term.length === 0) {
                return;
            }

            var recentSearches = this.getRecentSearches();

            // Native Array.filter is optimized for V8 engine execution speed
            recentSearches = recentSearches.filter(function (search) {
                return search.query_text.toLowerCase() !== term.toLowerCase();
            });

            // Prepend the newest search at index 0
            recentSearches.unshift({
                query_text: term,
                timestamp: Date.now()
            });

            // Enforce the maximum item limit based on backend configuration
            if (recentSearches.length > maxItems) {
                recentSearches = recentSearches.slice(0, maxItems);
            }

            try {
                this.storage.set(this.config.storageKey, recentSearches);
                // Broadcast namespaced event to immediately update any active UI Components
                $(document).trigger('recentSearchesUpdated.amadecoSearchTerms', [recentSearches]);
            } catch (e) {
                // Fails gracefully in Private Browsing modes where LocalStorage may be restricted
                console.error('Amadeco SearchTerms: LocalStorage quota exceeded or unavailable.', e);
            }
        },

        /**
         * Purges all recent searches from local storage and instantly notifies components to clear the UI.
         *
         * @returns {void}
         */
        clearRecentSearches: function () {
            this.storage.remove(this.config.storageKey);
            $(document).trigger('recentSearchesUpdated.amadecoSearchTerms', [[]]);
        },

        /**
         * Generates the jQuery selector for the configured search form.
         *
         * @returns {String} CSS ID selector.
         */
        getFormSelector: function () {
            return '#' + this.config.formId;
        },

        /**
         * Generates the jQuery selector for the configured search input field.
         *
         * @returns {String} CSS attribute selector.
         */
        getInputSelector: function () {
            return 'input[name="' + this.config.inputName + '"]';
        },

        /**
         * Initializes a delegated event listener on the document to catch search form submissions.
         * Utilizes an idempotent .off().on() pattern to ensure memory safety in Single Page Applications
         * and prevent ghost event stacking on dynamic re-renders.
         *
         * @param {Number} maxItems - Maximum history size to pass to the handler.
         * @returns {void}
         */
        initSearchObserver: function(maxItems) {
            var formSelector = this.getFormSelector();

            $(document)
                .off('submit.amadecoSearchTerms', formSelector)
                .on('submit.amadecoSearchTerms', formSelector, function (e) {
                    var inputSelector = this.getInputSelector();
                    var searchTerm = $(e.currentTarget).find(inputSelector).val();
                    this.addRecentSearch(searchTerm, maxItems);
                }.bind(this));
        }
    };
});
