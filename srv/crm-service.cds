using { pfe.btp as my } from '../db/schema';

service CRMService @(requires: 'authenticated-user') {
    @readonly entity Products as projection on my.Products;
    
    entity Quotes as projection on my.Quotes actions {
        @(cds.odata.bindingparameter.name: '_it', Common.SideEffects: {TargetEntities: ['/CRMService/SalesOrders']})
        action convertToOrder() returns SalesOrders;
    };

    entity SalesOrders @(restrict: [
        { grant: '*', to: 'Admin' },
        { grant: ['READ', 'CREATE', 'UPDATE'], to: 'User' }
    ]) as projection on my.SalesOrders actions {
        @(cds.odata.bindingparameter.name: '_it', Common.SideEffects: {TargetEntities: ['/CRMService/Invoices']})
        action generateInvoice() returns Invoices;
    };
    entity SalesItems as projection on my.SalesItems;
    entity Customers as projection on my.BusinessPartners {
        *
    } where bpRole = 'Client';
    entity Invoices as projection on my.Invoices where orderType = 'Sales';
}
