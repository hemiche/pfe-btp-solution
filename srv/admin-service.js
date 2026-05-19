const cds = require('@sap/cds');

// ─── Helper : Enregistrer un log d'audit ─────────────────────────────────────
async function logAudit(action, targetType, targetID, targetLabel, performedBy, detail) {
    try {
        await INSERT.into('pfe.btp.AuditLogs').entries({
            action,
            targetType,
            targetID: String(targetID),
            targetLabel: targetLabel || '',
            performedBy: performedBy || 'admin',
            detail: detail || ''
        });
    } catch (e) {
        console.error('[AuditLog Error]', e.message);
    }
}

// ─── Helper : Construire le HTML d'un PDF ─────────────────────────────────────
function buildPDFHtml(title, sections, footerText) {
    const rows = sections.map(s => `
        <tr>
            <td style="font-weight:600;color:#1a1a2e;width:40%;padding:8px 12px;background:#f4f6fa;border-bottom:1px solid #e0e0e0;">${s.label}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e0e0e0;">${s.value || '—'}</td>
        </tr>`).join('');

    return JSON.stringify({
        title,
        html: `
            <style>
                body { font-family: Arial, sans-serif; color: #333; }
                h1 { color: #0a6ed1; font-size: 20px; border-bottom: 2px solid #0a6ed1; padding-bottom: 8px; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                .footer { margin-top: 32px; font-size: 11px; color: #999; text-align: center; }
            </style>
            <h1>🛡️ PFE BTP Solution</h1>
            <h2 style="color:#1a1a2e;font-size:16px;">${title}</h2>
            <p style="color:#666;font-size:12px;">Généré le : ${new Date().toLocaleDateString('fr-DZ', { dateStyle: 'long' })}</p>
            <table>${rows}</table>
            <div class="footer">${footerText || 'Document généré automatiquement — PFE BTP Solution'}</div>
        `
    });
}

module.exports = cds.service.impl(async function() {

    // ─── APPROVE ─────────────────────────────────────────────────────────────
    this.on('approve', 'Inscriptions', async (req) => {
        const id = req.params[0];
        const bp = await SELECT.one.from('pfe.btp.BusinessPartners').where({ ID: id });
        await UPDATE('pfe.btp.BusinessPartners')
            .set({ status: 'Approved', statusText: 'Approuvé' })
            .where({ ID: id });
        await logAudit('APPROVE', 'BusinessPartners', id, bp?.companyName || bp?.email, req.user?.id, 'Inscription approuvée');
        
        // Marquer la notification correspondante comme lue
        if (bp) {
            const nameToFind = bp.companyName || bp.fullNameResponsible;
            await UPDATE('pfe.btp.Notifications')
                .set({ isRead: true })
                .where({ notifType: 'KYC', message: { like: `%${nameToFind}%` } });
        }
        
        req.info('Le partenaire a été approuvé avec succès.');
    });

    // ─── REJECT ───────────────────────────────────────────────────────────────
    this.on('rejectPartner', 'Inscriptions', async (req) => {
        const id = req.params[0];
        const motif = req.data.motifRefus;
        if (!motif) return req.reject(400, 'Le motif de refus est obligatoire.');
        const bp = await SELECT.one.from('pfe.btp.BusinessPartners').where({ ID: id });
        await UPDATE('pfe.btp.BusinessPartners')
            .set({ status: 'Rejected', statusText: 'Refusé', motifRefus: motif })
            .where({ ID: id });
        await logAudit('REJECT', 'BusinessPartners', id, bp?.companyName || bp?.email, req.user?.id, `Motif: ${motif}`);
        
        // Marquer la notification correspondante comme lue
        if (bp) {
            const nameToFind = bp.companyName || bp.fullNameResponsible;
            await UPDATE('pfe.btp.Notifications')
                .set({ isRead: true })
                .where({ notifType: 'KYC', message: { like: `%${nameToFind}%` } });
        }

        req.info('Le partenaire a été refusé.');
    });

    // ─── BLOCK ────────────────────────────────────────────────────────────────
    this.on('blockPartner', 'BusinessPartners', async (req) => {
        const id = req.params[0];
        const motif = req.data.motifBlocage;
        if (!motif) return req.reject(400, 'Le motif de blocage est obligatoire.');
        const bp = await SELECT.one.from('pfe.btp.BusinessPartners').where({ ID: id });
        await UPDATE('pfe.btp.BusinessPartners')
            .set({ status: 'Blocked', statusText: 'Bloqué', motifBlocage: motif })
            .where({ ID: id });
        await logAudit('BLOCK', 'BusinessPartners', id, bp?.companyName || bp?.email, req.user?.id, `Motif blocage: ${motif}`);
        req.info('Le partenaire a été bloqué.');
    });

    // ─── ACTIVATE ─────────────────────────────────────────────────────────────
    this.on('activatePartner', 'BusinessPartners', async (req) => {
        const id = req.params[0];
        const bp = await SELECT.one.from('pfe.btp.BusinessPartners').where({ ID: id });
        await UPDATE('pfe.btp.BusinessPartners')
            .set({ status: 'Approved', statusText: 'Approuvé', motifBlocage: null })
            .where({ ID: id });
        await logAudit('ACTIVATE', 'BusinessPartners', id, bp?.companyName || bp?.email, req.user?.id, 'Compte réactivé');
        req.info('Le partenaire a été réactivé avec succès.');
    });

    // ─── PDF : Fiche d'Inscription ────────────────────────────────────────────
    this.on('downloadRegistrationPDF', 'Inscriptions', async (req) => {
        const id = req.params[0];
        const bp = await SELECT.one.from('pfe.btp.BusinessPartners').where({ ID: id });
        if (!bp) return req.reject(404, 'Inscription non trouvée.');
        return buildPDFHtml(
            `Fiche d'Inscription — ${bp.companyName || bp.email}`,
            [
                { label: 'Type de Client',        value: bp.clientType || 'B2B' },
                { label: 'Rôle',                  value: bp.bpRole },
                { label: 'Entreprise / Nom',       value: bp.companyName || `${bp.firstName} ${bp.lastName}` },
                { label: 'Responsable',            value: bp.fullNameResponsible },
                { label: 'Email',                  value: bp.email },
                { label: 'Téléphone',              value: bp.phoneNumber },
                { label: 'Wilaya',                 value: bp.wilaya },
                { label: 'Secteur d\'activité',   value: bp.secteurActivite },
                { label: 'Registre de Commerce',  value: bp.rc },
                { label: 'NIF',                    value: bp.nif },
                { label: 'Article d\'Imposition', value: bp.ai },
                { label: 'RIB',                    value: bp.rib },
                { label: 'Statut',                 value: bp.statusText || bp.status },
                { label: 'Date de demande',        value: bp.createdAt ? new Date(bp.createdAt).toLocaleDateString('fr-DZ') : '' },
                { label: 'Motif de refus',         value: bp.motifRefus }
            ],
            'Fiche d\'inscription — Confidentiel'
        );
    });

    // ─── PDF : Fiche Partenaire ────────────────────────────────────────────────
    this.on('downloadBusinessPartnerPDF', 'BusinessPartners', async (req) => {
        const id = req.params[0];
        const bp = await SELECT.one.from('pfe.btp.BusinessPartners').where({ ID: id });
        if (!bp) return req.reject(404, 'Partenaire non trouvé.');
        return buildPDFHtml(
            `Fiche Partenaire — ${bp.companyName || bp.email}`,
            [
                { label: 'Type de Client',        value: bp.clientType || 'B2B' },
                { label: 'Rôle Commercial',       value: bp.bpRole },
                { label: 'Entreprise / Nom',       value: bp.companyName || `${bp.firstName} ${bp.lastName}` },
                { label: 'Responsable',            value: bp.fullNameResponsible },
                { label: 'Email',                  value: bp.email },
                { label: 'Téléphone',              value: bp.phoneNumber },
                { label: 'Wilaya',                 value: bp.wilaya },
                { label: 'Secteur d\'activité',   value: bp.secteurActivite },
                { label: 'Registre de Commerce',  value: bp.rc },
                { label: 'NIF',                    value: bp.nif },
                { label: 'Article d\'Imposition', value: bp.ai },
                { label: 'RIB',                    value: bp.rib },
                { label: 'Statut',                 value: bp.statusText || bp.status },
                { label: 'Inscrit le',             value: bp.createdAt ? new Date(bp.createdAt).toLocaleDateString('fr-DZ') : '' }
            ],
            'Fiche partenaire officielle — PFE BTP Solution'
        );
    });

    // ─── PDF : Facture ────────────────────────────────────────────────────────
    this.on('downloadFacturePDF', async (req) => {
        const { invoiceId } = req.data;
        const inv = await SELECT.one.from('pfe.btp.Invoices').where({ ID: invoiceId });
        if (!inv) return req.reject(404, 'Facture non trouvée.');
        return buildPDFHtml(
            `Facture — ${inv.invoiceNumber}`,
            [
                { label: 'N° Facture',   value: inv.invoiceNumber },
                { label: 'Type',         value: inv.orderType },
                { label: 'Montant',      value: `${inv.amount?.toLocaleString('fr-DZ')} ${inv.currency_code}` },
                { label: 'Échéance',     value: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('fr-DZ') : '' },
                { label: 'Statut',       value: inv.statusText || inv.status }
            ],
            'Facture officielle — PFE BTP Solution'
        );
    });

    // ─── PDF : Devis ──────────────────────────────────────────────────────────
    this.on('downloadDevisPDF', async (req) => {
        const { quoteId } = req.data;
        const quote = await SELECT.one.from('pfe.btp.Quotes').where({ ID: quoteId });
        if (!quote) return req.reject(404, 'Devis non trouvé.');
        return buildPDFHtml(
            `Devis — ${quote.quoteNumber}`,
            [
                { label: 'N° Devis',         value: quote.quoteNumber },
                { label: 'Date du devis',     value: quote.quoteDate ? new Date(quote.quoteDate).toLocaleDateString('fr-DZ') : '' },
                { label: 'Valide jusqu\'au', value: quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('fr-DZ') : '' },
                { label: 'Montant Total',     value: `${quote.totalAmount?.toLocaleString('fr-DZ')} ${quote.currency_code}` },
                { label: 'Statut',            value: quote.statusText || quote.status }
            ],
            'Devis commercial — PFE BTP Solution'
        );
    });

    // ─── PRODUCTS : INITIALISATION DU BROUILLON (Format SKU-YYYY-NNN) ────────
    this.before('NEW', 'Products', async (req) => {
        const currentYear = new Date().getFullYear();
        const prefix = `SKU-${currentYear}-`;
        
        // Trouver le dernier produit créé avec ce préfixe pour incrémenter
        const lastProducts = await SELECT.from('pfe.btp.Products')
            .columns('sku')
            .where({ sku: { like: `${prefix}%` } });
            
        let nextSeq = 1;
        if (lastProducts && lastProducts.length > 0) {
            let maxSeq = 0;
            lastProducts.forEach(p => {
                if (p.sku) {
                    const parts = p.sku.split('-');
                    if (parts.length === 3) {
                        const seq = parseInt(parts[2]);
                        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
                    }
                }
            });
            nextSeq = maxSeq + 1;
        }
        req.data.sku = `${prefix}${nextSeq.toString().padStart(3, '0')}`;
        req.data.isActive = true;
        req.data.tvaRate = 19;
        req.data.unitOfMeasure = 'U';
    });

    // ─── PRODUCTS : SAUVEGARDE ACTIVE (Sécurité + Enregistrement automatique des nouvelles catégories) ───
    this.before(['CREATE', 'UPDATE'], 'Products', async (req) => {
        // 1. Sécurité SKU
        if (!req.data.sku || req.data.sku.trim() === '' || req.data.sku === '_') {
            const currentYear = new Date().getFullYear();
            const prefix = `SKU-${currentYear}-`;
            
            const lastProducts = await SELECT.from('pfe.btp.Products')
                .columns('sku')
                .where({ sku: { like: `${prefix}%` } });
                
            let nextSeq = 1;
            if (lastProducts && lastProducts.length > 0) {
                let maxSeq = 0;
                lastProducts.forEach(p => {
                    if (p.sku) {
                        const parts = p.sku.split('-');
                        if (parts.length === 3) {
                            const seq = parseInt(parts[2]);
                            if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
                        }
                    }
                });
                nextSeq = maxSeq + 1;
            }
            req.data.sku = `${prefix}${nextSeq.toString().padStart(3, '0')}`;
        }

        // 2. Enregistrement automatique de la nouvelle catégorie si elle n'existe pas dans la base de données
        if (req.data.category && req.data.category.trim() !== '') {
            const categoryName = req.data.category.trim();
            const exists = await SELECT.one.from('pfe.btp.Categories').where({ code: categoryName });
            if (!exists) {
                await INSERT.into('pfe.btp.Categories').entries({ code: categoryName });
            }
        }
    });

    // ─── CATEGORY : CREATION MANUELLE VIA BOUTON ────────────────────────────
    this.on('createCategory', async (req) => {
        const { code } = req.data;
        if (!code || code.trim() === '') return req.reject(400, 'Le nom de la catégorie est obligatoire.');
        const categoryName = code.trim();
        const exists = await SELECT.one.from('pfe.btp.Categories').where({ code: categoryName });
        if (!exists) {
            await INSERT.into('pfe.btp.Categories').entries({ code: categoryName });
        }
        req.info(`La catégorie "${categoryName}" a été créée avec succès.`);
        return { code: categoryName };
    });

    // ─── PRODUCT TYPES : LECTURE ─────────────────────────────────────────────
    this.on('READ', 'ProductTypes', (req) => {
        const list = [
            { code: 'Produit', name: 'Produit' },
            { code: 'Service', name: 'Service' }
        ];
        return req.query ? req.reply(list) : list;
    });

    // ─── UNIT OF MEASURES : LECTURE ──────────────────────────────────────────
    this.on('READ', 'UnitOfMeasures', (req) => {
        const list = [
            { code: 'U', name: 'Unité (U)' },
            { code: 'M', name: 'Mètre linéaire (M)' },
            { code: 'M2', name: 'Mètre Carré (M²)' },
            { code: 'M3', name: 'Mètre Cube (M³)' },
            { code: 'KG', name: 'Kilogramme (KG)' },
            { code: 'T', name: 'Tonne (T)' },
            { code: 'L', name: 'Litre (L)' },
            { code: 'ENS', name: 'Ensemble (ENS)' },
            { code: 'J', name: 'Jour (J)' },
            { code: 'H', name: 'Heure (H)' }
        ];
        return req.query ? req.reply(list) : list;
    });

    // Criticality for Products (Stock level)
    this.after('READ', 'Products', (data) => {
        const records = Array.isArray(data) ? data : [data];
        records.forEach(r => {
            if (r) {
                // If stock is below or equal minimum, negative (1 = Red)
                r.stockCriticality = (r.stockLevel <= r.stockMinimum) ? 1 : 3;
            }
        });
    });

    // Criticality for Inscriptions / BusinessPartners
    this.after('READ', ['Inscriptions', 'BusinessPartners'], (data) => {
        const records = Array.isArray(data) ? data : [data];
        records.forEach(r => {
            if (r && r.status) {
                if (r.status === 'Pending') r.kycCriticality = 2; // Orange
                else if (r.status === 'Rejected') r.kycCriticality = 1; // Red
                else if (r.status === 'Approved') r.kycCriticality = 3; // Green
                else r.kycCriticality = 0; // Gray
            }
        });
    });
});
