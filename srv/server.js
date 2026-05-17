const cds = require('@sap/cds');

cds.on('bootstrap', (app) => {
    const express = require('express');
    // Augmenter la limite de taille du corps pour supporter l'envoi de plusieurs fichiers PDF en Base64
    app.use(express.json({ limit: '20mb' }));
    app.use(express.urlencoded({ extended: true, limit: '20mb' }));

    // Middleware d'authentification par Cookie et Fallback pour le développement local UNIQUEMENT (désactivé en production BTP/XSUAA)
    if (process.env.NODE_ENV !== 'production' && !process.env.VCAP_SERVICES) {
        app.use((req, res, next) => {
            if (!req.headers.authorization) {
                if (req.headers.cookie && req.headers.cookie.includes('pfe_user=')) {
                    const cookies = Object.fromEntries(req.headers.cookie.split('; ').map(c => c.split('=')));
                    const role = cookies['pfe_role'];
                    if (role === 'Admin') {
                        req.headers.authorization = 'Basic ' + Buffer.from('admin@pfe.dz:admin').toString('base64');
                    } else {
                        req.headers.authorization = 'Basic ' + Buffer.from('bob:').toString('base64');
                    }
                } else if (req.originalUrl && (req.originalUrl.includes('/odata/v4/admin') || req.originalUrl.includes('/admin-btp'))) {
                    // Par défaut en dev local, donner les droits Admin sur les routes de gestion administrateur
                    req.headers.authorization = 'Basic ' + Buffer.from('admin@pfe.dz:admin').toString('base64');
                } else if (req.originalUrl && (req.originalUrl.includes('/odata/v4/crm') || req.originalUrl.includes('/odata/v4/srm'))) {
                    req.headers.authorization = 'Basic ' + Buffer.from('bob:').toString('base64');
                }
            }
            next();
        });
    }
});

module.exports = cds.server;
