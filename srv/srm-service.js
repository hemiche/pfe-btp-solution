const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
    const { RFQs, PurchaseOrders, Invoices, GoodsReceipts, Products } = this.entities;

    // 1. Generation des numéros de RFQ
    this.before('CREATE', 'RFQs', async (req) => {
        const { maxID } = await SELECT.one`max(rfqNumber) as maxID`.from(RFQs);
        req.data.rfqNumber = `RFQ-${(parseInt(maxID?.split('-')[1] || 0) + 1).toString().padStart(6, '0')}`;
    });

    // 2. Generation des numéros de Bon de Commande (PO)
    this.before('CREATE', 'PurchaseOrders', async (req) => {
        const { maxID } = await SELECT.one`max(poNumber) as maxID`.from(PurchaseOrders);
        req.data.poNumber = `PO-${(parseInt(maxID?.split('-')[1] || 0) + 1).toString().padStart(6, '0')}`;
    });

    // 3. ACTION : Convertir RFQ en Purchase Order
    this.on('convertToPO', 'RFQs', async (req) => {
        const rfqID = req.params[0];
        const rfq = await SELECT.one.from(RFQs, rfqID).columns( r => {
            r.ID, r.supplier_ID, r.totalAmount, r.currency_code, r.items( i => { i.product_ID, i.quantity, i.price })
        });

        if (!rfq) return req.error(404, 'RFQ non trouvée');

        // Créer le PO
        const po = await INSERT.into(PurchaseOrders).entries({
            rfq_ID: rfq.ID,
            supplier_ID: rfq.supplier_ID,
            poDate: new Date().toISOString().split('T')[0],
            totalAmount: rfq.totalAmount,
            currency_code: rfq.currency_code,
            status: 'Approved',
            items: rfq.items.map( item => ({
                product_ID: item.product_ID,
                quantity: item.quantity,
                price: item.price
            }))
        });

        // Marquer la RFQ comme complétée
        await UPDATE(RFQs, rfqID).with({ status: 'Completed' });

        return po;
    });

    // 4. ACTION : Générer Facture Fournisseur
    this.on('generateSupplierInvoice', 'PurchaseOrders', async (req) => {
        const poID = req.params[0];
        const po = await SELECT.one.from(PurchaseOrders, poID);

        if (!po) return req.error(404, 'Bon de commande non trouvé');

        // Générer numéro facture
        const { maxID } = await SELECT.one`max(invoiceNumber) as maxID`.from(Invoices);
        const nextInvoiceNum = `PINV-${(parseInt(maxID?.split('-')[1] || 0) + 1).toString().padStart(6, '0')}`;

        const invoice = await INSERT.into(Invoices).entries({
            invoiceNumber: nextInvoiceNum,
            orderType: 'Purchase',
            purchaseOrder_ID: po.ID,
            amount: po.totalAmount,
            currency_code: po.currency_code,
            dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
            status: 'Pending'
        });

        return invoice;
    });
    
    // 5. Réception de marchandises : Augmenter le stock
    this.before('CREATE', 'GoodsReceipts', async (req) => {
        const { maxID } = await SELECT.one`max(receiptNumber) as maxID`.from(GoodsReceipts);
        req.data.receiptNumber = `GR-${(parseInt(maxID?.split('-')[1] || 0) + 1).toString().padStart(6, '0')}`;
    });

    this.after('CREATE', 'GoodsReceipts', async (data) => {
        const po = await SELECT.one.from(PurchaseOrders, data.purchaseOrder_ID).columns( p => {
            p.items( i => { i.product_ID, i.quantity })
        });

        if (po && po.items) {
            for (const item of po.items) {
                await UPDATE(Products, item.product_ID).with({
                    stockLevel: { '+': item.quantity }
                });
            }
        }
    });
});
