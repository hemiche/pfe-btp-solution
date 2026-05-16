const cds = require('@sap/cds');

cds.on('bootstrap', (app) => {
    const express = require('express');
    // Augmenter la limite de taille du corps pour supporter l'envoi de plusieurs fichiers PDF en Base64
    app.use(express.json({ limit: '20mb' }));
    app.use(express.urlencoded({ extended: true, limit: '20mb' }));
});

module.exports = cds.server;
