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
    'uiComponent',
    'mage/translate',
    'mage/storage',
    'Amadeco_PopularSearchTerms/js/model/storage'
], function ($, Component, $t, storage, storageModel) {
    'use strict';

    /**
     * Search Terms UI Component.
     * Manages the presentation layer of popular terms (via Direct Injection or AJAX)
     * and personal search history (via the separated LocalStorage model).
     *
     * @api
     */
    return Component.extend({
        /**
         * @property {Object} defaults - Base component configuration.
         * These are typically overridden by the XML jsLayout injection.
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
            storageKey: 'recent-searches',
            
            /**
             * Magento Native Reactivity Array.
             * Tracks specific object properties instead of using ko.observable().
             * Enhances performance and simplifies template syntax.
             */
            tracks: {
                terms: true,
                recentSearches: true,
                error: true,
                errorMessage: true,
                loading: true
            }
        },

        /**
         * Magento lifecycle hook: initObservable.
         * Initializes standard JavaScript properties that are automatically made reactive
         * by the `tracks` definition in the defaults object.
         *
         * @returns {Object} Chainable reference to the component.
         */
        initObservable: function () {
            this._super();

            this.terms = this.initialTerms || [];
            this.recentSearches = [];
            this.error = false;
            this.errorMessage = '';
            this.loading = false;

            return this;
        },

        /**
         * Magento lifecycle hook: initialize.
         * Executes upon component instantiation to map storage, trigger initial data loads,
         * and securely bind global events.
         *
         * @returns {Object} Chainable reference to the component.
         */
        initialize: function () {
            this._super();

            // Configure the Storage Model with injected XML properties
            storageModel.initialize({
                formId: this.searchFormId,
                inputName: this.searchInputName,
                storageKey: this.storageKey
            });
            storageModel.initSearchObserver(parseInt(this.maxRecentSearches, 10));

            // Hydrate local history instantly on load
            this.loadRecentSearches();

            // Trigger AJAX fetch if configured and direct injection was not utilized
            if (this.ajaxUrl && this.terms.length === 0) {
                this.fetchTerms();
            }

            // Securely bind the event handler to maintain 'this' context for the callback
            this.onRecentSearchesUpdated = this.onRecentSearchesUpdated.bind(this);
            $(document).on('recentSearchesUpdated.amadecoSearchTerms', this.onRecentSearchesUpdated);

            return this;
        },

        /**
         * Magento lifecycle hook: destroy.
         * Executed when the UI Layout Engine removes this component from the DOM.
         * Crucial for strict memory management to prevent zombie listeners in SPAs.
         *
         * @returns {void}
         */
        destroy: function () {
            $(document).off('recentSearchesUpdated.amadecoSearchTerms', this.onRecentSearchesUpdated);
            this._super();
        },

        /**
         * Convenience method for the HTML template to check if recent searches exist.
         * Replaces ko.computed since tracked properties automatically force template re-evaluations.
         *
         * @returns {Boolean} True if history exists.
         */
        hasRecentSearches: function () {
            return this.recentSearches.length > 0;
        },

        /**
         * Event callback fired when the storage model broadcasts an update to the user's history.
         *
         * @param {Event} event - The jQuery event context.
         * @param {Array<Object>} searches - The newest array of search items.
         * @returns {void}
         */
        onRecentSearchesUpdated: function (event, searches) {
            this.recentSearches = searches;
        },

        /**
         * Pulls the latest search history directly from the storage model into tracked state.
         *
         * @returns {void}
         */
        loadRecentSearches: function () {
            this.recentSearches = storageModel.getRecentSearches();
        },

        /**
         * Commands the storage model to completely wipe user history.
         *
         * @returns {void}
         */
        clearRecentSearches: function () {
            storageModel.clearRecentSearches();
        },

        /**
         * Performs an asynchronous request to fetch popular terms from the backend API.
         * Utilizes native Function.prototype.bind() to strictly maintain scope in callbacks.
         *
         * @returns {void}
         */
        fetchTerms: function () {
            this.loading = true;
            this.error = false;

            storage.get(this.ajaxUrl)
                .done(function (response) {
                    if (response.success && response.terms) {
                        this.terms = response.terms;
                    } else {
                        this.error = true;
                        this.errorMessage = response.message || $t('Error loading terms');
                    }
                }.bind(this))
                .fail(function () {
                    this.error = true;
                    this.errorMessage = $t('Connection error');
                }.bind(this))
                .always(function () {
                    this.loading = false;
                }.bind(this));
        },

        /**
         * Safely constructs the destination URL for executing a search.
         * Applies standard URL encoding to prevent injection, and reformats spaces
         * natively to `+` to maintain aesthetic parity with Magento's standard form submissions.
         *
         * @param {String} term - The raw search query text.
         * @returns {String} The fully qualified, strictly encoded URL string.
         */
        getSearchUrl: function (term) {
            var separator = this.searchResultUrl.indexOf('?') !== -1 ? '&' : '?';
            var encodedTerm = encodeURIComponent(term).replace(/%20/g, '+');
            return this.searchResultUrl + separator + 'q=' + encodedTerm;
        },

        /**
         * Formats a Unix timestamp into the user's localized date string.
         *
         * @param {Number|String} dateValue - The numeric timestamp or parsable string.
         * @returns {String} The localized date, or an empty string if invalid.
         */
        formatDate: function (dateValue) {
            if (!dateValue) return '';
            var date = new Date(dateValue);
            return !isNaN(date.getTime()) ? date.toLocaleDateString() : '';
        }
    });
});
