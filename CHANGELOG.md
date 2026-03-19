# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.3] - 2026-03-19
### Changed
- **Performance:** Migrated UI Component from legacy Knockout `ko.observable` to Magento's native `tracks` property and `initObservable()` for faster component rendering and reactivity.
- **Performance:** Replaced `underscore.js` methods and legacy JS with highly optimized native JavaScript APIs (e.g., `Array.filter`, `Date.now()`).
- **Template Integration:** Updated `search-terms-template.html` to remove observable invocation parentheses `()`, aligning completely with the new `tracks` reactivity system.
- **Code Quality:** Eradicated ES3 `var self = this` anti-patterns, utilizing strictly scoped `.bind(this)` in asynchronous AJAX callbacks.
- **Documentation:** Added comprehensive, production-ready JSDoc English documentation to all JavaScript files.
- **UX/SEO:** Improved URI space encoding in `getSearchUrl()` to convert `%20` to `+`, strictly mimicking Magento's native form submission aesthetics.

### Fixed
- **Memory Leaks:** Implemented idempotent event delegation (`.off().on()`) and utilized the `destroy()` UI lifecycle hook to prevent event stacking and ghost submissions in SPA contexts.
- **Production Readiness:** Removed leftover `console.log` statements in the storage model.

## [1.1.2] - 2026-02-13
### Fixed
- `recent-searches` logic (PR #5 by @Amadeco).

## [1.1.1] - 2026-01-25
### Fixed
- `popular-search`: restrict `GetTerms` endpoint to strictly handle AJAX requests only (PR #4 by @Amadeco).

## [1.1.0] - 2026-01-22
### Added
- Implement Hybrid Loading (Direct vs AJAX) for performance and SEO.
- Integrate deep `jsLayout` configuration for UI Components.
- Add native block caching with configurable TTL.

### Changed
- Migrate configuration logic from Helper to Model/Config.
- Transition recent searches to namespaced LocalStorage (removing `customer-data` dependency).
- Update styling for better responsive support.
- Bump minimum requirements to PHP 8.3.

## [1.0.2] - 2025-04-11
### Added
- docs: officially licensed under Open Software License (OSL-3.0).

## [1.0.1] - 2025-03-25
### Fixed
- Add proper ACL (Access Control List) permissions control.
  - Added `etc/acl.xml` file to define permissions structure.
  - Updated `etc/adminhtml/system.xml` to reference the ACL resource.
  - Added permission resource `Amadeco_PopularSearchTerms::config` for section access control.

## [1.0.0] - 2025-03-25
### Added
- Initial Release of Amadeco Popular Search Terms.
