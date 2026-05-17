using { SRMService } from './srm-service';

annotate SRMService.RFQs with {
    status @Common.ValueListWithFixedValues;
    rfqNumber @Common.FilterExpressionRestrictions: [{ Property: rfqNumber, AllowedExpressions: #SingleValue }];
};

annotate SRMService.PurchaseOrders with {
    status @Common.ValueListWithFixedValues;
    poNumber @Common.FilterExpressionRestrictions: [{ Property: poNumber, AllowedExpressions: #SingleValue }];
};

annotate SRMService.Suppliers with {
    companyName @Common.FilterExpressionRestrictions: [{ Property: companyName, AllowedExpressions: #SingleValue }];
};

annotate SRMService.RFQs with @(
    UI: {
        SelectionFields: [ rfqNumber, status ],
        LineItem: [
            { Value: rfqNumber, Label: 'N° RFQ' },
            { Value: supplier.companyName, Label: 'Fournisseur' },
            { Value: rfqDate, Label: 'Date RFQ' },
            { Value: totalAmount, Label: 'Montant Total' },
            { Value: currency_code, Label: 'Devise' },
            { Value: status, Label: 'Statut' },
            { $Type: 'UI.DataFieldForAction', Action: 'SRMService.convertToPO', Label: 'Convertir en Bon de Commande' }
        ],
        HeaderInfo: {
            TypeName: 'Demande d''Offre',
            TypeNamePlural: 'Demandes d''Offre',
            Title: { Value: rfqNumber }
        },
        Facets: [
            { $Type: 'UI.ReferenceFacet', Label: 'Détails RFQ', Target: '@UI.FieldGroup#Details' },
            { $Type: 'UI.ReferenceFacet', Label: 'Articles', Target: 'items/@UI.LineItem' }
        ],
        FieldGroup #Details: {
            Data: [
                { Value: rfqNumber },
                { Value: supplier_ID },
                { Value: rfqDate },
                { Value: status }
            ]
        },
        Identification: [
            { $Type: 'UI.DataFieldForAction', Action: 'SRMService.convertToPO', Label: 'Convertir en Bon de Commande' }
        ]
    }
);

annotate SRMService.PurchaseOrders with @(
    UI: {
        SelectionFields: [ poNumber, status ],
        LineItem: [
            { Value: poNumber, Label: 'N° Bon de Commande' },
            { Value: supplier.companyName, Label: 'Fournisseur' },
            { Value: poDate, Label: 'Date' },
            { Value: totalAmount, Label: 'Montant Total' },
            { Value: currency_code, Label: 'Devise' },
            { Value: status, Label: 'Statut' },
            { $Type: 'UI.DataFieldForAction', Action: 'SRMService.generateSupplierInvoice', Label: 'Générer Facture Fournisseur' }
        ],
        HeaderInfo: {
            TypeName: 'Bon de Commande',
            TypeNamePlural: 'Bons de Commande',
            Title: { Value: poNumber }
        },
        Facets: [
            { $Type: 'UI.ReferenceFacet', Label: 'Détails Commande', Target: '@UI.FieldGroup#Details' },
            { $Type: 'UI.ReferenceFacet', Label: 'Articles', Target: 'items/@UI.LineItem' }
        ],
        FieldGroup #Details: {
            Data: [
                { Value: poNumber },
                { Value: supplier_ID },
                { Value: poDate },
                { Value: status }
            ]
        },
        Identification: [
            { $Type: 'UI.DataFieldForAction', Action: 'SRMService.generateSupplierInvoice', Label: 'Générer Facture Fournisseur' }
        ]
    }
);

annotate SRMService.PurchaseItems with @(
    UI: {
        LineItem: [
            { Value: product.name, Label: 'Produit' },
            { Value: quantity, Label: 'Quantité' },
            { Value: price, Label: 'Prix Unitaire' }
        ]
    }
);

annotate SRMService.Suppliers with @(
    UI: {
        LineItem: [
            { Value: companyName, Label: 'Fournisseur' },
            { Value: email, Label: 'Email' },
            { Value: phoneNumber, Label: 'Téléphone' }
        ]
    }
);
