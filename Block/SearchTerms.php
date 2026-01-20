<?php
/**
 * Amadeco PopularSearchTerms Module
 *
 * @category   Amadeco
 * @package    Amadeco_PopularSearchTerms
 * @author     Ilan Parmentier
 */
declare(strict_types=1);

namespace Amadeco\PopularSearchTerms\Block;

use Amadeco\PopularSearchTerms\Api\PopularTermsProviderInterface;
use Amadeco\PopularSearchTerms\Model\Config;
use Magento\Framework\View\Element\Template;
use Magento\Framework\View\Element\Template\Context;
use Magento\Framework\Serialize\SerializerInterface;

/**
 * Search Terms Block (Popular and Recent)
 */
class SearchTerms extends Template
{
    /**
     * Template path
     *
     * @var string
     */
    protected $_template = 'Amadeco_PopularSearchTerms::search_terms.phtml';

    /**
     * @param Context $context
     * @param PopularTermsProviderInterface $popularTermsProvider
     * @param SerializerInterface $serializer
     * @param Config $config
     * @param array $data
     */
    public function __construct(
        Context $context,
        private readonly PopularTermsProviderInterface $popularTermsProvider,
        private readonly SerializerInterface $serializer,
        private readonly Config $config,
        array $data = []
    ) {
        parent::__construct($context, $data);
    }

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
     * @return array
     */
    public function getSearchTermsConfig(): array
    {
        $maxRecentSearches = $this->getData('max_recent_searches') ?? 5;
        $formId = $this->getData('search_form_id') ?? 'search_mini_form';
        $inputName = $this->getData('search_input_name') ?? 'q';
        $storageKey = $this->getData('storage_key') ?? 'recent-searches';

        // Performance Fix: Fetch terms server-side to cache with FPC
        // and avoid expensive AJAX calls on every page load.
        $initialTerms = $this->popularTermsProvider->getPopularTerms();

        return [
            'initialTerms' => $initialTerms, // Inject data directly
            'numberOfTerms' => $this->config->getNumberOfTerms(),
            'sortOrder' => $this->config->getSortOrder(),
            'searchResultUrl' => $this->getUrl('catalogsearch/result/'),
            'maxRecentSearches' => (int)$maxRecentSearches,
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
     * @return string
     */
    public function getSerializedSearchTermsConfig(): string
    {
        return $this->serializer->serialize($this->getSearchTermsConfig());
    }
}
