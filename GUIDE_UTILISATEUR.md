# 📘 Guide d'Utilisation - Solution de Gestion Cloud (PFE)

Ce document explique comment utiliser les différents modules de la plateforme de gestion pour Startups et PME développée sur SAP BTP.

---

## 1. Module Administration (Back-Office)
**Accès :** `AdminService`
**Rôle requis :** `Admin`

### Gestion des Partenaires
- **Visualisation :** Accédez à la liste complète des clients et fournisseurs.
- **Création :** Ajoutez un nouveau partenaire en spécifiant son rôle (Client, Fournisseur ou les deux).
- **Modification :** Mettez à jour les informations de contact, le SIRET/Tax ID ou l'adresse.

### Gestion du Catalogue Produits
- Gérez les produits vendus ou achetés.
- Suivez les niveaux de stock en temps réel.

---

## 2. Module CRM (Gestion des Ventes)
**Accès :** `CRMService`
**Rôle requis :** `User` ou `Admin`

### Processus de Vente "Quote-to-Cash" :
1. **Création d'un Devis (Quote) :** Sélectionnez un client et ajoutez les articles. Le numéro `QT-XXXXXX` est généré automatiquement.
2. **Conversion en Commande :** Utilisez l'action **"convertToOrder"**. Le système crée une `SalesOrder` (`SO-XXXXXX`), copie tous les détails et clôture le devis.
3. **Facturation :** Sur une commande approuvée, utilisez l'action **"generateInvoice"**. Une facture `INV-XXXXXX` est créée avec une échéance à 30 jours.

---

## 3. Module SRM (Gestion des Achats)
**Accès :** `SRMService`
**Rôle requis :** `User` ou `Admin`

### Processus d'Achat "Procure-to-Pay" :
1. **Demande d'Offre (RFQ) :** Envoyez une demande `RFQ-XXXXXX` à un fournisseur pour des produits spécifiques.
2. **Bon de Commande (PO) :** Une fois l'offre validée, utilisez **"convertToPO"** pour générer le bon de commande officiel `PO-XXXXXX`.
3. **Réception :** Enregistrez la réception des marchandises pour mettre à jour les stocks.
4. **Facture Fournisseur :** Utilisez **"generateSupplierInvoice"** pour enregistrer la facture reçue (`PINV-XXXXXX`).

---

## 4. Module Analytics (Tableaux de Bord)
**Accès :** `AnalyticsService`
**Rôle requis :** `Admin`

### Indicateurs Clés (KPIs) :
- **Volume de Ventes :** Graphique des ventes cumulées par mois.
- **Dépenses Achats :** Suivi des engagements financiers auprès des fournisseurs.
- **Répartition Partenaires :** Analyse du nombre de clients vs fournisseurs.

---

## 5. Sécurité et Rôles
- **Admin :** Accès total à tous les modules et aux fonctions de suppression.
- **User (Commercial/Acheteur) :** Peut créer et modifier des documents métier, mais ne peut pas gérer le catalogue ou supprimer des données sensibles.
- **Audit :** Chaque action est horodatée et liée à l'utilisateur qui l'a effectuée (champs `createdAt`, `createdBy`).
