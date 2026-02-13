/**
 * Amadeco PopularSearchTerms Module
 *
 * @category    Amadeco
 * @package     Amadeco_PopularSearchTerms
 * @author      Ilan Parmentier
 */
define([
    'jquery',
    'underscore',
    'jquery/jquery-storageapi'
], function ($, _) {
    'use strict';

    /**
     * Model for managing recent searches using Magento's jQuery Storage API.
     * This replaces raw window.localStorage with a robust, namespaced solution.
     */
    return {
        defaults: {
            storageKey: 'recent-searches',
            formId: 'search_mini_form',
            inputName: 'q',
            namespace: 'amadeco'
        },

        /**
         * @var {Object}
         */
        storage: null,

        /**
         * @var {Object}
         */
        config: {},

        /**
         * Initialize configuration and storage mechanism.
         *
         * @param {Object} config
         * @return {Object} this
         */
        initialize: function (config) {
            this.config = _.extend({}, this.defaults, config || {});
            this.storage = $.initNamespaceStorage(this.config.namespace).localStorage;

            return this;
        },

        /**
         * Get recent searches from local storage.
         * The wrapper automatically handles JSON parsing.
         *
         * @return {Array}
         */
        getRecentSearches: function () {
            var data = this.storage.get(this.config.storageKey);
            return Array.isArray(data) ? data : [];
        },

        /**
         * Add a search term to recent searches.
         *
         * @param {String} term
         * @param {Number} maxItems
         */
        addRecentSearch: function (term, maxItems) {
            if (!term) {
                return;
            }

            term = term.trim();
            if (term.length === 0) {
                return;
            }

            var recentSearches = this.getRecentSearches();

            // Remove duplicates (case insensitive)
            recentSearches = recentSearches.filter(function (search) {
                return search.query_text.toLowerCase() !== term.toLowerCase();
            });

            // Add new term to start
            recentSearches.unshift({
                query_text: term,
                timestamp: new Date().getTime()
            });

            // Slice to limit
            if (recentSearches.length > maxItems) {
                recentSearches = recentSearches.slice(0, maxItems);
            }

            // Save (Storage API handles JSON stringify automatically)
            try {
                this.storage.set(this.config.storageKey, recentSearches);
                $(document).trigger('recentSearchesUpdated', [recentSearches]);
            } catch (e) {
                console.error('Amadeco SearchTerms: Error saving to storage', e);
            }
        },

        /**
         * Clear all recent searches.
         */
        clearRecentSearches: function () {
            this.storage.remove(this.config.storageKey);
            $(document).trigger('recentSearchesUpdated', [[]]);
        },

        /**
         * Get form selector based on ID.
         *
         * @return {String}
         */
        getFormSelector: function () {
            return '#' + this.config.formId;
        },

        /**
         * Get input selector
         *
         * @return {String}
         */
        getInputSelector: function () {
            return 'input[name="' + this.config.inputName + '"]';
        },

        /**
         * Initialize observer for search form submissions
         *
         * @param {number} maxItems
         */
        initSearchObserver: function(maxItems) {
            var self = this;
            var formSelector = this.getFormSelector();

            // Event delegation is safer if the form is dynamically loaded
            $(document).on('submit', formSelector, function(e) {
                var inputSelector = self.getInputSelector();
                var searchTerm = $(this).find(inputSelector).val();
                self.addRecentSearch(searchTerm, maxItems);
            });
        }
    };
});
