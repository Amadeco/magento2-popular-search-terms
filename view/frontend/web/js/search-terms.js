/**
 * Amadeco PopularSearchTerms Module
 *
 * @category   Amadeco
 * @package    Amadeco_PopularSearchTerms
 * @author     Ilan Parmentier
 */
define([
    'jquery',
    'ko',
    'uiComponent',
    'mage/translate',
    'Amadeco_PopularSearchTerms/js/model/storage'
], function ($, ko, Component, $t, storageModel) {
    'use strict';

    return Component.extend({
        /** @inheritdoc */
        initialize: function () {
            this._super();

            // Initialize observable data for popular terms
            this.terms = ko.observableArray([]);
            this.loading = ko.observable(true);
            this.error = ko.observable(false);
            this.errorMessage = ko.observable('');

            // Initialize observable data for recent searches
            this.recentSearches = ko.observableArray([]);
            this.hasRecentSearches = ko.computed(function() {
                return this.recentSearches().length > 0;
            }, this);

            // Get configuration parameters
            this.maxRecentSearches = this.getMaxRecentSearches();
            this.storageConfig = this.getStorageConfig();

            // Initialize the storage model with configuration
            storageModel.initialize(this.storageConfig);
            storageModel.initSearchObserver(this.maxRecentSearches);

            // Load data (Performance Fix: Load from injected config, no AJAX)
            this.initPopularTerms();
            this.loadRecentSearches();

            // Listen for updated recent searches
            var self = this;
            $(document).on('recentSearchesUpdated', function(event, searches) {
                self.recentSearches(searches);
            });
        },

        /**
         * Initialize popular terms from window config
         */
        initPopularTerms: function () {
            // Check if terms are provided in the config (Server-Side Rendered)
            if (window.searchTermsConfig && window.searchTermsConfig.initialTerms) {
                this.terms(window.searchTermsConfig.initialTerms);
                this.loading(false);
            } else {
                // Fallback if no terms are found or module disabled
                this.loading(false);
                // Optional: We could set an empty state or error here if strict
            }
        },

        /**
         * Get maximum number of recent searches from config
         *
         * @returns {number}
         */
        getMaxRecentSearches: function() {
            return window.searchTermsConfig && window.searchTermsConfig.maxRecentSearches
                ? parseInt(window.searchTermsConfig.maxRecentSearches, 10)
                : 5;
        },

        /**
         * Get storage configuration
         *
         * @returns {Object}
         */
        getStorageConfig: function() {
            var config = {};

            if (window.searchTermsConfig && window.searchTermsConfig.searchForm) {
                var searchForm = window.searchTermsConfig.searchForm;

                if (searchForm.formId) {
                    config.formId = searchForm.formId;
                }

                if (searchForm.inputName) {
                    config.inputName = searchForm.inputName;
                }

                if (searchForm.storageKey) {
                    config.storageKey = searchForm.storageKey;
                }
            }

            return config;
        },

        /**
         * Load recent searches from storage
         */
        loadRecentSearches: function() {
            this.recentSearches(storageModel.getRecentSearches());
        },

        /**
         * Clear recent searches
         */
        clearRecentSearches: function() {
            storageModel.clearRecentSearches();
        },

        /**
         * Get search URL for term
         *
         * @param {String} term
         * @return {String}
         */
        getSearchUrl: function (term) {
            return window.searchTermsConfig.searchResultUrl + '?q=' + encodeURIComponent(term);
        },

        /**
         * Format date for display
         *
         * @param {Number} timestamp
         * @return {String}
         */
        formatDate: function(timestamp) {
            if (!timestamp) {
                return '';
            }

            var date = new Date(timestamp);
            return date.toLocaleDateString();
        }
    });
});
