using { CRMService } from './crm-service';

annotate CRMService.SalesOrders with {
    status @Common.ValueListWithFixedValues;
    orderNumber @Common.FilterExpressionRestrictions: [{ Property: orderNumber, AllowedExpressions: #SingleValue }];
};

annotate CRMService.Quotes with {
    status @Common.ValueListWithFixedValues;
    quoteNumber @Common.FilterExpressionRestrictions: [{ Property: quoteNumber, AllowedExpressions: #SingleValue }];
};

annotate CRMService.SalesOrders with @(
    UI: {
        SelectionFields: [ orderNumber, status ],
        LineItem: [
            { Value: orderNumber, Label: 'N° Commande' },
            { Value: client.companyName, Label: 'Client' },
            { Value: orderDate, Label: 'Date' },
            { Value: totalAmount, Label: 'Montant Total' },
            { Value: currency_code, Label: 'Devise' },
            { 
                Value: status, 
                Label: 'Statut',
                Criticality: #Positive // Simple color mapping for demo
            },
            { $Type: 'UI.DataFieldForAction', Action: 'CRMService.generateInvoice', Label: 'Générer Facture' }
        ],
        HeaderInfo: {
            TypeName: 'Commande Client',
            TypeNamePlural: 'Commandes Clients',
            Title: { Value: orderNumber }
        },
        Facets: [
            {
                $Type: 'UI.ReferenceFacet',
                Label: 'Détails Commande',
                Target: '@UI.FieldGroup#Details'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Label: 'Articles',
                Target: 'items/@UI.LineItem'
            }
        ],
        FieldGroup #Details: {
            Data: [
                { Value: orderNumber },
                { Value: client_ID },
                { Value: orderDate },
                { Value: status }
            ]
        },
        Identification: [
            { $Type: 'UI.DataFieldForAction', Action: 'CRMService.generateInvoice', Label: 'Générer Facture' }
        ]
    }
);

annotate CRMService.Quotes with @(
    UI: {
        SelectionFields: [ quoteNumber, status ],
        LineItem: [
            { Value: quoteNumber, Label: 'N° Devis' },
            { Value: client.companyName, Label: 'Client' },
            { Value: quoteDate, Label: 'Date Devis' },
            { Value: totalAmount, Label: 'Montant Total' },
            { Value: currency_code, Label: 'Devise' },
            { Value: status, Label: 'Statut' },
            { $Type: 'UI.DataFieldForAction', Action: 'CRMService.convertToOrder', Label: 'Convertir en Commande' }
        ],
        HeaderInfo: {
            TypeName: 'Devis',
            TypeNamePlural: 'Devis',
            Title: { Value: quoteNumber }
        },
        Facets: [
            {
                $Type: 'UI.ReferenceFacet',
                Label: 'Détails Devis',
                Target: '@UI.FieldGroup#Details'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Label: 'Articles',
                Target: 'items/@UI.LineItem'
            }
        ],
        FieldGroup #Details: {
            Data: [
                { Value: quoteNumber },
                { Value: client_ID },
                { Value: quoteDate },
                { Value: validUntil },
                { Value: status }
            ]
        },
        Identification: [
            { $Type: 'UI.DataFieldForAction', Action: 'CRMService.convertToOrder', Label: 'Convertir en Commande' }
        ]
    }
);

annotate CRMService.QuoteItems with @(
    UI: {
        LineItem: [
            { Value: product.name, Label: 'Produit' },
            { Value: quantity, Label: 'Quantité' },
            { Value: price, Label: 'Prix Unitaire' }
        ]
    }
);

annotate CRMService.SalesItems with @(
    UI: {
        LineItem: [
            { Value: product.name, Label: 'Produit' },
            { Value: quantity, Label: 'Quantité' },
            { Value: price, Label: 'Prix Unitaire' }
        ]
    }
);
