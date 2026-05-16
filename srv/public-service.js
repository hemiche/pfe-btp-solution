const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
    const { BusinessPartners } = cds.entities('pfe.btp');

    this.on('registerPartner', async (req) => {
        let { companyName, secteurActivite, rib, nif, ai, email, password, bpRole, documents } = req.data;

        email = email ? email.trim() : '';
        rib = rib ? rib.trim() : '';
        nif = nif ? nif.trim() : '';
        ai = ai ? ai.trim() : '';

        // Validation... (keeping basic logic)
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|dz|fr|net|org)$/;
        if (!email || !emailRegex.test(email)) {
            return req.reject(400, 'L\'adresse email est invalide ou le domaine n\'est pas supporté (utilisez .com, .dz, .fr, .net ou .org).');
        }
        
        const existing = await SELECT.one.from(BusinessPartners).where({ email: email });
        if (existing) {
            if (existing.status === 'Approved') {
                return req.reject(400, 'Cet email est déjà utilisé par un partenaire officiellement approuvé.');
            } else {
                // Si en attente ou rejeté, on supprime l'ancien dossier pour permettre la ré-inscription
                // (Cela supprime aussi les documents associés grâce à la Composition)
                await DELETE.from(BusinessPartners).where({ ID: existing.ID });
            }
        }

        // Préparer l'objet partenaire (CDS générera l'ID UUID automatiquement pour cuid)
        const newPartner = {
            companyName: companyName,
            secteurActivite: secteurActivite,
            rib: rib,
            nif: nif,
            ai: ai,
            email: email,
            password: password,
            bpRole: bpRole,
            status: 'Pending',
            statusText: 'En attente d\'approbation'
        };

        await INSERT.into(BusinessPartners).entries(newPartner);
        const partnerID = newPartner.ID; 

        // Créer les documents si présents
        if (documents && partnerID) {
            try {
                const docs = JSON.parse(documents);
                for (const doc of docs) {
                    await INSERT.into('pfe.btp.BusinessPartnerDocuments').entries({
                        partner_ID: partnerID,
                        docType: doc.type,
                        fileName: doc.fileName,
                        content: Buffer.from(doc.content, 'base64'), // Conversion en binaire réel
                        mediaType: 'application/pdf'
                    });
                }
            } catch (e) {
                console.error('Erreur documents:', e);
            }
        }

        return 'Inscription réussie. Votre dossier (incluant vos documents) est en attente d\'approbation.';
    });

    this.on('login', async (req) => {
        const { email, password } = req.data;

        // Admin override (for test purposes)
        if (email === 'admin@pfe.dz' && password === 'admin') {
             return JSON.stringify({ status: 'Approved', role: 'Admin', name: 'Administrateur' });
        }

        const user = await SELECT.one.from(BusinessPartners).where({ email: email, password: password });
        if (!user) {
            return req.reject(401, 'Email ou mot de passe incorrect.');
        }

        if (user.status === 'Pending') {
            return JSON.stringify({ status: 'Pending', message: 'Pas encore approuvé.' });
        }
        
        if (user.status === 'Rejected') {
            return JSON.stringify({ status: 'Rejected', message: `Refusé : ${user.motifRefus || 'Non spécifié'}` });
        }

        // Approved
        return JSON.stringify({ status: 'Approved', role: user.bpRole, name: user.companyName });
    });
});
