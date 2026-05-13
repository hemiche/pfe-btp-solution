using { AdminService } from './admin-service';

annotate AdminService.BusinessPartners with @(
    UI: {
        SelectionFields: [ companyName, bpRole ],
        LineItem: [
            { Value: companyName, Label: 'Entreprise' },
            { Value: firstName, Label: 'Prénom' },
            { Value: lastName, Label: 'Nom' },
            { Value: email, Label: 'Email' },
            { Value: bpRole, Label: 'Rôle' },
            { Value: createdAt, Label: 'Créé le' }
        ],
        HeaderInfo: {
            TypeName: 'Partenaire',
            TypeNamePlural: 'Partenaires',
            Title: { Value: companyName }
        },
        Facets: [
            {
                $Type: 'UI.ReferenceFacet',
                Label: 'Informations Générales',
                Target: '@UI.FieldGroup#General'
            }
        ],
        FieldGroup #General: {
            Data: [
                { Value: companyName },
                { Value: firstName },
                { Value: lastName },
                { Value: email },
                { Value: phoneNumber },
                { Value: taxID }
            ]
        }
    }
);

annotate AdminService.Products with @(
    UI: {
        SelectionFields: [ name, category ],
        LineItem: [
            { Value: name, Label: 'Produit' },
            { Value: category, Label: 'Catégorie' },
            { Value: price, Label: 'Prix' },
            { Value: currency_code, Label: 'Devise' },
            { Value: stockLevel, Label: 'Stock' }
        ],
        HeaderInfo: {
            TypeName: 'Produit',
            TypeNamePlural: 'Produits',
            Title: { Value: name }
        }
    }
);
