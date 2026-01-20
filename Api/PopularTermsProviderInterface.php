<?php
/**
 * Amadeco PopularSearchTerms Module
 *
 * @category   Amadeco
 * @package    Amadeco_PopularSearchTerms
 * @author     Ilan Parmentier
 */
declare(strict_types=1);

namespace Amadeco\PopularSearchTerms\Api;

/**
 * Popular Terms Provider Interface
 */
interface PopularTermsProviderInterface
{
    /**
     * Get popular search terms
     *
     * @param int|null $storeId
     * @param int|null $limit Optional limit override
     * @return array<int, array{query_text: string, popularity: int, updated_at: string}>
     */
    public function getPopularTerms(?int $storeId = null, ?int $limit = null): array;
}
