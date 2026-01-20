/**
 * Amadeco PopularSearchTerms Module
 *
 * @category   Amadeco
 * @package    Amadeco_PopularSearchTerms
 * @author     Ilan Parmentier
 */
define([
    'jquery',
    'underscore'
], function($, _) {
    'use strict';

    /**
     * Model for managing recent searches using Native LocalStorage
     */
    return {
        /**
         * Default configuration
         */
        defaults: {
            storageKey: 'recent-searches',
            formId: 'search_mini_form',
            inputName: 'q',
            namespace: 'amadeco:'
        },

        /**
         * State flags
         */
        storageAvailable: false,
        config: {},

        /**
         * Initialize configuration
         *
         * @param {Object} config
         */
        initialize: function(config) {
            this.config = _.extend({}, this.defaults, config || {});
            this.storageAvailable = this._checkStorageAvailability();
            return this;
        },

        /**
         * Verify if LocalStorage is supported and available
         * (Handles Private Browsing mode issues in Safari)
         *
         * @private
         * @return {boolean}
         */
        _checkStorageAvailability: function() {
            try {
                var testKey = '__storage_test__';
                window.localStorage.setItem(testKey, testKey);
                window.localStorage.removeItem(testKey);
                return true;
            } catch (e) {
                console.warn('Amadeco SearchTerms: LocalStorage is not available.');
                return false;
            }
        },

        /**
         * Get namespaced key
         *
         * @private
         * @return {String}
         */
        _getKey: function() {
            return this.config.namespace + this.config.storageKey;
        },

        /**
         * Get form selector
         *
         * @returns {String}
         */
        getFormSelector: function() {
            return 'form[id="' + this.config.formId + '"]';
        },

        /**
         * Get input selector
         *
         * @returns {String}
         */
        getInputSelector: function() {
            return 'input[name="' + this.config.inputName + '"]';
        },

        /**
         * Get recent searches from local storage
         *
         * @returns {Array}
         */
        getRecentSearches: function() {
            if (!this.storageAvailable) {
                return [];
            }

            try {
                var data = window.localStorage.getItem(this._getKey());
                return data ? JSON.parse(data) : [];
            } catch (e) {
                console.error('Error parsing search terms data', e);
                return [];
            }
        },

        /**
         * Add a search term to recent searches
         *
         * @param {string} term
         * @param {number} maxItems - Maximum number of recent searches to keep
         */
        addRecentSearch: function(term, maxItems) {
            if (!this.storageAvailable || !term) {
                return;
            }

            term = term.trim();
            if (term === '') {
                return;
            }

            var recentSearches = this.getRecentSearches();

            // Remove duplicates
            recentSearches = recentSearches.filter(function(search) {
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

            // Save
            try {
                window.localStorage.setItem(this._getKey(), JSON.stringify(recentSearches));
                $(document).trigger('recentSearchesUpdated', [recentSearches]);
            } catch (e) {
                console.error('Error saving search terms', e);
            }
        },

        /**
         * Clear all recent searches
         */
        clearRecentSearches: function() {
            if (!this.storageAvailable) {
                return;
            }

            window.localStorage.removeItem(this._getKey());
            $(document).trigger('recentSearchesUpdated', [[]]);
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
