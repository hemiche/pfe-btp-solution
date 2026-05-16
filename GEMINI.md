# PFE SAP BTP Solution - Roadmap & Progress

## 🚀 Vision du Projet
Développement d’une Solution Cloud de Gestion des Clients et des Fournisseurs pour les Startups et PME basée sur SAP Business Technology Platform (SAP BTP).

---

## 📅 Roadmap de Développement

### Phase 1 : Architecture & Initialisation ✅
- [x] Architecture globale définie (Clean Core, Side-by-Side)
- [x] Structure de projet CAP initialisée
- [x] Fichiers de configuration (`package.json`, `mta.yaml`, `xs-security.json`) créés
- [x] Environnement local et BTP configuré

### Phase 2 : Modélisation des Données (CDS) ✅
- [x] Création du schéma `db/schema.cds` (BusinessPartner, CRM, SRM)
- [x] Définition des types communs et aspects (Audit, Lifecycle)
- [x] Mock data pour le développement local (.csv)

### Phase 3 : Développement Backend (SRV) ✅
- [x] Implémentation des services OData modulaires (Admin, CRM, SRM)
- [x] Logique métier personnalisée (Handlers JS pour Order numbering)
- [x] Intégration de la sécurité (RBAC avec @requires et @restrict)

### Phase 4 : Frontend (Fiori UI5) ✅
- [x] Structure des dossiers `app/` créée
- [x] Annotations UI CDS pour Admin et CRM (List Reports, Object Pages)
- [x] Préparation des Mock Data (.csv) pour les tests
- [x] Génération des fichiers manifest.json et Component.js

### Phase 5.2 : Workflows & Logic SRM ✅
- [x] Entités `RFQs` et `GoodsReceipts` implémentées
- [x] Action `convertToPO` : transformation de demande d'offre en bon de commande
- [x] Action `generateSupplierInvoice` : enregistrement facture fournisseur
- [x] Logique de numérotation (RFQ, PO, PINV)

### Phase 6 : Tests & Validation Locale ✅
- [x] Serveur CAP opérationnel (SQLite in-memory)
- [x] Validation RBAC (Alice/Admin, Bob/User)
- [x] Services OData V4 testés via `curl`

### Phase 7 : Analytics & KPI ✅
- [x] Vues CDS analytiques (`db/analytics.cds`)
- [x] Agrégations pour Dashboard (Sales, Purchase, KPIs)
- [x] Nouveau service `AnalyticsService` exposé

### Phase 8 : UI Generation ✅
- [x] Fichiers `manifest.json` créés pour Admin et CRM
- [x] Configuration du routage Fiori Elements (ListReport & ObjectPage)
- [x] Liaison OData V4 configurée

### Phase 9 : DevOps & CI/CD ✅
- [x] Workflow GitHub Actions (`btp-ci-cd.yml`) implémenté
- [x] Build MTA automatisé à chaque push
- [x] Gestion des artefacts (.mtar) pour déploiement BTP

---

## 🛠 Commandes Utiles
- `cds watch` : Lancer le projet en mode développement (SQLite)
- `mbt build` : Compiler le projet pour BTP
- `cf deploy mta_archives/...` : Déployer sur BTP
