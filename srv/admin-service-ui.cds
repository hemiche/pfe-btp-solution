using { AdminService } from './admin-service';

annotate AdminService.BusinessPartnerDocuments with {
    content @Core.MediaType: mediaType @Core.ContentDisposition: {
        Filename: fileName,
        Type    : 'inline'
    };
};

annotate AdminService.BusinessPartners with {
    status      @Common.Text: statusText @Common.TextArrangement: #TextOnly @Common.ValueListWithFixedValues;
    companyName @title: 'Entreprise' @Common.FilterExpressionRestrictions: [{ Property: companyName, AllowedExpressions: #SingleValue }];
    email       @title: 'Email';
    bpRole      @title: 'Rôle' @Common.ValueListWithFixedValues;
    statusText  @title: 'Statut';
};

annotate AdminService.BusinessPartners with @(
    UI: {
        SelectionFields: [ companyName, bpRole, status ],
        LineItem: [
            { $Type: 'UI.DataFieldForAction', Action: 'AdminService.approve', Label: 'Approuver' },
            { $Type: 'UI.DataFieldForAction', Action: 'AdminService.rejectPartner', Label: 'Refuser' },
            { Value: companyName, Label: 'Entreprise' },
            { Value: email, Label: 'Email' },
            { Value: bpRole, Label: 'Rôle' },
            { Value: status, Label: 'Statut' },
            { Value: createdAt, Label: 'Créé le' }
        ],
        HeaderInfo: {
            TypeName: 'Partenaire',
            TypeNamePlural: 'Partenaires',
            Title: { Value: companyName }
        },
        Identification: [
            { $Type: 'UI.DataFieldForAction', Action: 'AdminService.approve', Label: 'Approuver' },
            { $Type: 'UI.DataFieldForAction', Action: 'AdminService.rejectPartner', Label: 'Refuser' }
        ],
        Facets: [
            {
                $Type: 'UI.ReferenceFacet',
                Label: 'Informations Générales',
                Target: '@UI.FieldGroup#General'
            },
            {
                $Type: 'UI.ReferenceFacet',
                Label: 'Documents (PDF)',
                Target: 'documents/@UI.LineItem'
            }
        ],
        FieldGroup #General: {
            Data: [
                { Value: companyName, Label: 'Entreprise' },
                { Value: secteurActivite, Label: 'Secteur d''activité' },
                { Value: fullNameResponsible, Label: 'Responsable' },
                { Value: rc, Label: 'Registre de Commerce (RC)' },
                { Value: rib, Label: 'RIB' },
                { Value: nif, Label: 'NIF' },
                { Value: ai, Label: 'Article d''Imposition AI (11 chiffres)' },
                { Value: email, Label: 'Email' },
                { Value: phoneNumber, Label: 'Téléphone' },
                { Value: status, Label: 'Statut Actuel' },
                { Value: motifRefus, Label: 'Motif de refus' }
            ]
        }
    }
);

annotate AdminService.BusinessPartnerDocuments with @(
    UI: {
        LineItem: [
            { Value: fileName, Label: 'Nom du fichier' },
            { Value: docType, Label: 'Type de document' },
            { Value: content, Label: 'Aperçu Document' }
        ],
        HeaderInfo: {
            TypeName: 'Document',
            TypeNamePlural: 'Documents',
            Title: { Value: fileName },
            Description: { Value: docType }
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
