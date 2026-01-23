<?php
/**
 * Amadeco PopularSearchTerms Module
 *
 * @category   Amadeco
 * @package    Amadeco_PopularSearchTerms
 * @author     Ilan Parmentier
 */
declare(strict_types=1);

namespace Amadeco\PopularSearchTerms\Controller\Ajax;

use Amadeco\PopularSearchTerms\Api\PopularTermsProviderInterface;
use Magento\Framework\App\Action\HttpGetActionInterface;
use Magento\Framework\App\Request\Http;
use Magento\Framework\Controller\Result\Json;
use Magento\Framework\Controller\Result\JsonFactory;
use Magento\Framework\Controller\Result\Forward;
use Magento\Framework\Controller\Result\ForwardFactory;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Store\Model\StoreManagerInterface;
use Magento\Framework\Exception\LocalizedException;
use Psr\Log\LoggerInterface;

/**
 * AJAX controller for getting popular search terms
 */
class GetTerms implements HttpGetActionInterface
{
    /**
     * @param JsonFactory $resultJsonFactory
     * @param ForwardFactory $resultForwardFactory
     * @param PopularTermsProviderInterface $popularTermsProvider
     * @param StoreManagerInterface $storeManager
     * @param LoggerInterface $logger
     * @param Http $request
     */
    public function __construct(
        protected readonly JsonFactory $resultJsonFactory,
        protected readonly ForwardFactory $resultForwardFactory,
        protected readonly PopularTermsProviderInterface $popularTermsProvider,
        protected readonly StoreManagerInterface $storeManager,
        protected readonly LoggerInterface $logger,
        protected readonly Http $request
    ) {}

    /**
     * Execute action to get popular search terms
     *
     * @return Json|Forward
     */
    public function execute(): Json|Forward
    {
        if (!$this->request->isAjax()) {
            /** @var Forward $resultForward */
            $resultForward = $this->resultForwardFactory->create();
            return $resultForward->forward('noroute');
        }

        /** @var Json $result */
        $result = $this->resultJsonFactory->create();

        try {
            $storeId = (int)$this->storeManager->getStore()->getId();
            
            $terms = $this->popularTermsProvider->getPopularTerms($storeId);

            return $result->setData([
                'success' => true,
                'terms' => $terms
            ]);
        } catch (NoSuchEntityException | LocalizedException $e) {
            $this->logger->warning($e->getMessage());

            return $result->setData([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        } catch (\Throwable $e) {
            $this->logger->critical($e);

            return $result->setData([
                'success' => false,
                'message' => __('An error occurred while retrieving popular search terms.')
            ]);
        }
    }
}
