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
     * Maximum allowed value (Security Cap)
     */
    private const MAX_ALLOWED_RECENT_SEARCHES = 10;

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
     * @param mixed $maxRecentSearches
     * @param mixed $formId
     * @param mixed $inputName
     * @param mixed $storageKey
     * @return array
     */
    public function getSearchTermsConfig(
        mixed $maxRecentSearches = null,
        mixed $formId = null,
        mixed $inputName = null,
        mixed $storageKey = null
    ): array {
        // Priority: 1. Argument passed (Layout XML), 2. System Config
        $defaultFromConfig = $this->config->getMaxRecentSearches();
        
        $maxRecent = $maxRecentSearches !== null 
            ? (int)$maxRecentSearches 
            : $defaultFromConfig;

        $fId = $formId !== null ? (string)$formId : 'search_mini_form';
        $iName = $inputName !== null ? (string)$inputName : 'q';
        $sKey = $storageKey !== null ? (string)$storageKey : 'recent-searches';

        // Enforce safety cap (Min 1, Max 10)
        $safeMaxRecent = max(1, min($maxRecent, self::MAX_ALLOWED_RECENT_SEARCHES));

        $initialTerms = $this->popularTermsProvider->getPopularTerms();

        return [
            'initialTerms' => $initialTerms,
            'numberOfTerms' => $this->config->getNumberOfTerms(),
            'sortOrder' => $this->config->getSortOrder(),
            'searchResultUrl' => $this->urlBuilder->getUrl('catalogsearch/result/'),
            'maxRecentSearches' => $safeMaxRecent,
            'searchForm' => [
                'formId' => $fId,
                'inputName' => $iName,
                'storageKey' => $sKey
            ]
        ];
    }

    /**
     * Get JSON configuration serialized
     *
     * @param mixed $maxRecentSearches
     * @param mixed $formId
     * @param mixed $inputName
     * @param mixed $storageKey
     * @return string
     */
    public function getSerializedSearchTermsConfig(
        mixed $maxRecentSearches = null,
        mixed $formId = null,
        mixed $inputName = null,
        mixed $storageKey = null
    ): string {
        return $this->serializer->serialize(
            $this->getSearchTermsConfig($maxRecentSearches, $formId, $inputName, $storageKey)
        );
    }
}
