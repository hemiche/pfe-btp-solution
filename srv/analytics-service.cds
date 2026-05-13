using { pfe.btp.analytics as ana } from '../db/analytics';

service AnalyticsService @(requires: 'Admin') {
    @readonly entity SalesView as projection on ana.SalesAnalytics;
    @readonly entity PurchaseView as projection on ana.PurchaseAnalytics;
    @readonly entity KPIView as projection on ana.GlobalKPIs;
}
