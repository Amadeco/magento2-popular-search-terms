<?php
/**
 * Amadeco PopularSearchTerms Module
 *
 * @category   Amadeco
 * @package    Amadeco_PopularSearchTerms
 * @author     Ilan Parmentier
 */
declare(strict_types=1);

namespace Amadeco\PopularSearchTerms\ViewModel;

use Amadeco\PopularSearchTerms\Api\PopularTermsProviderInterface;
use Amadeco\PopularSearchTerms\Model\Config;
use Magento\Framework\View\Element\Block\ArgumentInterface;
use Magento\Framework\Serialize\SerializerInterface;
use Magento\Framework\UrlInterface;

/**
 * ViewModel for Search Terms Configuration
 */
class SearchTerms implements ArgumentInterface
{
    /**
     * Maximum allowed value for recent searches to prevent storage bloat.
     */
    private const MAX_ALLOWED_RECENT_SEARCHES = 50;
    
    /**
     * @param PopularTermsProviderInterface $popularTermsProvider
     * @param SerializerInterface $serializer
     * @param Config $config
     * @param UrlInterface $urlBuilder
     */
    public function __construct(
        private readonly PopularTermsProviderInterface $popularTermsProvider,
        private readonly SerializerInterface $serializer,
        private readonly Config $config,
        private readonly UrlInterface $urlBuilder
    ) {}

    /**
     * Check if module is enabled
     *
     * @return bool
     */
    public function isEnabled(): bool
    {
        return $this->config->isEnabled();
    }

    /**
     * Get search terms configuration
     *
     * @param int $maxRecentSearches
     * @param string $formId
     * @param string $inputName
     * @param string $storageKey
     * @return array
     */
    public function getSearchTermsConfig(
        int $maxRecentSearches = 5,
        string $formId = 'search_mini_form',
        string $inputName = 'q',
        string $storageKey = 'recent-searches'
    ): array {
        // Enforce a hard limit (cap) and ensure positive integer
        $safeMaxRecent = max(1, min($maxRecentSearches, self::MAX_ALLOWED_RECENT_SEARCHES));

        // Fetch terms server-side (Performance fix from Phase 3)
        $initialTerms = $this->popularTermsProvider->getPopularTerms();

        return [
            'initialTerms' => $initialTerms,
            'numberOfTerms' => $this->config->getNumberOfTerms(),
            'sortOrder' => $this->config->getSortOrder(),
            'searchResultUrl' => $this->urlBuilder->getUrl('catalogsearch/result/'),
            'maxRecentSearches' => $maxRecentSearches,
            'searchForm' => [
                'formId' => $formId,
                'inputName' => $inputName,
                'storageKey' => $storageKey
            ]
        ];
    }

    /**
     * Get JSON configuration serialized
     *
     * @param int $maxRecentSearches
     * @param string $formId
     * @param string $inputName
     * @param string $storageKey
     * @return string
     */
    public function getSerializedSearchTermsConfig(
        int $maxRecentSearches = 5,
        string $formId = 'search_mini_form',
        string $inputName = 'q',
        string $storageKey = 'recent-searches'
    ): string {
        return $this->serializer->serialize(
            $this->getSearchTermsConfig($maxRecentSearches, $formId, $inputName, $storageKey)
        );
    }
}
