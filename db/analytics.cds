namespace pfe.btp.analytics;

using { pfe.btp as my } from './schema';

/**
 * Vue Analytique CRM — Ventes journalières
 */
define view SalesAnalytics as select from my.SalesOrders {
    key ID,
    orderDate,
    substring(orderDate, 1, 7) as month : String,
    substring(orderDate, 1, 10) as day  : String,
    client.companyName as clientName,
    client.wilaya      as wilaya,
    @Aggregation.default: #SUM
    totalAmount,
    currency.code as currency
};

/**
 * Vue Analytique SRM — Achats
 */
define view PurchaseAnalytics as select from my.PurchaseOrders {
    key ID,
    poDate,
    substring(poDate, 1, 7) as month    : String,
    substring(poDate, 1, 10) as day     : String,
    supplier.companyName as supplierName,
    supplier.wilaya      as wilaya,
    @Aggregation.default: #SUM
    totalAmount,
    currency.code as currency
};

/**
 * KPIs globaux — Comptage partenaires par rôle et statut
 */
define view GlobalKPIs as select from my.BusinessPartners {
    key bpRole,
    key status,
    key clientType,
    @Aggregation.default: #COUNT
    count(ID) as totalCount : Integer
} group by bpRole, status, clientType;

/**
 * Top Clients — par montant commandé et par mois
 */
define view TopClients as select from my.SalesOrders {
    key client.ID as client_ID,
    key substring(orderDate, 1, 7) as month : String,
    client.companyName as clientName,
    client.wilaya      as wilaya,
    @Aggregation.default: #SUM
    totalAmount as totalSales,
    currency.code as currency
} group by client.ID, substring(orderDate, 1, 7), client.companyName, client.wilaya, currency.code;

/**
 * Top Fournisseurs — par montant commandé et par mois
 */
define view TopSuppliers as select from my.PurchaseOrders {
    key supplier.ID as supplier_ID,
    key substring(poDate, 1, 7) as month : String,
    supplier.companyName as supplierName,
    supplier.wilaya      as wilaya,
    @Aggregation.default: #SUM
    totalAmount as totalPurchases,
    currency.code as currency
} group by supplier.ID, substring(poDate, 1, 7), supplier.companyName, supplier.wilaya, currency.code;

/**
 * Top Produits — par quantité vendue et par mois
 */
define view TopProducts as select from my.SalesItems {
    key product.ID as product_ID,
    key substring(order.orderDate, 1, 7) as month : String,
    product.name     as productName,
    product.category as category,
    @Aggregation.default: #SUM
    quantity as totalQty,
    @Aggregation.default: #SUM
    price    as totalRevenue
} group by product.ID, substring(order.orderDate, 1, 7), product.name, product.category;

/**
 * Stock faible — produits sous le seuil minimum
 */
define view LowStockProducts as select from my.Products {
    key ID,
    sku,
    name,
    category,
    stockLevel,
    stockMinimum
} where stockLevel <= stockMinimum and productType = 'Produit' and isActive = true;

/**
 * Factures en attente (Encours Clients)
 */
define view PendingInvoices as select from my.Invoices {
    key ID,
    invoiceNumber,
    @Aggregation.default: #SUM
    amount,
    currency.code as currency,
    dueDate
} where status = 'Pending' and orderType = 'Sales';
