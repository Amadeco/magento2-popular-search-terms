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
    'ko',
    'uiComponent',
    'mage/translate',
    'mage/storage',
    'Amadeco_PopularSearchTerms/js/model/storage'
], function ($, ko, Component, $t, storage, storageModel) {
    'use strict';

    /**
     * Search Terms UI Component
     *
     * This component manages popular search terms provided by the server
     * and user search history persisted in LocalStorage.
     *
     * @api
     */
    return Component.extend({
        /**
         * Component configuration defaults.
         * These values are automatically overridden by the 'config' array
         * injected by Amadeco\PopularSearchTerms\Block\SearchTerms::getJsLayout.
         */
        defaults: {
            template: 'Amadeco_PopularSearchTerms/search-terms-template',
            initialTerms: [],
            ajaxUrl: '',
            numberOfTerms: 5,
            sortOrder: 'popularity',
            searchResultUrl: '',
            maxRecentSearches: 5,
            searchFormId: 'search_mini_form',
            searchInputName: 'q',
            storageKey: 'recent-searches'
        },

        /**
         * Initialize the UI Component.
         *
         * @returns {Object} Chainable reference
         */
        initialize: function () {
            this._super();

            // 1. Initialize Observables
            this.terms = ko.observableArray(this.initialTerms);
            this.recentSearches = ko.observableArray([]);
            this.error = ko.observable(false);
            this.errorMessage = ko.observable('');
            this.loading = ko.observable(false);

            this.hasRecentSearches = ko.pureComputed(function () {
                return this.recentSearches().length > 0;
            }, this);

            // 2. Initialize Persistence Model
            // Values like this.searchForm and this.maxRecentSearches are now
            // natively available thanks to the Block injection.
            var storageConfig = {
                formId: this.searchFormId,
                inputName: this.searchInputName,
                storageKey: this.storageKey
            };

            console.log(storageConfig);
            storageModel.initialize(storageConfig);
            storageModel.initSearchObserver(parseInt(this.maxRecentSearches, 10));

            // 3. Load initial data
            this.loadRecentSearches();

            // 4. AJAX Loading Trigger
            if (this.ajaxUrl && this.terms().length === 0) {
                this.fetchTerms();
            }

            // 5. Global Event Listener for history updates
            $(document).on('recentSearchesUpdated', function (event, searches) {
                this.recentSearches(searches);
            }.bind(this));

            return this;
        },

        /**
         * Loads history from LocalStorage via the storage model.
         *
         * @public
         * @returns {void}
         */
        loadRecentSearches: function () {
            this.recentSearches(storageModel.getRecentSearches());
        },

        /**
         * Clears search history.
         *
         * @public
         * @returns {void}
         */
        clearRecentSearches: function () {
            storageModel.clearRecentSearches();
        },

        /**
         * Fetch terms via AJAX
         */
        fetchTerms: function () {
            var self = this;
            this.loading(true);
            this.error(false);

            storage.get(
                this.ajaxUrl
            ).done(function (response) {
                if (response.success && response.terms) {
                    self.terms(response.terms);
                } else {
                    self.error(true);
                    self.errorMessage(response.message || $t('Error loading terms'));
                }
            }).fail(function () {
                self.error(true);
                self.errorMessage($t('Connection error'));
            }).always(function () {
                self.loading(false);
            });
        },

        /**
         * Generates the search URL for a given term.
         *
         * @public
         * @param {String} term
         * @returns {String}
         */
        getSearchUrl: function (term) {
            var separator = this.searchResultUrl.indexOf('?') !== -1 ? '&' : '?';
            return this.searchResultUrl + separator + 'q=' + encodeURIComponent(term);
        },

        /**
         * Formats a raw date string or timestamp into a localized string.
         *
         * @public
         * @param {String|Number} dateValue
         * @returns {String}
         */
        formatDate: function (dateValue) {
            if (!dateValue) {
                return '';
            }
            var date = new Date(dateValue);
            return !isNaN(date.getTime()) ? date.toLocaleDateString() : '';
        }
    });
});
