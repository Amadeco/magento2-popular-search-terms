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
use Amadeco\PopularSearchTerms\Model\Config\Source\SortOrder;
use Magento\Framework\Stdlib\DateTime;
use Magento\Framework\Stdlib\DateTime\DateTime as ConvertDateTime;
use Magento\Search\Model\ResourceModel\Query\Collection as QueryCollection;
use Magento\Search\Model\ResourceModel\Query\CollectionFactory as QueryCollectionFactory;
use Magento\Store\Model\StoreManagerInterface;

/**
 * Popular Terms Provider Service
 */
class PopularTermsProvider implements PopularTermsProviderInterface
{
    /**
     * @param Config $config
     * @param QueryCollectionFactory $queryCollectionFactory
     * @param StoreManagerInterface $storeManager
     * @param ConvertDateTime $dateTime
     */
    public function __construct(
        private readonly Config $config,
        private readonly QueryCollectionFactory $queryCollectionFactory,
        private readonly StoreManagerInterface $storeManager,
        private readonly ConvertDateTime $dateTime
    ) {}

    /**
     * Get popular search terms
     *
     * @param int|null $storeId
     * @param int|null $limit
     * @return array<int, array{query_text: string, popularity: int, updated_at: string}>
     */
    public function getPopularTerms(?int $storeId = null, ?int $limit = null): array
    {
        if (!$this->config->isEnabled($storeId)) {
            return [];
        }

        if ($storeId === null) {
            $storeId = (int)$this->storeManager->getStore()->getId();
        }

        /** @var QueryCollection $collection */
        $collection = $this->queryCollectionFactory->create();

        // Native method to configure collection for popularity
        $collection->setPopularQueryFilter($storeId);

        // Apply time period filter if configured
        $timePeriod = $this->config->getTimePeriod($storeId);
        if ($timePeriod > 0) {
            $dateLimit = $this->dateTime->gmtDate(
                DateTime::DATETIME_PHP_FORMAT, 
                strtotime("-$timePeriod days")
            );
            $collection->addFieldToFilter('updated_at', ['gt' => $dateLimit]);
        }

        // Apply sort order
        if ($this->config->getSortOrder($storeId) === SortOrder::SORT_BY_RECENCY) {
            $collection->setRecentQueryFilter();
        }

        // Determine limit: Use override if present, otherwise config
        $limit = $limit ?? $this->config->getNumberOfTerms($storeId);
        $collection->setPageSize($limit);

        $result = [];
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
