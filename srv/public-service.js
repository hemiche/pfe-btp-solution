const cds = require('@sap/cds');
const crypto = require('crypto');
const util = require('util');
const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
    if (!password) return null;
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = await scrypt(password, salt, 64);
    return salt + ':' + derivedKey.toString('hex');
}

async function verifyPassword(password, hash) {
    if (!password || !hash) return false;
    if (!hash.includes(':')) return false; // Not a hashed password
    const [salt, key] = hash.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = await scrypt(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

module.exports = cds.service.impl(async function() {
    const { BusinessPartners } = cds.entities('pfe.btp');

    async function _checkUniqueness(data, req) {
        const email = data.email ? data.email.trim().toLowerCase() : null;
        const companyName = data.companyName ? data.companyName.trim() : null;
        const rib = data.rib ? data.rib.trim() : null;
        const nif = data.nif ? data.nif.trim() : null;
        const ai = data.ai ? data.ai.trim() : null;
        const rc = data.rc ? data.rc.trim().toUpperCase() : null;
        const phoneNumber = data.phoneNumber ? data.phoneNumber.trim() : null;
        

        if (email) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) {
                return "Le format de l'adresse e-mail est invalide.";
            }
            const res = await SELECT.one.from(BusinessPartners).where`email = ${email} and status in ('Approved', 'Pending')`;
            if (res) return "Cet E-mail est déjà enregistré dans la base de données.";
        }
        if (phoneNumber) {
            const phoneRegex = /^0\d{9}$/;
            if (!phoneRegex.test(phoneNumber)) {
                return "Le format du numéro de téléphone est invalide. Il doit comporter 10 chiffres et commencer par 0 (ex: 0550123456).";
            }
            const res = await SELECT.one.from(BusinessPartners).where`phoneNumber = ${phoneNumber} and status in ('Approved', 'Pending')`;
            if (res) return "Ce Numéro de téléphone est déjà enregistré dans la base de données.";
        }
        if (companyName) {
            const res = await SELECT.one.from(BusinessPartners).where`UPPER(companyName) = ${companyName.toUpperCase()} and status in ('Approved', 'Pending')`;
            if (res) return "Ce Nom de société est déjà enregistré dans la base de données.";
        }
        if (rib) {
            const res = await SELECT.one.from(BusinessPartners).where`rib = ${rib} and status in ('Approved', 'Pending')`;
            if (res) return "Ce RIB est déjà enregistré dans la base de données.";
        }
        if (nif) {
            const res = await SELECT.one.from(BusinessPartners).where`nif = ${nif} and status in ('Approved', 'Pending')`;
            if (res) return "Ce NIF est déjà enregistré dans la base de données.";
        }
        if (ai) {
            const res = await SELECT.one.from(BusinessPartners).where`ai = ${ai} and status in ('Approved', 'Pending')`;
            if (res) return "Cet Article d'Imposition (AI) est déjà enregistré dans la base de données.";
        }
        if (rc) {
            const rcRegex = /^\d{2}[/]?[ABC][-]?\d{6,7}$/;
            if (!rcRegex.test(rc)) {
                return "Le format du Registre de Commerce (RC) est invalide. Formats acceptés : AA/N-XXXXXXX ou AANXXXXXXX (ex: 24/B-1234567 ou 24B1234567).";
            }
            const res = await SELECT.one.from(BusinessPartners).where`rc = ${rc} and status in ('Approved', 'Pending')`;
            if (res) return "Ce Registre de Commerce (RC) est déjà enregistré dans la base de données.";
        }
        
        return null;
    }

    this.on('checkUniqueness', async (req) => {
        const error = await _checkUniqueness(req.data, req);
        if (error) return req.reject(400, error);
        return 'OK';
    });

    this.on('registerPartner', async (req) => {
        let { companyName, secteurActivite, rib, nif, ai, rc, email, password, confirmPassword, bpRole, phoneNumber, fullNameResponsible, documents, onlyCheck } = req.data;

        email = email ? email.trim().toLowerCase() : '';
        rib = rib ? rib.trim() : '';
        nif = nif ? nif.trim() : '';
        ai = ai ? ai.trim() : '';
        rc = rc ? rc.trim().toUpperCase() : '';
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
        if (rc) filters.push({ rc: rc });

        if (filters.length > 0) {
            let query = SELECT.one.from(BusinessPartners);
            query.where(filters[0]);
            for (let i = 1; i < filters.length; i++) {
                query.or(filters[i]);
            }
            const existing = await query;
            
            if (existing && existing.status !== 'Approved') {
                await DELETE.from('pfe.btp.BusinessPartnerDocuments').where({ partner_ID: existing.ID });
                await DELETE.from(BusinessPartners).where({ ID: existing.ID });
            }
        }

        // Préparer l'objet partenaire
        const partnerID = cds.utils.uuid();
        const newPartner = {
            ID: partnerID,
            companyName: companyName,
            secteurActivite: secteurActivite,
            rib: rib,
            nif: nif,
            ai: ai,
            rc: rc,
            email: email,
            password: await hashPassword(password),
            phoneNumber: phoneNumber,
            fullNameResponsible: fullNameResponsible,
            bpRole: bpRole,
            status: 'Pending',
            statusText: 'En attente d\'approbation'
        };

        await INSERT.into(BusinessPartners).entries(newPartner);

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
        let { email, password } = req.data;
        email = email ? email.trim().toLowerCase() : '';

        const resObj = (req.http && req.http.res) || (req._ && req._.req && req._.req.res);

        // Admin override (for test purposes)
        if (email === 'admin@pfe.dz' && password === 'admin') {
            if (resObj && typeof resObj.cookie === 'function') {
                resObj.cookie('pfe_user', encodeURIComponent(email), { path: '/' });
                resObj.cookie('pfe_role', 'Admin', { path: '/' });
            }
            return JSON.stringify({ status: 'Approved', role: 'Admin', name: 'Administrateur' });
        }

        const user = await SELECT.one.from(BusinessPartners).where({ email: email });
        if (!user) {
            return req.reject(401, 'Email ou mot de passe incorrect.');
        }

        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) {
            // Tolérance pour les anciennes données de test en clair
            if (user.password !== password) {
                return req.reject(401, 'Email ou mot de passe incorrect.');
            }
        }

        if (user.status === 'Pending') {
            return JSON.stringify({ status: 'Pending', message: 'Pas encore approuvé.' });
        }
        
        if (user.status === 'Rejected') {
            return JSON.stringify({ status: 'Rejected', motif: user.motifRefus || 'Non spécifié' });
        }

        // Approved
        if (resObj && typeof resObj.cookie === 'function') {
            resObj.cookie('pfe_user', encodeURIComponent(email), { path: '/' });
            resObj.cookie('pfe_role', user.bpRole === 'Admin' ? 'Admin' : 'User', { path: '/' });
        }
        return JSON.stringify({ status: 'Approved', role: user.bpRole, name: user.companyName });
    });
});
