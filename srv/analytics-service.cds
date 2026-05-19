using { pfe.btp.analytics as ana } from '../db/analytics';

service AnalyticsService @(requires: 'Admin') {
    @readonly @cds.redirection.target entity SalesView       as projection on ana.SalesAnalytics;
    @readonly @cds.redirection.target entity PurchaseView    as projection on ana.PurchaseAnalytics;
    @readonly entity KPIView         as projection on ana.GlobalKPIs;
    @readonly entity TopClientsView  as projection on ana.TopClients;
    @readonly entity TopSuppliersView as projection on ana.TopSuppliers;
    @readonly entity TopProductsView as projection on ana.TopProducts;
    @readonly entity LowStockView    as projection on ana.LowStockProducts;
    @readonly entity PendingInvoicesView as projection on ana.PendingInvoices;
}
