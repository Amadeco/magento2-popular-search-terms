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
     * Storage Model for managing recent searches.
     * Utilizes Magento's jQuery Storage API wrapper for namespaced LocalStorage.
     * * @api
     */
    return {
        /**
         * @property {Object} defaults Default configuration parameters.
         */
        defaults: {
            storageKey: 'recent-searches',
            formId: 'search_mini_form',
            inputName: 'q',
            namespace: 'amadeco'
        },

        /**
         * @property {Object|null} storage The instantiated storage namespace.
         */
        storage: null,

        /**
         * @property {Object} config The merged configuration.
         */
        config: {},

        /**
         * Initializes the storage model configuration and sets up the namespace.
         *
         * @param {Object} config - Dynamic configuration injected from the Block.
         * @returns {Object} Chainable reference to this model.
         */
        initialize: function (config) {
            this.config = _.extend({}, this.defaults, config || {});
            this.storage = $.initNamespaceStorage(this.config.namespace).localStorage;

            return this;
        },

        /**
         * Retrieves the recent searches array from local storage.
         *
         * @returns {Array<Object>} Array of search term objects containing query_text and timestamp.
         */
        getRecentSearches: function () {
            var data = this.storage.get(this.config.storageKey);
            return Array.isArray(data) ? data : [];
        },

        /**
         * Adds a new search term to the local storage history.
         * Automatically deduplicates, limits array size, and triggers a global update event.
         *
         * @param {String} term - The raw search query entered by the user.
         * @param {Number} maxItems - The maximum number of terms to retain.
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

            // Native Array.filter is faster and safer than underscore's _.filter here
            recentSearches = recentSearches.filter(function (search) {
                return search.query_text.toLowerCase() !== term.toLowerCase();
            });

            // Prepend the newest search
            recentSearches.unshift({
                query_text: term,
                timestamp: Date.now() // Micro-optimization: Date.now() is faster than new Date().getTime()
            });

            // Enforce the maximum item limit
            if (recentSearches.length > maxItems) {
                recentSearches = recentSearches.slice(0, maxItems);
            }

            try {
                this.storage.set(this.config.storageKey, recentSearches);
                // Trigger namespaced event to notify active UI Components
                $(document).trigger('recentSearchesUpdated.amadecoSearchTerms', [recentSearches]);
            } catch (e) {
                console.error('Amadeco SearchTerms: LocalStorage quota exceeded or disabled.', e);
            }
        },

        /**
         * Purges all recent searches from local storage and notifies components.
         *
         * @returns {void}
         */
        clearRecentSearches: function () {
            this.storage.remove(this.config.storageKey);
            $(document).trigger('recentSearchesUpdated.amadecoSearchTerms', [[]]);
        },

        /**
         * Generates the jQuery selector for the search form.
         *
         * @returns {String} CSS selector for the form ID.
         */
        getFormSelector: function () {
            return '#' + this.config.formId;
        },

        /**
         * Generates the jQuery selector for the search input field.
         *
         * @returns {String} CSS selector for the input name.
         */
        getInputSelector: function () {
            return 'input[name="' + this.config.inputName + '"]';
        },

        /**
         * Initializes a delegated event listener on the document to catch form submissions.
         * Uses idempotent .off().on() to ensure jQuery 3.x memory safety.
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
                    // 'this' refers to the storage model due to .bind() below
                    var searchTerm = $(e.currentTarget).find(inputSelector).val();
                    this.addRecentSearch(searchTerm, maxItems);
                }.bind(this));
        }
    };
});
