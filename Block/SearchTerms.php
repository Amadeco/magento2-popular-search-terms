<?php
/**
 * Amadeco PopularSearchTerms Module
 *
 * @category    Amadeco
 * @package     Amadeco_PopularSearchTerms
 * @author      Ilan Parmentier
 * @license     Proprietary
 */

declare(strict_types=1);

namespace Amadeco\PopularSearchTerms\Block;

use Amadeco\PopularSearchTerms\Api\PopularTermsProviderInterface;
use Amadeco\PopularSearchTerms\Model\Config;
use Amadeco\PopularSearchTerms\Model\Config\Source\LoadMethod;
use Magento\Framework\DataObject\IdentityInterface;
use Magento\Framework\Serialize\SerializerInterface;
use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;

/**
 * Block for Popular Search Terms UI Component.
 *
 * Refactored for PHP 8.3 compliance and improved readability.
 * Injects dynamic configuration into the UI Component's JsLayout.
 */
class SearchTerms extends Template implements IdentityInterface
{
    /**
     * Default number of terms fallback.
     */
    private const int DEFAULT_TERMS_LIMIT = 5;

    /**
     * Cache tag for this block.
     */
    private const string CACHE_TAG = 'amadeco_popular_search_terms';

    /**
     * @param Context $context
     * @param PopularTermsProviderInterface $popularTermsProvider
     * @param Config $config
     * @param SerializerInterface $serializer
     * @param array<string, mixed> $data
     */
    public function __construct(
        Context $context,
        private readonly PopularTermsProviderInterface $popularTermsProvider,
        private readonly Config $config,
        private readonly SerializerInterface $serializer,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

    /**
     * Enriches the JsLayout configuration with dynamic search data.
     *
     * @return string JSON serialized layout configuration.
     */
    public function getJsLayout(): string
    {
        // Prevent processing if module is disabled
        if (!$this->isEnabled()) {
            return parent::getJsLayout();
        }

        $layout = $this->serializer->unserialize(parent::getJsLayout());

        // Fail fast if the component structure is missing
        if (!isset($layout['components']['search-terms']['config'])) {
            return parent::getJsLayout();
        }

        // Inject the dynamic configuration
        $layout['components']['search-terms']['config'] = array_replace_recursive(
            $layout['components']['search-terms']['config'],
            $this->getComponentConfig($layout['components']['search-terms']['config'])
        );

        return $this->serializer->serialize($layout);
    }

    /**
     * Prepare the configuration array for the UI Component.
     *
     * @param array<string, mixed> $existingConfig
     * @return array<string, mixed>
     */
    private function getComponentConfig(array $existingConfig): array
    {
        $isAjax = $this->config->getLoadMethod() === LoadMethod::LOADING_AJAX;

        if ($isAjax) {
            return [
                'initialTerms' => [],
                'ajaxUrl' => $this->getUrl('amadeco_popularterms/ajax/getterms'),
                'searchResultUrl' => $this->getUrl('catalogsearch/result/'),
            ];
        }

        $limit = isset($existingConfig['numberOfTerms'])
            ? (int)$existingConfig['numberOfTerms']
            : null;

        return [
            'initialTerms' => $this->fetchPopularTerms($limit),
            'ajaxUrl' => '',
            'searchResultUrl' => $this->getUrl('catalogsearch/result/'),
        ];
    }

    /**
     * Checks if the module functionality is enabled.
     *
     * @return bool
     */
    public function isEnabled(): bool
    {
        return $this->config->isEnabled();
    }

    /**
     * Conditionally renders the block HTML.
     *
     * @return string
     */
    protected function _toHtml(): string
    {
        return $this->isEnabled() ? parent::_toHtml() : '';
    }

    /**
     * Fetches popular terms based on configuration logic.
     *
     * @param int|null $xmlLimit
     * @return array<int, mixed>
     */
    private function fetchPopularTerms(?int $xmlLimit = null): array
    {
        $limit = $xmlLimit ?? $this->config->getNumberOfTerms() ?? self::DEFAULT_TERMS_LIMIT;

        return $this->popularTermsProvider->getPopularTerms(
            null,
            (int)$limit
        );
    }

    /**
     * Get unique cache identities.
     *
     * @return string[]
     */
    public function getIdentities(): array
    {
        return [self::CACHE_TAG, self::CACHE_TAG . '_' . $this->_storeManager->getStore()->getId()];
    }

    /**
     * Get cache lifetime.
     *
     * @return int|null
     */
    protected function getCacheLifetime(): ?int
    {
        return $this->isEnabled() ? ($this->config->getCacheLifetime() ?? 3600) : null;
    }

    /**
     * Get cache key info.
     *
     * @return array<int, mixed>
     */
    public function getCacheKeyInfo(): array
    {
        return [
            ...parent::getCacheKeyInfo(),
            'amadeco_popular_search_terms',
            $this->_storeManager->getStore()->getId(),
            $this->config->getLoadMethod(),
            $this->config->getNumberOfTerms(),
            $this->config->getSortOrder(),
            $this->config->getTimePeriod(),
            (string)$this->config->getCacheLifetime()
        ];
    }
}
