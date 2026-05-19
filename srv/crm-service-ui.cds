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
        SelectionFields: [ orderNumber, status, client, orderDate ],
        LineItem: [
            { Value: orderNumber, Label: 'N° Commande', Importance: #High, ![@HTML5.CssDefaults]: { width: '9rem' } },
            { Value: client.companyName, Label: 'Client', Importance: #High, ![@HTML5.CssDefaults]: { width: '13rem' } },
            { Value: orderDate, Label: 'Date', Importance: #High, ![@HTML5.CssDefaults]: { width: '8rem' } },
            { Value: totalAmount, Label: 'Montant Total', Importance: #High, ![@HTML5.CssDefaults]: { width: '9rem' } },
            { Value: currency_code, Label: 'Devise', Importance: #High, ![@HTML5.CssDefaults]: { width: '5rem' } },
            { 
                Value: status, 
                Label: 'Statut',
                Importance: #High,
                ![@HTML5.CssDefaults]: { width: '7rem' },
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
        SelectionFields: [ quoteNumber, status, client, quoteDate ],
        LineItem: [
            { Value: quoteNumber, Label: 'N° Devis', Importance: #High, ![@HTML5.CssDefaults]: { width: '8rem' } },
            { Value: client.companyName, Label: 'Client', Importance: #High, ![@HTML5.CssDefaults]: { width: '13rem' } },
            { Value: quoteDate, Label: 'Date Devis', Importance: #High, ![@HTML5.CssDefaults]: { width: '8rem' } },
            { Value: totalAmount, Label: 'Montant Total', Importance: #High, ![@HTML5.CssDefaults]: { width: '9rem' } },
            { Value: currency_code, Label: 'Devise', Importance: #High, ![@HTML5.CssDefaults]: { width: '5rem' } },
            { Value: status, Label: 'Statut', Importance: #High, ![@HTML5.CssDefaults]: { width: '7rem' } },
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
