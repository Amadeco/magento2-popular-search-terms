<?php
/**
 * Amadeco PopularSearchTerms Module
 *
 * @category   Amadeco
 * @package    Amadeco_PopularSearchTerms
 * @author     Ilan Parmentier
 */
declare(strict_types=1);

namespace Amadeco\PopularSearchTerms\Model;

use Amadeco\PopularSearchTerms\Api\PopularTermsProviderInterface;
use Amadeco\PopularSearchTerms\Model\Config; // Updated Import
use Amadeco\PopularSearchTerms\Model\Config\Source\SortOrder;
use Magento\Search\Model\Query;
use Magento\Search\Model\ResourceModel\Query\Collection as QueryCollection;
use Magento\Search\Model\ResourceModel\Query\CollectionFactory as QueryCollectionFactory;
use Magento\Store\Model\StoreManagerInterface;

/**
 * Popular Terms Provider
 */
class PopularTermsProvider implements PopularTermsProviderInterface
{
    /**
     * @param Config $config
     * @param QueryCollectionFactory $queryCollectionFactory
     * @param StoreManagerInterface $storeManager
     */
    public function __construct(
        private readonly Config $config, // Promoted & Typed
        private readonly QueryCollectionFactory $queryCollectionFactory,
        private readonly StoreManagerInterface $storeManager
    ) {}

    /**
     * Get popular search terms
     *
     * @param int|null $storeId
     * @return array<int, array{query_text: string, popularity: int, updated_at: string}>
     */
    public function getPopularTerms(?int $storeId = null): array
    {
        // Logic remains identical, just referencing the new Config object
        if (!$this->config->isEnabled($storeId)) {
            return [];
        }

        if ($storeId === null) {
            $storeId = (int)$this->storeManager->getStore()->getId();
        }

        /** @var QueryCollection $collection */
        $collection = $this->queryCollectionFactory->create();

        $collection->setPopularQueryFilter($storeId);

        $timePeriod = $this->config->getTimePeriod($storeId);
        if ($timePeriod > 0) {
            $dateLimit = date('Y-m-d H:i:s', strtotime("-$timePeriod days"));
            $collection->addFieldToFilter('updated_at', ['gt' => $dateLimit]);
        }

        if ($this->config->getSortOrder($storeId) === SortOrder::SORT_BY_RECENCY) {
            $collection->setRecentQueryFilter();
        }

        $collection->setPageSize($this->config->getNumberOfTerms($storeId));

        $result = [];
        /** @var Query $item */
        foreach ($collection as $item) {
            $result[] = [
                'query_text' => (string)$item->getQueryText(),
                'popularity' => (int)$item->getPopularity(),
                'updated_at' => (string)$item->getUpdatedAt()
            ];
        }

        return $result;
    }
}
