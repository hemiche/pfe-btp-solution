const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
    const { RFQs, RFQItems, PurchaseOrders, PurchaseItems, Invoices, GoodsReceipts, Products } = this.entities;

    // Traduction de statut d'anglais vers français (en secours)
    function translateStatusToFrench(status) {
        switch (status) {
            case 'Draft': return 'Brouillon';
            case 'Pending': return 'En attente';
            case 'Approved': return 'Approuvé';
            case 'Rejected': return 'Refusé';
            case 'Completed': return 'Complété';
            case 'Cancelled': return 'Annulé';
            case 'Blocked': return 'Bloqué';
            default: return status;
        }
    }

    const getNextRFQNumber = async () => {
        const currentYear = new Date().getFullYear();
        const prefix = `RFQ-${currentYear}-`;
        
        const activeRfqs = await SELECT.from(RFQs).columns('rfqNumber');
        let nextSeq = 1;
        if (activeRfqs && activeRfqs.length > 0) {
            let maxSeq = 0;
            activeRfqs.forEach(r => {
                if (r.rfqNumber) {
                    const parts = r.rfqNumber.split('-');
                    if (parts.length === 3) {
                        const seq = parseInt(parts[2]);
                        if (!isNaN(seq) && seq > maxSeq) {
                            maxSeq = seq;
                        }
                    } else if (parts.length === 2) {
                        const seq = parseInt(parts[1]);
                        if (!isNaN(seq) && seq > maxSeq) {
                            maxSeq = seq;
                        }
                    }
                }
            });
            nextSeq = maxSeq + 1;
        }
        return `${prefix}${nextSeq.toString().padStart(3, '0')}`;
    };

    const getNextPONumber = async () => {
        const currentYear = new Date().getFullYear();
        const prefix = `PO-${currentYear}-`;
        
        const pos = await SELECT.from(PurchaseOrders).columns('poNumber');
        let nextSeq = 1;
        if (pos && pos.length > 0) {
            let maxSeq = 0;
            pos.forEach(p => {
                if (p.poNumber) {
                    const parts = p.poNumber.split('-');
                    if (parts.length === 3) {
                        const seq = parseInt(parts[2]);
                        if (!isNaN(seq) && seq > maxSeq) {
                            maxSeq = seq;
                        }
                    } else if (parts.length === 2) {
                        const seq = parseInt(parts[1]);
                        if (!isNaN(seq) && seq > maxSeq) {
                            maxSeq = seq;
                        }
                    }
                }
            });
            nextSeq = maxSeq + 1;
        }
        return `${prefix}${nextSeq.toString().padStart(3, '0')}`;
    };

    // Fonction d'initialisation commune pour les brouillons (Drafts) et objets actifs (Active Records)
    const initNewRFQ = async (rfq) => {
        if (!rfq.rfqNumber || rfq.rfqNumber === '_' || rfq.rfqNumber.trim() === '') {
            rfq.rfqNumber = await getNextRFQNumber();
        }
        
        if (!rfq.status) rfq.status = 'Draft';
        rfq.statusText = translateStatusToFrench(rfq.status);
        
        if (!rfq.rfqDate) {
            rfq.rfqDate = new Date().toISOString().split('T')[0];
        }
        
        if (!rfq.currency_code) {
            rfq.currency_code = 'DZD'; // Devise Dinar Algérien par défaut
        }
        
        if (rfq.totalAmount === undefined || rfq.totalAmount === null) {
            rfq.totalAmount = 0.00;
        }
    };

    // Déclencheur après initialisation d'un nouveau brouillon OData
    this.after('NEW', 'RFQs', async (rfq) => {
        await initNewRFQ(rfq);
    });

    // Déclencheur avant création pour s'assurer que le numéro est bien calculé sur le brouillon
    this.before('CREATE', 'RFQs.drafts', async (req) => {
        await initNewRFQ(req.data);
    });

    this.before('NEW', 'RFQs.drafts', async (req) => {
        await initNewRFQ(req.data);
    });

    // Hook générique de traduction des statuts pour la lecture (READ)
    this.after('READ', ['RFQs', 'PurchaseOrders', 'Invoices'], (data) => {
        const records = Array.isArray(data) ? data : [data];
        records.forEach(r => {
            if (r && r.status) {
                r.statusText = translateStatusToFrench(r.status);
            }
        });
    });

    // Hook générique de traduction des statuts avant l'écriture
    this.before(['CREATE', 'UPDATE'], ['RFQs', 'PurchaseOrders', 'Invoices'], async (req) => {
        if (req.data && req.data.status) {
            req.data.statusText = translateStatusToFrench(req.data.status);
        }
    });

    // 1. Generation des numéros de RFQ et calcul des statuts / montants à l'enregistrement
    this.before(['CREATE', 'UPDATE'], 'RFQs', async (req) => {
        // Auto-génération de numéro s'il n'est pas encore défini
        if (!req.data.rfqNumber || req.data.rfqNumber === '_') {
            req.data.rfqNumber = await getNextRFQNumber();
        }
        
        // S'assurer de la devise par défaut
        req.data.currency_code = 'DZD';

        // S'assurer de la traduction du statut en français dans statusText
        req.data.statusText = translateStatusToFrench(req.data.status || 'Draft');

        // Calcul automatique du Montant Total à partir des Articles (depuis draft ou actif)
        const rfqID = req.data.ID || req.params[0];
        if (rfqID) {
            const isDraft = req.target.isDraft || req.target.name.endsWith('.drafts');
            const itemEntity = isDraft ? 'SRMService.RFQItems.drafts' : RFQItems;
            const items = await SELECT.from(itemEntity).where({ rfq_ID: rfqID });
            if (items && items.length > 0) {
                let total = 0;
                items.forEach(item => {
                    total += Number(item.quantity || 0) * Number(item.price || 0);
                });
                req.data.totalAmount = total;
            }
        }
    });

    // 2. Generation des numéros de Bon de Commande (PO) et calcul du montant
    this.before(['CREATE', 'UPDATE'], 'PurchaseOrders', async (req) => {
        if (!req.data.poNumber || req.data.poNumber === '_') {
            req.data.poNumber = await getNextPONumber();
        }
        const poID = req.data.ID || req.params[0];
        if (poID) {
            const isDraft = req.target.isDraft || req.target.name.endsWith('.drafts');
            const itemEntity = isDraft ? 'SRMService.PurchaseItems.drafts' : PurchaseItems;
            const items = await SELECT.from(itemEntity).where({ order_ID: poID });
            if (items && items.length > 0) {
                let total = 0;
                items.forEach(item => {
                    total += Number(item.quantity || 0) * Number(item.price || 0);
                });
                req.data.totalAmount = total;
            }
        }
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
        await UPDATE(RFQs, rfqID).with({ status: 'Completed', statusText: 'Complété' });

        // Marquer la notification correspondante comme lue
        if (rfq) {
            await UPDATE('pfe.btp.Notifications')
                .set({ isRead: true })
                .where({ notifType: 'RFQ', message: { like: `%${rfq.rfqNumber || ''}%` } });
        }

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

    // 6. Gestionnaire de lecture pour l'entité virtuelle des Statuts (Statuses)
    this.on('READ', 'Statuses', (req) => {
        const list = [
            { code: 'Draft', name: 'Brouillon' },
            { code: 'Pending', name: 'En attente' },
            { code: 'Approved', name: 'Approuvé' },
            { code: 'Rejected', name: 'Refusé' },
            { code: 'Completed', name: 'Complété' },
            { code: 'Cancelled', name: 'Annulé' },
            { code: 'Blocked', name: 'Bloqué' }
        ];
        // Permettre la recherche / filtrage basique (obligatoire pour SAP Fiori Elements ValueHelp)
        return req.query ? req.reply(list) : list;
    });

    // Recalcul en temps réel pour RFQs (Draft et Actif)
    const handleRFQItemChange = async (data, req) => {
        const isDraft = req.target.isDraft || req.target.name.endsWith('.drafts');
        const itemEntity = isDraft ? 'SRMService.RFQItems.drafts' : RFQItems;
        const parentEntity = isDraft ? 'SRMService.RFQs.drafts' : RFQs;

        let rfqID = req.data?.rfq_ID || data?.rfq_ID;
        if (!rfqID && req.params) {
            const id = req.params[0]?.ID || req.params[0];
            if (id) {
                const item = await SELECT.one.from(itemEntity, id).columns('rfq_ID');
                rfqID = item?.rfq_ID;
            }
        }

        if (rfqID) {
            const items = await SELECT.from(itemEntity).where({ rfq_ID: rfqID });
            let total = 0;
            items.forEach(item => {
                total += Number(item.quantity || 0) * Number(item.price || 0);
            });
            await UPDATE(parentEntity, rfqID).with({ totalAmount: total });
        }
    };

    this.after(['CREATE', 'UPDATE', 'DELETE'], 'RFQItems', handleRFQItemChange);
    this.after(['CREATE', 'UPDATE', 'DELETE'], 'RFQItems.drafts', handleRFQItemChange);

    // Recalcul en temps réel pour Purchase Orders (Draft et Actif)
    const handlePOItemChange = async (data, req) => {
        const isDraft = req.target.isDraft || req.target.name.endsWith('.drafts');
        const itemEntity = isDraft ? 'SRMService.PurchaseItems.drafts' : PurchaseItems;
        const parentEntity = isDraft ? 'SRMService.PurchaseOrders.drafts' : PurchaseOrders;

        let poID = req.data?.order_ID || data?.order_ID;
        if (!poID && req.params) {
            const id = req.params[0]?.ID || req.params[0];
            if (id) {
                const item = await SELECT.one.from(itemEntity, id).columns('order_ID');
                poID = item?.order_ID;
            }
        }

        if (poID) {
            const items = await SELECT.from(itemEntity).where({ order_ID: poID });
            let total = 0;
            items.forEach(item => {
                total += Number(item.quantity || 0) * Number(item.price || 0);
            });
            await UPDATE(parentEntity, poID).with({ totalAmount: total });
        }
    };

    this.after(['CREATE', 'UPDATE', 'DELETE'], 'PurchaseItems', handlePOItemChange);
    this.after(['CREATE', 'UPDATE', 'DELETE'], 'PurchaseItems.drafts', handlePOItemChange);

    // Notification on RFQ acceptance
    this.after(['CREATE', 'UPDATE'], 'RFQs', async (data, req) => {
        const records = Array.isArray(data) ? data : [data];
        for (const record of records) {
            if (record && record.status === 'Approved') {
                const rfqNum = record.rfqNumber || 'inconnu';
                const existing = await SELECT.one.from('pfe.btp.Notifications').where({
                    notifType: 'RFQ',
                    title: 'Appel d\'Offre Accepté',
                    message: `L'appel d'offre ${rfqNum} a été accepté par le fournisseur.`
                });
                if (!existing) {
                    await INSERT.into('pfe.btp.Notifications').entries({
                        notifType: 'RFQ',
                        title: 'Appel d\'Offre Accepté',
                        message: `L'appel d'offre ${rfqNum} a été accepté par le fournisseur.`,
                        sentBy: 'System',
                        isRead: false
                    });
                }
            }
        }
    });

    // Criticality calculation for RFQs
    this.after('READ', 'RFQs', (data) => {
        const records = Array.isArray(data) ? data : [data];
        records.forEach(r => {
            if (r && r.status) {
                if (r.status === 'Approved' || r.status === 'Completed') r.rfqCriticality = 3; // Green
                else if (r.status === 'Rejected' || r.status === 'Cancelled') r.rfqCriticality = 1; // Red
                else if (r.status === 'Pending') r.rfqCriticality = 2; // Orange
                else r.rfqCriticality = 0; // Gray
            }
        });
    });
});
