using { pfe.btp as my } from '../db/schema';

service SRMService @(requires: 'authenticated-user') {
    @readonly entity Products as projection on my.Products;
    
    @odata.draft.enabled
    entity RFQs as projection on my.RFQs actions {
        @(cds.odata.bindingparameter.name: '_it', Common.SideEffects: {TargetEntities: ['/SRMService/PurchaseOrders']})
        action convertToPO() returns PurchaseOrders;
    };

    entity RFQItems as projection on my.RFQItems;

    entity PurchaseOrders @(restrict: [
        { grant: '*', to: 'Admin' },
        { grant: ['READ', 'CREATE', 'UPDATE'], to: 'User' }
    ]) as projection on my.PurchaseOrders actions {
        @(cds.odata.bindingparameter.name: '_it', Common.SideEffects: {TargetEntities: ['/SRMService/Invoices']})
        action generateSupplierInvoice() returns Invoices;
    };

    entity GoodsReceipts as projection on my.GoodsReceipts;
    entity PurchaseItems as projection on my.PurchaseItems;
    entity Suppliers as projection on my.BusinessPartners {
        *
    } where bpRole = 'Supplier';
    entity Invoices as projection on my.Invoices where orderType = 'Purchase';

    @readonly
    entity Statuses {
        key code : String;
            name : String;
    }
}
