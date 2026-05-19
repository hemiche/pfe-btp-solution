using { pfe.btp as my } from '../db/schema';

service AdminService @(requires: 'Admin') {

    // ─── INSCRIPTIONS (En attente / Refusées) ─────────────────────────────────
    entity Inscriptions as projection on my.BusinessPartners {
        *,
        case bpRole
            when 'Supplier' then 'Fournisseur'
            when 'Both'     then 'Client & Fournisseur'
            else bpRole
        end as bpRoleText : String
    } where status = 'Pending' or status = 'Rejected'
    actions {
        @cds.odata.bindingparameter.name: '_it'
        @Common.SideEffects: { TargetProperties: ['_it/status', '_it/statusText'] }
        @Core.OperationAvailable: { $edmJson: { $Ne: [ { $Path: '_it/status' }, 'Approved' ] } }
        action approve();

        @cds.odata.bindingparameter.name: '_it'
        @Common.SideEffects: { TargetProperties: ['_it/status', '_it/statusText', '_it/motifRefus'] }
        @Core.OperationAvailable: { $edmJson: { $Ne: [ { $Path: '_it/status' }, 'Approved' ] } }
        action rejectPartner(motifRefus: String(500) @title: 'Motif du refus');

        @cds.odata.bindingparameter.name: '_it'
        action downloadRegistrationPDF() returns String;
    };

    // ─── PARTENAIRES APPROUVÉS ────────────────────────────────────────────────
    @cds.redirection.target
    entity BusinessPartners as projection on my.BusinessPartners {
        *,
        case bpRole
            when 'Supplier' then 'Fournisseur'
            when 'Both'     then 'Client & Fournisseur'
            else bpRole
        end as bpRoleText : String
    } where status = 'Approved' or status = 'Blocked'
    actions {
        @cds.odata.bindingparameter.name: '_it'
        @Common.SideEffects: { TargetProperties: ['_it/status', '_it/statusText', '_it/motifBlocage'] }
        @Core.OperationAvailable: { $edmJson: { $Eq: [ { $Path: '_it/status' }, 'Approved' ] } }
        action blockPartner(motifBlocage: String(500) @title: 'Motif du blocage');

        @cds.odata.bindingparameter.name: '_it'
        @Common.SideEffects: { TargetProperties: ['_it/status', '_it/statusText'] }
        @Core.OperationAvailable: { $edmJson: { $Eq: [ { $Path: '_it/status' }, 'Blocked' ] } }
        action activatePartner();

        @cds.odata.bindingparameter.name: '_it'
        action downloadBusinessPartnerPDF() returns String;
    };

    // ─── CATALOGUE PRODUITS ───────────────────────────────────────────────────
    @odata.draft.enabled
    entity Products as projection on my.Products;

    // ─── ADRESSES & DOCUMENTS ─────────────────────────────────────────────────
    entity Addresses                as projection on my.Addresses;
    entity BusinessPartnerDocuments as projection on my.BusinessPartnerDocuments;

    // ─── PARAMÈTRES & SÉCURITÉ ────────────────────────────────────────────────
    @readonly entity AuditLogs      as projection on my.AuditLogs;
    entity Notifications            as projection on my.Notifications;
    entity SystemConfigs            as projection on my.SystemConfigs;
    entity NumberRanges             as projection on my.NumberRanges;

    // ─── ACTIONS PDF GLOBALES ─────────────────────────────────────────────────
    action downloadFacturePDF(invoiceId: UUID) returns String;
    action downloadDevisPDF(quoteId: UUID)     returns String;

    entity Categories as projection on my.Categories;

    action createCategory(code: String(100) @title: 'Nom de la catégorie') returns Categories;

    @readonly
    entity ProductTypes {
        key code : String;
            name : String;
    }

    @readonly
    entity UnitOfMeasures {
        key code : String;
            name : String;
    }
}
