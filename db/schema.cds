namespace pfe.btp;

using {
    managed,
    cuid,
    Currency,
    Country
} from '@sap/cds/common';

type Status : String enum {
    Draft = 'Draft' @title: 'Brouillon';
    Pending = 'Pending' @title: 'En attente';
    Approved = 'Approved' @title: 'Approuvé';
    Rejected = 'Rejected' @title: 'Refusé';
    Completed = 'Completed' @title: 'Complété';
    Cancelled = 'Cancelled' @title: 'Annulé';
    Blocked = 'Blocked' @title: 'Bloqué';
}

aspect AuditFields : managed {
    statusText : String; // For UI display
}

/**
 * MODULE CORE : Business Partners
 */
entity BusinessPartners : cuid, AuditFields {
    firstName           : String(100);
    lastName            : String(100);
    fullNameResponsible : String(200);
    companyName         : String(200);
    email               : String(255);
    password            : String(255); // Hash ou mot de passe en clair pour le PFE
    secteurActivite     : String(100);
    rib                 : String(20);
    nif                 : String(15);
    ai                  : String(20);
    rc                  : String(20);
    motifRefus          : String(500);
    motifBlocage        : String(500);
    phoneNumber         : String(20);
    bpRole              : String enum {
        Client;
        Supplier;
        Both;
    };
    isB2B               : Boolean default true;
    taxID               : String(50);
    status              : Status default 'Pending'; // NEW: status for approval
    virtual kycCriticality : Integer;
    wilaya              : String(100);
    wilayaCode          : Integer;
    clientType          : String enum { B2B; B2C; } default 'B2B';
    address             : Composition of many Addresses on address.partner = $self;
    documents           : Composition of many BusinessPartnerDocuments on documents.partner = $self;
}

entity BusinessPartnerDocuments : cuid, managed {
    partner   : Association to BusinessPartners;
    docType   : String enum { RIB; NIF; AI; RC; };
    @Core.MediaType: mediaType
    content   : LargeBinary;
    @Core.IsMediaType: true
    mediaType : String;
    fileName  : String;
}

entity Addresses : cuid {
    partner : Association to BusinessPartners;
    street  : String(255);
    city    : String(100);
    zipCode : String(20);
    country : Country;
}

/**
 * MODULE CORE : Products
 */
entity Categories {
    key code : String(100) @title: 'Catégorie';
}

entity Products : cuid, AuditFields {
    sku          : String(50) @title: 'SKU / Référence';
    name         : String(200);
    description  : String(1000);
    category     : String(100);
    price        : Decimal(15, 2);
    tvaRate      : Integer;
    unitOfMeasure: String(20);
    currency     : Currency;
    stockLevel   : Integer;
    stockMinimum : Integer;
    productType  : String enum { Produit; Service; } default 'Produit';
    isActive     : Boolean default true;
    virtual stockCriticality : Integer;
}

/**
 * MODULE CRM : Sales Documents
 */
entity Quotes : cuid, AuditFields {
    quoteNumber : String(20);
    client      : Association to BusinessPartners;
    quoteDate   : Date;
    validUntil  : Date;
    totalAmount : Decimal(15, 2);
    currency    : Currency;
    status      : Status default 'Draft';
    items       : Composition of many QuoteItems on items.quote = $self;
}

entity QuoteItems : cuid {
    quote    : Association to Quotes;
    product  : Association to Products;
    quantity : Integer;
    price    : Decimal(15, 2);
}

entity SalesOrders : cuid, AuditFields {
    orderNumber : String(20);
    quote       : Association to Quotes;
    client      : Association to BusinessPartners;
    orderDate   : Date;
    totalAmount : Decimal(15, 2);
    currency    : Currency;
    status      : Status default 'Draft';
    items       : Composition of many SalesItems on items.order = $self;
}

entity SalesItems : cuid {
    order    : Association to SalesOrders;
    product  : Association to Products;
    quantity : Integer;
    price    : Decimal(15, 2);
}

/**
 * MODULE SRM : Purchase Documents
 */
entity RFQs : cuid, AuditFields {
    rfqNumber   : String(20);
    supplier_ID : UUID;
    supplier    : Association to BusinessPartners on supplier.ID = supplier_ID;
    rfqDate     : Date;
    totalAmount : Decimal(15, 2);
    currency    : Currency;
    status      : Status default 'Draft';
    virtual rfqCriticality : Integer;
    items       : Composition of many RFQItems on items.rfq = $self;
}

entity RFQItems : cuid {
    rfq      : Association to RFQs;
    product_ID : UUID;
    product  : Association to Products on product.ID = product_ID;
    quantity : Integer;
    price    : Decimal(15, 2);
}

entity PurchaseOrders : cuid, AuditFields {
    poNumber    : String(20);
    rfq         : Association to RFQs;
    supplier_ID : UUID;
    supplier    : Association to BusinessPartners on supplier.ID = supplier_ID;
    poDate      : Date;
    totalAmount : Decimal(15, 2);
    currency    : Currency;
    status      : Status default 'Draft';
    items       : Composition of many PurchaseItems on items.order = $self;
}

entity PurchaseItems : cuid {
    order    : Association to PurchaseOrders;
    product_ID : UUID;
    product  : Association to Products on product.ID = product_ID;
    quantity : Integer;
    price    : Decimal(15, 2);
}

entity GoodsReceipts : cuid, AuditFields {
    receiptNumber : String(20);
    purchaseOrder : Association to PurchaseOrders;
    deliveryDate  : Date;
    receivedBy    : String(100);
}

/**
 * MODULE FINANCE : Invoices & Payments
 */
entity Invoices : cuid, AuditFields {
    invoiceNumber : String(20);
    orderType     : String enum { Sales; Purchase; };
    salesOrder    : Association to SalesOrders;
    purchaseOrder : Association to PurchaseOrders;
    amount        : Decimal(15, 2);
    currency      : Currency;
    dueDate       : Date;
    status        : Status default 'Pending';
}

entity Payments : cuid, AuditFields {
    invoice       : Association to Invoices;
    paymentDate   : Date;
    amount        : Decimal(15, 2);
    currency      : Currency;
    paymentMethod : String;
}

/**
 * MODULE PARAMÈTRES & SÉCURITÉ
 */
entity AuditLogs : cuid, managed {
    action      : String(100);
    targetType  : String(100);
    targetID    : String(100);
    targetLabel : String(200);
    performedBy : String(255);
    detail      : String(1000);
}

entity Notifications : cuid, managed {
    notifType : String(50);
    isRead    : Boolean default false;
    title     : String(200);
    message   : String(1000);
    sentBy    : String(255);
}

entity SystemConfigs : cuid, managed {
    category    : String(100);
    configKey   : String(100);
    configValue : String(1000);
    description : String(500);
}

entity NumberRanges : cuid, managed {
    rangeType   : String(50);
    prefix      : String(20);
    currentNum  : Integer;
    description : String(500);
}