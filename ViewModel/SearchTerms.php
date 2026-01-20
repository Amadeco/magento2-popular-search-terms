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
use Magento\Search\Model\QueryFactory;

/**
 * ViewModel for Search Terms Configuration
 */
class SearchTerms implements ArgumentInterface
{
    /**
     * Maximum allowed value for recent searches (History)
     */
    private const MAX_ALLOWED_RECENT_SEARCHES = 20;

    /**
     * Maximum allowed value for popular terms (Display)
     */
    private const MAX_ALLOWED_TERMS = 50;

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
     * @param mixed $numberOfTerms
     * @param mixed $formId
     * @param mixed $inputName
     * @param mixed $storageKey
     * @return array
     */
    public function getSearchTermsConfig(
        mixed $maxRecentSearches = null,
        mixed $numberOfTerms = null,
        mixed $formId = null,
        mixed $inputName = null,
        mixed $storageKey = null
    ): array {
        // 1. Resolve Max Recent Searches (Config vs XML)
        $defaultRecent = $this->config->getMaxRecentSearches();
        $maxRecent = $maxRecentSearches !== null ? (int)$maxRecentSearches : $defaultRecent;
        // Cap Recent Searches (1-10)
        $safeMaxRecent = max(1, min($maxRecent, self::MAX_ALLOWED_RECENT_SEARCHES));

        // 2. Resolve Number of Terms (Config vs XML)
        $defaultTerms = $this->config->getNumberOfTerms();
        $numTerms = $numberOfTerms !== null ? (int)$numberOfTerms : $defaultTerms;
        // Cap Number of Terms (1-50)
        $safeNumTerms = max(1, min($numTerms, self::MAX_ALLOWED_TERMS));

        // 3. Resolve Form Selectors
        $fId = $formId !== null ? (string)$formId : 'search_mini_form';
        $iName = $inputName !== null ? (string)$inputName : QueryFactory::QUERY_VAR_NAME;
        $sKey = $storageKey !== null ? (string)$storageKey : 'recent-searches';

        // Fetch popular terms with the resolved limit
        $initialTerms = $this->popularTermsProvider->getPopularTerms(null, $safeNumTerms);

        return [
            'initialTerms' => $initialTerms,
            'numberOfTerms' => $safeNumTerms,
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
     * @param mixed $numberOfTerms
     * @param mixed $formId
     * @param mixed $inputName
     * @param mixed $storageKey
     * @return string
     */
    public function getSerializedSearchTermsConfig(
        mixed $maxRecentSearches = null,
        mixed $numberOfTerms = null,
        mixed $formId = null,
        mixed $inputName = null,
        mixed $storageKey = null
    ): string {
        return $this->serializer->serialize(
            $this->getSearchTermsConfig($maxRecentSearches, $numberOfTerms, $formId, $inputName, $storageKey)
        );
    }
}
