const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
    this.on('approve', 'BusinessPartners', async (req) => {
        const id = req.params[0];
        await UPDATE('pfe.btp.BusinessPartners')
            .set({ status: 'Approved', statusText: 'Approuvé' })
            .where({ ID: id });
        req.info('Le partenaire a été approuvé avec succès.');
    });

    this.on('rejectPartner', 'BusinessPartners', async (req) => {
        const id = req.params[0];
        const motif = req.data.motifRefus;
        
        if (!motif) return req.reject(400, 'Le motif de refus est obligatoire.');

        await UPDATE('pfe.btp.BusinessPartners')
            .set({ status: 'Rejected', statusText: 'Refusé', motifRefus: motif })
            .where({ ID: id });
        req.info('Le partenaire a été refusé.');
    });
});
