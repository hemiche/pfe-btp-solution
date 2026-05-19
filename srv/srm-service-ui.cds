using { SRMService } from './srm-service';

// ─── TRANSLATIONS & VALUELISTS FOR RFQs ─────────────────────────────────────
annotate SRMService.RFQs with {
    rfqNumber   @title: 'N° RFQ' @Common.Label: 'N° RFQ' @readonly;
    supplier_ID @title: 'Fournisseur' @Common.Label: 'Fournisseur'
                @Common.Text: supplier.companyName
                @Common.TextArrangement: #TextOnly
                @Common.ValueListWithFixedValues
                @Common.ValueList: {
                    Label: 'Fournisseurs',
                    CollectionPath: 'Suppliers',
                    Parameters: [
                        { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: supplier_ID, ValueListProperty: 'ID' },
                        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'companyName' },
                        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'fullNameResponsible' },
                        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'secteurActivite' },
                        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'wilaya' }
                    ]
                };
    rfqDate     @title: 'Date RFQ' @Common.Label: 'Date RFQ';
    totalAmount @title: 'Montant Total' @Common.Label: 'Montant Total';
    currency    @title: 'Devise' @Common.Label: 'Devise';
    status      @title: 'Statut' @Common.Label: 'Statut'
                @Common.Text: statusText
                @Common.TextArrangement: #TextOnly
                @Common.ValueListWithFixedValues
                @Common.ValueList: {
                    Label: 'Statuts',
                    CollectionPath: 'Statuses',
                    Parameters: [
                        { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: status, ValueListProperty: 'code' },
                        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
                    ]
                };
    statusText  @title: 'Description Statut' @Common.Label: 'Description Statut' @readonly;
};

annotate SRMService.PurchaseOrders with {
    poNumber    @title: 'N° Bon de Commande' @Common.Label: 'N° Bon de Commande' @readonly;
    supplier_ID @title: 'Fournisseur' @Common.Label: 'Fournisseur'
                @Common.Text: supplier.companyName
                @Common.TextArrangement: #TextOnly;
    poDate      @title: 'Date Commande' @Common.Label: 'Date Commande';
    totalAmount @title: 'Montant Total' @Common.Label: 'Montant Total';
    currency    @title: 'Devise' @Common.Label: 'Devise';
    status      @title: 'Statut' @Common.Label: 'Statut'
                @Common.Text: statusText
                @Common.TextArrangement: #TextOnly
                @Common.ValueListWithFixedValues
                @Common.ValueList: {
                    Label: 'Statuts',
                    CollectionPath: 'Statuses',
                    Parameters: [
                        { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: status, ValueListProperty: 'code' },
                        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
                    ]
                };
    statusText  @title: 'Description Statut' @Common.Label: 'Description Statut' @readonly;
};

annotate SRMService.Suppliers with {
    ID                  @UI.Hidden;
    companyName         @title: 'Nom de l''Entreprise' @Common.Label: 'Nom de l''Entreprise';
    fullNameResponsible @title: 'Responsable' @Common.Label: 'Responsable';
    secteurActivite     @title: 'Secteur d''Activité' @Common.Label: 'Secteur d''Activité';
    wilaya              @title: 'Wilaya' @Common.Label: 'Wilaya';
    email               @title: 'Email' @Common.Label: 'Email';
    phoneNumber         @title: 'Téléphone' @Common.Label: 'Téléphone';
};

// ─── UI : RFQs ──────────────────────────────────────────────────────────────
annotate SRMService.RFQs with @(
    UI: {
        SelectionFields: [ rfqNumber, status, supplier, rfqDate ],
        LineItem: [
            { Value: rfqNumber, Label: 'N° RFQ', Importance: #High, ![@HTML5.CssDefaults]: { width: '8rem' } },
            { Value: supplier.companyName, Label: 'Fournisseur', Importance: #High, ![@HTML5.CssDefaults]: { width: '13rem' } },
            { Value: rfqDate, Label: 'Date RFQ', Importance: #High, ![@HTML5.CssDefaults]: { width: '8rem' } },
            { Value: totalAmount, Label: 'Montant Total', Importance: #High, ![@HTML5.CssDefaults]: { width: '9rem' } },
            { 
                Value: status, 
                Label: 'Statut', 
                Importance: #High, 
                ![@HTML5.CssDefaults]: { width: '7rem' },
                Criticality: rfqCriticality,
                CriticalityRepresentation: #WithoutIcon
            },
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
                { Value: totalAmount },
                { Value: status }
            ]
        },
        Identification: [
            { $Type: 'UI.DataFieldForAction', Action: 'SRMService.convertToPO', Label: 'Convertir en Bon de Commande' }
        ]
    }
);

// ─── TRANSLATIONS & VALUELISTS FOR RFQ ITEMS ────────────────────────────────
annotate SRMService.RFQItems with {
    product_ID  @title: 'Produit' @Common.Label: 'Produit'
                @Common.Text: product.name
                @Common.TextArrangement: #TextOnly
                @Common.ValueListWithFixedValues
                @Common.ValueList: {
                    Label: 'Produits',
                    CollectionPath: 'Products',
                    Parameters: [
                        { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: product_ID, ValueListProperty: 'ID' },
                        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' },
                        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'sku' },
                        { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'price' }
                    ]
                };
    quantity    @title: 'Quantité' @Common.Label: 'Quantité';
    price       @title: 'Prix Unitaire' @Common.Label: 'Prix Unitaire';
};

annotate SRMService.RFQItems with @(
    UI: {
        LineItem: [
            { Value: product_ID, Label: 'Produit' },
            { Value: quantity, Label: 'Quantité' },
            { Value: price, Label: 'Prix Unitaire' }
        ]
    }
);

// ─── UI : PurchaseOrders ────────────────────────────────────────────────────
annotate SRMService.PurchaseOrders with @(
    UI: {
        SelectionFields: [ poNumber, status, supplier, poDate ],
        LineItem: [
            { Value: poNumber, Label: 'N° Bon de Commande', Importance: #High, ![@HTML5.CssDefaults]: { width: '9rem' } },
            { Value: supplier.companyName, Label: 'Fournisseur', Importance: #High, ![@HTML5.CssDefaults]: { width: '13rem' } },
            { Value: poDate, Label: 'Date', Importance: #High, ![@HTML5.CssDefaults]: { width: '8rem' } },
            { Value: totalAmount, Label: 'Montant Total', Importance: #High, ![@HTML5.CssDefaults]: { width: '9rem' } },
            { Value: statusText, Label: 'Statut', Importance: #High, ![@HTML5.CssDefaults]: { width: '7rem' } },
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
                { Value: totalAmount },
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
            { Value: product_ID, Label: 'Produit' },
            { Value: quantity, Label: 'Quantité' },
            { Value: price, Label: 'Prix Unitaire' }
        ]
    }
);

annotate SRMService.PurchaseItems with {
    product_ID  @title: 'Produit' @Common.Label: 'Produit'
                @Common.Text: product.name
                @Common.TextArrangement: #TextOnly;
    quantity    @title: 'Quantité' @Common.Label: 'Quantité';
    price       @title: 'Prix Unitaire' @Common.Label: 'Prix Unitaire';
};

annotate SRMService.Suppliers with @(
    UI: {
        LineItem: [
            { Value: companyName, Label: 'Fournisseur' },
            { Value: email, Label: 'Email' },
            { Value: phoneNumber, Label: 'Téléphone' }
        ]
    }
);

// ─── SIDE EFFECTS FOR AUTOMATIC TOTAL AMOUNT RECALCULATION ───────────────────
annotate SRMService.RFQItems with @(
    Common.SideEffects: {
        SourceProperties: [ quantity, price ],
        TargetProperties: [ 'rfq/totalAmount' ]
    }
);

annotate SRMService.PurchaseItems with @(
    Common.SideEffects: {
        SourceProperties: [ quantity, price ],
        TargetProperties: [ 'order/totalAmount' ]
    }
);
