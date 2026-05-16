namespace pfe.btp.analytics;

using { pfe.btp as my } from './schema';

/**
 * Vue Analytique pour le CRM (Ventes)
 */
define view SalesAnalytics as select from my.SalesOrders {
    key ID,
    orderDate,
    substring(orderDate, 1, 7) as month : String,
    client.companyName as clientName,
    @Aggregation.default: #SUM
    totalAmount,
    currency.code as currency
};

/**
 * Vue Analytique pour le SRM (Achats)
 */
define view PurchaseAnalytics as select from my.PurchaseOrders {
    key ID,
    poDate,
    substring(poDate, 1, 7) as month : String,
    supplier.companyName as supplierName,
    @Aggregation.default: #SUM
    totalAmount,
    currency.code as currency
};

/**
 * Vue pour le Dashboard Admin (KPIs Globaux)
 */
define view GlobalKPIs as select from my.BusinessPartners {
    key bpRole,
    @Aggregation.default: #COUNT
    count(ID) as totalCount : Integer
} group by bpRole;
