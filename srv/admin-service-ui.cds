using { AdminService } from './admin-service';

// ─── MEDIA ────────────────────────────────────────────────────────────────────
annotate AdminService.BusinessPartnerDocuments with {
    content @Core.MediaType: mediaType @Core.ContentDisposition: {
        Filename: fileName,
        Type    : 'inline'
    };
};

// ─── FIELD LABELS : BusinessPartners & Inscriptions ──────────────────────────
annotate AdminService.BusinessPartners with {
    status          @Common.Text: statusText @Common.TextArrangement: #TextOnly @Common.ValueListWithFixedValues;
    companyName     @title: 'Entreprise';
    email           @title: 'Email';
    bpRole          @title: 'Rôle' @Common.Text: bpRoleText @Common.TextArrangement: #TextOnly @Common.ValueListWithFixedValues;
    clientType      @title: 'Type Client' @Common.ValueListWithFixedValues;
    wilaya          @title: 'Wilaya';
    secteurActivite @title: 'Secteur d''activité';
    statusText      @title: 'Statut';
    motifBlocage    @title: 'Motif de blocage';
    phoneNumber     @title: 'Téléphone';
};

annotate AdminService.Inscriptions with {
    status          @Common.Text: statusText @Common.TextArrangement: #TextOnly @Common.ValueListWithFixedValues;
    companyName     @title: 'Entreprise';
    email           @title: 'Email';
    bpRole          @title: 'Rôle' @Common.Text: bpRoleText @Common.TextArrangement: #TextOnly @Common.ValueListWithFixedValues;
    clientType      @title: 'Type Client' @Common.ValueListWithFixedValues;
    wilaya          @title: 'Wilaya';
    statusText      @title: 'Statut';
    motifRefus      @title: 'Motif de refus';
};

// ─── UI : BusinessPartners LIST ───────────────────────────────────────────────
annotate AdminService.BusinessPartners with @(
    UI: {
        SelectionFields: [ companyName, bpRole, clientType, wilaya, secteurActivite, status ],
        LineItem: [
            { $Type: 'UI.DataFieldForAction', Action: 'AdminService.blockPartner',    Label: 'Bloquer' },
            { $Type: 'UI.DataFieldForAction', Action: 'AdminService.activatePartner', Label: 'Activer' },
            { Value: companyName,     Label: 'Entreprise',     Importance: #High, ![@HTML5.CssDefaults]: { width: '12rem' } },
            { Value: clientType,      Label: 'Type',           Importance: #High, ![@HTML5.CssDefaults]: { width: '6rem' } },
            { Value: bpRole,          Label: 'Rôle',           Importance: #High, ![@HTML5.CssDefaults]: { width: '7rem' } },
            { Value: wilaya,          Label: 'Wilaya',         Importance: #High, ![@HTML5.CssDefaults]: { width: '8rem' } },
            { Value: secteurActivite, Label: 'Secteur',        Importance: #High, ![@HTML5.CssDefaults]: { width: '9rem' } },
            { Value: email,           Label: 'Email',          Importance: #High, ![@HTML5.CssDefaults]: { width: '13rem' } },
            { Value: phoneNumber,     Label: 'Téléphone',      Importance: #High, ![@HTML5.CssDefaults]: { width: '9rem' } },
            { 
                Value: status,          
                Label: 'Statut',         
                Importance: #High, 
                ![@HTML5.CssDefaults]: { width: '7rem' },
                Criticality: kycCriticality,
                CriticalityRepresentation: #WithoutIcon
            },
            { Value: createdAt,       Label: 'Inscrit le',     Importance: #High, ![@HTML5.CssDefaults]: { width: '9rem' } }
        ],
        HeaderInfo: {
            TypeName: 'Partenaire',
            TypeNamePlural: 'Partenaires',
            Title: { Value: companyName },
            Description: { Value: bpRoleText }
        },
        Facets: [
            { $Type: 'UI.ReferenceFacet', Label: 'Informations Générales', Target: '@UI.FieldGroup#General' },
            { $Type: 'UI.ReferenceFacet', Label: 'Documents (PDF)',         Target: 'documents/@UI.LineItem' }
        ],
        FieldGroup #General: {
            Data: [
                { Value: companyName,         Label: 'Entreprise' },
                { Value: clientType,          Label: 'Type Client (B2B / B2C)' },
                { Value: bpRole,              Label: 'Rôle' },
                { Value: wilaya,              Label: 'Wilaya' },
                { Value: secteurActivite,     Label: 'Secteur d''activité' },
                { Value: fullNameResponsible, Label: 'Responsable' },
                { Value: rc,                  Label: 'Registre de Commerce (RC)' },
                { Value: rib,                 Label: 'RIB' },
                { Value: nif,                 Label: 'NIF' },
                { Value: ai,                  Label: 'Article d''Imposition (AI)' },
                { Value: email,               Label: 'Email' },
                { Value: phoneNumber,         Label: 'Téléphone' },
                { Value: status,              Label: 'Statut Actuel' },
                { Value: motifBlocage,        Label: 'Motif de blocage' }
            ]
        }
    }
);

// ─── UI : Inscriptions LIST ───────────────────────────────────────────────────
annotate AdminService.Inscriptions with @(
    UI: {
        SelectionFields: [ companyName, bpRole, clientType, status ],
        LineItem: [
            { $Type: 'UI.DataFieldForAction', Action: 'AdminService.approve',       Label: 'Approuver' },
            { $Type: 'UI.DataFieldForAction', Action: 'AdminService.rejectPartner', Label: 'Refuser' },
            { Value: companyName, Label: 'Entreprise', Importance: #High, ![@HTML5.CssDefaults]: { width: '13rem' } },
            { Value: clientType,  Label: 'Type',       Importance: #High, ![@HTML5.CssDefaults]: { width: '7rem' } },
            { Value: bpRole,      Label: 'Rôle',       Importance: #High, ![@HTML5.CssDefaults]: { width: '8rem' } },
            { Value: wilaya,      Label: 'Wilaya',     Importance: #High, ![@HTML5.CssDefaults]: { width: '9rem' } },
            { Value: email,       Label: 'Email',      Importance: #High, ![@HTML5.CssDefaults]: { width: '13rem' } },
            { 
                Value: status,      
                Label: 'Statut',     
                Importance: #High, 
                ![@HTML5.CssDefaults]: { width: '7rem' },
                Criticality: kycCriticality,
                CriticalityRepresentation: #WithoutIcon
            },
            { Value: createdAt,   Label: 'Créé le',    Importance: #High, ![@HTML5.CssDefaults]: { width: '9rem' } }
        ],
        HeaderInfo: {
            TypeName: 'Inscription',
            TypeNamePlural: 'Inscriptions',
            Title: { Value: companyName },
            Description: { Value: clientType }
        },
        Identification: [
            { $Type: 'UI.DataFieldForAction', Action: 'AdminService.approve',       Label: 'Approuver' },
            { $Type: 'UI.DataFieldForAction', Action: 'AdminService.rejectPartner', Label: 'Refuser' }
        ],
        Facets: [
            { $Type: 'UI.ReferenceFacet', Label: 'Informations Générales', Target: '@UI.FieldGroup#General' },
            { $Type: 'UI.ReferenceFacet', Label: 'Documents (PDF)',         Target: 'documents/@UI.LineItem' }
        ],
        FieldGroup #General: {
            Data: [
                { Value: companyName,         Label: 'Entreprise' },
                { Value: clientType,          Label: 'Type Client (B2B / B2C)' },
                { Value: bpRole,              Label: 'Rôle' },
                { Value: wilaya,              Label: 'Wilaya' },
                { Value: secteurActivite,     Label: 'Secteur d''activité' },
                { Value: fullNameResponsible, Label: 'Responsable' },
                { Value: rc,                  Label: 'Registre de Commerce (RC)' },
                { Value: rib,                 Label: 'RIB' },
                { Value: nif,                 Label: 'NIF' },
                { Value: ai,                  Label: 'Article d''Imposition (AI)' },
                { Value: email,               Label: 'Email' },
                { Value: phoneNumber,         Label: 'Téléphone' },
                { Value: status,              Label: 'Statut Actuel' },
                { Value: motifRefus,          Label: 'Motif de refus' }
            ]
        }
    }
);

// ─── UI : BusinessPartnerDocuments ────────────────────────────────────────────
annotate AdminService.BusinessPartnerDocuments with @(
    UI: {
        LineItem: [
            { Value: fileName, Label: 'Nom du fichier' },
            { Value: docType,  Label: 'Type de document' },
            { Value: content,  Label: 'Aperçu Document' }
        ],
        HeaderInfo: {
            TypeName: 'Document',
            TypeNamePlural: 'Documents',
            Title: { Value: fileName },
            Description: { Value: docType }
        }
    }
);

// ─── UI : Products ────────────────────────────────────────────────────────────
annotate AdminService.Products with {
    sku           @title: 'Code SKU';
    name          @title: 'Désignation';
    productType   @title: 'Type'
                  @Common.ValueListWithFixedValues
                  @Common.ValueList: {
                      Label: 'Types de produit',
                      CollectionPath: 'ProductTypes',
                      Parameters: [
                          { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: productType, ValueListProperty: 'code' }
                      ]
                  };
    category      @title: 'Catégorie'
                  @Common.ValueListWithFixedValues
                  @Common.ValueList: {
                      Label: 'Catégories',
                      CollectionPath: 'Categories',
                      Parameters: [
                          { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: category, ValueListProperty: 'code' }
                      ]
                  };
    price         @title: 'Prix HT';
    tvaRate       @title: 'TVA (%)';
    unitOfMeasure @title: 'Unité'
                  @Common.ValueListWithFixedValues
                  @Common.ValueList: {
                      Label: 'Unités de mesure',
                      CollectionPath: 'UnitOfMeasures',
                      Parameters: [
                          { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: unitOfMeasure, ValueListProperty: 'code' },
                          { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
                      ]
                  };
    stockLevel    @title: 'Stock Actuel';
    stockMinimum  @title: 'Stock Minimum';
    isActive      @title: 'Actif';
};

annotate AdminService.Products with @(
    UI: {
        SelectionFields: [ name, category, productType, isActive ],
        LineItem: [
            { $Type: 'UI.DataFieldForAction', Action: 'AdminService.EntityContainer/createCategory', Label: 'Créer une Catégorie' },
            { Value: sku,           Label: 'Code SKU',           Importance: #High, ![@HTML5.CssDefaults]: { width: '8.5rem' } },
            { Value: name,          Label: 'Désignation',        Importance: #High, ![@HTML5.CssDefaults]: { width: '13rem' } },
            { Value: productType,   Label: 'Type',               Importance: #High, ![@HTML5.CssDefaults]: { width: '6.5rem' } },
            { Value: category,      Label: 'Catégorie',          Importance: #High, ![@HTML5.CssDefaults]: { width: '8.5rem' } },
            { Value: price,         Label: 'Prix HT',            Importance: #High, ![@HTML5.CssDefaults]: { width: '7.5rem' } },
            { Value: tvaRate,       Label: 'TVA (%)',            Importance: #High, ![@HTML5.CssDefaults]: { width: '5.5rem' } },
            { Value: unitOfMeasure, Label: 'Unité',             Importance: #High, ![@HTML5.CssDefaults]: { width: '6rem' } },
            { 
                Value: stockLevel,    
                Label: 'Stock',              
                Importance: #High, 
                ![@HTML5.CssDefaults]: { width: '5.5rem' },
                Criticality: stockCriticality,
                CriticalityRepresentation: #WithoutIcon
            },
            { Value: stockMinimum,  Label: 'Stock Min.',         Importance: #High, ![@HTML5.CssDefaults]: { width: '6.5rem' } },
            { Value: isActive,      Label: 'Actif',              Importance: #High, ![@HTML5.CssDefaults]: { width: '5.5rem' } }
        ],
        HeaderInfo: {
            TypeName: 'Produit',
            TypeNamePlural: 'Produits',
            Title: { Value: name },
            Description: { Value: sku }
        },
        Facets: [
            { $Type: 'UI.ReferenceFacet', Label: 'Détails Produit', Target: '@UI.FieldGroup#ProductDetails' }
        ],
        FieldGroup #ProductDetails: {
            Data: [
                { Value: sku,           Label: 'Code SKU' },
                { Value: name,          Label: 'Désignation' },
                { Value: description,   Label: 'Description' },
                { Value: productType,   Label: 'Type (Produit / Service)' },
                { Value: category,      Label: 'Catégorie' },
                { Value: price,         Label: 'Prix HT (DZD)' },
                { Value: tvaRate,       Label: 'Taux TVA (%)' },
                { Value: unitOfMeasure, Label: 'Unité de mesure' },
                { Value: stockLevel,    Label: 'Stock Actuel' },
                { Value: stockMinimum,  Label: 'Stock Minimum d''alerte' },
                { Value: isActive,      Label: 'Produit Actif' }
            ]
        }
    }
);

// ─── UI : AuditLogs ───────────────────────────────────────────────────────────
annotate AdminService.AuditLogs with @(
    UI: {
        SelectionFields: [ action, targetType, performedBy ],
        LineItem: [
            { Value: createdAt,   Label: 'Date/Heure',   Importance: #High, ![@HTML5.CssDefaults]: { width: '11rem' } },
            { Value: action,      Label: 'Action',       Importance: #High, ![@HTML5.CssDefaults]: { width: '8rem' } },
            { Value: targetType,  Label: 'Entité',       Importance: #High, ![@HTML5.CssDefaults]: { width: '8rem' } },
            { Value: targetLabel, Label: 'Cible',        Importance: #High, ![@HTML5.CssDefaults]: { width: '10rem' } },
            { Value: performedBy, Label: 'Effectué par', Importance: #High, ![@HTML5.CssDefaults]: { width: '10rem' } },
            { Value: detail,      Label: 'Détail',       Importance: #High, ![@HTML5.CssDefaults]: { width: '20rem' } }
        ],
        HeaderInfo: {
            TypeName: 'Log d''Audit',
            TypeNamePlural: 'Logs d''Audit',
            Title: { Value: action },
            Description: { Value: targetLabel }
        }
    }
);

// ─── UI : Notifications ───────────────────────────────────────────────────────
annotate AdminService.Notifications with @(
    UI: {
        SelectionFields: [ notifType, isRead ],
        LineItem: [
            { Value: createdAt,  Label: 'Envoyé le',   Importance: #High, ![@HTML5.CssDefaults]: { width: '11rem' } },
            { Value: title,      Label: 'Titre',       Importance: #High, ![@HTML5.CssDefaults]: { width: '14rem' } },
            { Value: message,    Label: 'Message',     Importance: #High, ![@HTML5.CssDefaults]: { width: '22rem' } },
            { Value: notifType,  Label: 'Type',        Importance: #High, ![@HTML5.CssDefaults]: { width: '7rem' } },
            { Value: isRead,     Label: 'Lu',          Importance: #High, ![@HTML5.CssDefaults]: { width: '5rem' } },
            { Value: sentBy,     Label: 'Envoyé par',  Importance: #High, ![@HTML5.CssDefaults]: { width: '9rem' } }
        ],
        HeaderInfo: {
            TypeName: 'Notification',
            TypeNamePlural: 'Notifications',
            Title: { Value: title },
            Description: { Value: notifType }
        },
        Facets: [
            { $Type: 'UI.ReferenceFacet', Label: 'Contenu', Target: '@UI.FieldGroup#NotifDetails' }
        ],
        FieldGroup #NotifDetails: {
            Data: [
                { Value: title,     Label: 'Titre' },
                { Value: message,   Label: 'Message' },
                { Value: notifType, Label: 'Type' },
                { Value: isRead,    Label: 'Lu' },
                { Value: sentBy,    Label: 'Envoyé par' }
            ]
        }
    }
);

// ─── UI : SystemConfigs ───────────────────────────────────────────────────────
annotate AdminService.SystemConfigs with @(
    UI: {
        SelectionFields: [ category, configKey ],
        LineItem: [
            { Value: category,    Label: 'Catégorie',   Importance: #High, ![@HTML5.CssDefaults]: { width: '9rem' } },
            { Value: configKey,   Label: 'Paramètre',   Importance: #High, ![@HTML5.CssDefaults]: { width: '12rem' } },
            { Value: configValue, Label: 'Valeur',      Importance: #High, ![@HTML5.CssDefaults]: { width: '12rem' } },
            { Value: description, Label: 'Description', Importance: #High, ![@HTML5.CssDefaults]: { width: '18rem' } }
        ],
        HeaderInfo: {
            TypeName: 'Configuration',
            TypeNamePlural: 'Configurations',
            Title: { Value: configKey },
            Description: { Value: configValue }
        }
    }
);

// ─── UI : NumberRanges ────────────────────────────────────────────────────────
annotate AdminService.NumberRanges with @(
    UI: {
        LineItem: [
            { Value: rangeType,   Label: 'Type',        Importance: #High, ![@HTML5.CssDefaults]: { width: '10rem' } },
            { Value: prefix,      Label: 'Préfixe',     Importance: #High, ![@HTML5.CssDefaults]: { width: '8rem' } },
            { Value: currentNum,  Label: 'Numéro Actuel', Importance: #High, ![@HTML5.CssDefaults]: { width: '8rem' } },
            { Value: description, Label: 'Description', Importance: #High, ![@HTML5.CssDefaults]: { width: '15rem' } }
        ],
        HeaderInfo: {
            TypeName: 'Plage de Numérotation',
            TypeNamePlural: 'Plages de Numérotation',
            Title: { Value: rangeType },
            Description: { Value: prefix }
        }
    }
);
