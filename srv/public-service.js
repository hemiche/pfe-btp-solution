const cds = require('@sap/cds');

module.exports = cds.service.impl(async function() {
    const { BusinessPartners } = cds.entities('pfe.btp');

    async function _checkUniqueness(data, req) {
        const email = data.email ? data.email.trim() : null;
        const companyName = data.companyName ? data.companyName.trim() : null;
        const rib = data.rib ? data.rib.trim() : null;
        const nif = data.nif ? data.nif.trim() : null;
        const ai = data.ai ? data.ai.trim() : null;
        const phoneNumber = data.phoneNumber ? data.phoneNumber.trim() : null;
        

        if (email) {
            const res = await SELECT.one.from(BusinessPartners).where({ email: email, status: 'Approved' });
            if (res) return "Cet Email est déjà utilisé par un partenaire approuvé.";
        }
        if (companyName) {
            const res = await SELECT.one.from(BusinessPartners).where`UPPER(companyName) = ${companyName.toUpperCase()} and status = 'Approved'`;
            if (res) return "Ce Nom de société est déjà utilisé par un partenaire approuvé.";
        }
        if (rib) {
            const res = await SELECT.one.from(BusinessPartners).where({ rib: rib, status: 'Approved' });
            if (res) return "Ce RIB est déjà utilisé par un partenaire approuvé.";
        }
        if (nif) {
            const res = await SELECT.one.from(BusinessPartners).where({ nif: nif, status: 'Approved' });
            if (res) return "Ce NIF est déjà utilisé par un partenaire approuvé.";
        }
        if (ai) {
            const res = await SELECT.one.from(BusinessPartners).where({ ai: ai, status: 'Approved' });
            if (res) return "Cet Article d'Imposition (AI) est déjà utilisé par un partenaire approuvé.";
        }
        if (phoneNumber) {
            const res = await SELECT.one.from(BusinessPartners).where({ phoneNumber: phoneNumber, status: 'Approved' });
            if (res) return "Ce Numéro de téléphone est déjà utilisé par un partenaire approuvé.";
        }
        
        return null;
    }

    this.on('checkUniqueness', async (req) => {
        const error = await _checkUniqueness(req.data, req);
        if (error) return req.reject(400, error);
        return 'OK';
    });

    this.on('registerPartner', async (req) => {
        let { companyName, secteurActivite, rib, nif, ai, email, password, confirmPassword, bpRole, phoneNumber, fullNameResponsible, documents, onlyCheck } = req.data;

        email = email ? email.trim() : '';
        rib = rib ? rib.trim() : '';
        nif = nif ? nif.trim() : '';
        ai = ai ? ai.trim() : '';
        companyName = companyName ? companyName.trim() : '';

        // 1. Vérification des doublons (S'applique au check et au register)
        const duplicateError = await _checkUniqueness(req.data, req);
        if (duplicateError) return req.reject(400, duplicateError);

        // Si on ne fait qu'un check, on s'arrête ici
        if (onlyCheck) return "OK";

        // 2. Suite du processus d'inscription
        if (!email) return req.reject(400, 'L\'adresse email est requise.');
        if (password !== confirmPassword) return req.reject(400, 'Les mots de passe ne correspondent pas.');

        // Si doublon non-approuvé existe, on le supprime avant d'insérer le nouveau
        // On construit le filtre dynamiquement pour éviter les erreurs SQL sur champs vides
        let filters = [];
        if (email) filters.push({ email: email });
        if (companyName) filters.push({ companyName: companyName });
        if (rib) filters.push({ rib: rib });
        if (nif) filters.push({ nif: nif });
        if (ai) filters.push({ ai: ai });

        if (filters.length > 0) {
            let query = SELECT.one.from(BusinessPartners);
            query.where(filters[0]);
            for (let i = 1; i < filters.length; i++) {
                query.or(filters[i]);
            }
            const existing = await query;
            
            if (existing && existing.status !== 'Approved') {
                await DELETE.from(BusinessPartners).where({ ID: existing.ID });
            }
        }

        // Préparer l'objet partenaire
        const newPartner = {
            companyName: companyName,
            secteurActivite: secteurActivite,
            rib: rib,
            nif: nif,
            ai: ai,
            email: email,
            password: password,
            phoneNumber: phoneNumber,
            fullNameResponsible: fullNameResponsible,
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
                        content: Buffer.from(doc.content, 'base64'), 
                        mediaType: 'application/pdf'
                    });
                }
            } catch (e) {
                console.error('Erreur documents:', e);
            }
        }

        return 'Inscription réussie. Votre dossier est en attente d\'approbation.';
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
