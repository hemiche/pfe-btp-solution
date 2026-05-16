using { pfe.btp as my } from '../db/schema';

service AdminService @(requires: 'Admin') {
    entity BusinessPartners as projection on my.BusinessPartners actions {
        @cds.odata.bindingparameter.name: '_it'
        @Common.SideEffects: { TargetProperties: ['_it/status', '_it/statusText'] }
        @Core.OperationAvailable: { $edmJson: { $Ne: [ { $Path: '_it/status' }, 'Approved' ] } }
        action approve();

        @cds.odata.bindingparameter.name: '_it'
        @Common.SideEffects: { TargetProperties: ['_it/status', '_it/statusText', '_it/motifRefus'] }
        @Core.OperationAvailable: { $edmJson: { $Ne: [ { $Path: '_it/status' }, 'Approved' ] } }
        action rejectPartner(motifRefus: String(500) @title: 'Motif du refus');
    };
    entity Products as projection on my.Products;
    entity Addresses as projection on my.Addresses;
    entity BusinessPartnerDocuments as projection on my.BusinessPartnerDocuments;
}
