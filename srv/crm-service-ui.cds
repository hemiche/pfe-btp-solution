using { CRMService } from './crm-service';

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
            }
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
        }
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
