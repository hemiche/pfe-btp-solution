namespace pfe.btp;

using {
    managed,
    cuid,
    Currency,
    Country
} from '@sap/cds/common';

type Status : String enum {
    Draft;
    Pending;
    Approved;
    Rejected;
    Completed;
    Cancelled;
}

aspect AuditFields : managed {
    virtual statusText : String; // For UI display
}

/**
 * MODULE CORE : Business Partners
 */
entity BusinessPartners : cuid, AuditFields {
    firstName      : String(100);
    lastName       : String(100);
    companyName    : String(200);
    email          : String(255);
    phoneNumber    : String(20);
    bpRole         : String enum {
        Client;
        Supplier;
        Both;
    };
    isB2B          : Boolean default true;
    taxID          : String(50);
    address        : Composition of many Addresses on address.partner = $self;
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
entity Products : cuid, AuditFields {
    name        : String(200);
    description : String(1000);
    category    : String(100);
    price       : Decimal(15, 2);
    currency    : Currency;
    stockLevel  : Integer;
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
    supplier    : Association to BusinessPartners;
    rfqDate     : Date;
    totalAmount : Decimal(15, 2);
    currency    : Currency;
    status      : Status default 'Draft';
    items       : Composition of many RFQItems on items.rfq = $self;
}

entity RFQItems : cuid {
    rfq      : Association to RFQs;
    product  : Association to Products;
    quantity : Integer;
    price    : Decimal(15, 2);
}

entity PurchaseOrders : cuid, AuditFields {
    poNumber    : String(20);
    rfq         : Association to RFQs;
    supplier    : Association to BusinessPartners;
    poDate      : Date;
    totalAmount : Decimal(15, 2);
    currency    : Currency;
    status      : Status default 'Draft';
    items       : Composition of many PurchaseItems on items.order = $self;
}

entity PurchaseItems : cuid {
    order    : Association to PurchaseOrders;
    product  : Association to Products;
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
