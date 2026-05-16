const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
    const { Quotes, SalesOrders, Invoices, Products } = this.entities;

    // 1. Generation des numéros de Devis
    this.before('CREATE', 'Quotes', async (req) => {
        const { maxID } = await SELECT.one`max(quoteNumber) as maxID`.from(Quotes);
        req.data.quoteNumber = `QT-${(parseInt(maxID?.split('-')[1] || 0) + 1).toString().padStart(6, '0')}`;
    });

    // 2. Generation des numéros de Commande
    this.before('CREATE', 'SalesOrders', async (req) => {
        const { maxID } = await SELECT.one`max(orderNumber) as maxID`.from(SalesOrders);
        req.data.orderNumber = `SO-${(parseInt(maxID?.split('-')[1] || 0) + 1).toString().padStart(6, '0')}`;

        // Validation des stocks
        const items = req.data.items || [];
        for (const item of items) {
            const product = await SELECT.one.from(Products, item.product_ID);
            if (!product) continue;
            if (product.stockLevel < item.quantity) {
                return req.error(400, `Stock insuffisant pour ${product.name} (Disponible: ${product.stockLevel})`);
            }
        }
    });

    // 2b. Mise à jour du stock après création de commande
    this.after('CREATE', 'SalesOrders', async (data) => {
        const items = data.items || [];
        for (const item of items) {
            await UPDATE(Products, item.product_ID).with({
                stockLevel: { '-': item.quantity }
            });
        }
    });

    // 3. ACTION : Convertir Devis en Commande
    this.on('convertToOrder', 'Quotes', async (req) => {
        const quoteID = req.params[0];
        const quote = await SELECT.one.from(Quotes, quoteID).columns( q => {
            q.ID, q.client_ID, q.totalAmount, q.currency_code, q.items( i => { i.product_ID, i.quantity, i.price })
        });

        if (!quote) return req.error(404, 'Devis non trouvé');
        if (quote.status === 'Completed') return req.error(400, 'Devis déjà converti');

        // Créer la commande
        const order = await INSERT.into(SalesOrders).entries({
            quote_ID: quote.ID,
            client_ID: quote.client_ID,
            orderDate: new Date().toISOString().split('T')[0],
            totalAmount: quote.totalAmount,
            currency_code: quote.currency_code,
            status: 'Approved',
            items: quote.items.map( item => ({
                product_ID: item.product_ID,
                quantity: item.quantity,
                price: item.price
            }))
        });

        // Marquer le devis comme complété
        await UPDATE(Quotes, quoteID).with({ status: 'Completed' });

        return order;
    });

    // 4. ACTION : Générer Facture
    this.on('generateInvoice', 'SalesOrders', async (req) => {
        const orderID = req.params[0];
        const order = await SELECT.one.from(SalesOrders, orderID);

        if (!order) return req.error(404, 'Commande non trouvée');

        // Générer numéro facture
        const { maxID } = await SELECT.one`max(invoiceNumber) as maxID`.from(Invoices);
        const nextInvoiceNum = `INV-${(parseInt(maxID?.split('-')[1] || 0) + 1).toString().padStart(6, '0')}`;

        const invoice = await INSERT.into(Invoices).entries({
            invoiceNumber: nextInvoiceNum,
            orderType: 'Sales',
            salesOrder_ID: order.ID,
            amount: order.totalAmount,
            currency_code: order.currency_code,
            dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0], // +30 jours
            status: 'Pending'
        });

        return invoice;
    });
});
