using { pfe.btp as my } from '../db/schema';

service AdminService @(requires: 'Admin') {
    entity BusinessPartners as projection on my.BusinessPartners;
    entity Products as projection on my.Products;
    entity Addresses as projection on my.Addresses;
}
