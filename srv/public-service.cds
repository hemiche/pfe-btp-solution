using pfe.btp from '../db/schema';

@requires: 'any'
service PublicService {
    action registerPartner(
        companyName: String,
        secteurActivite: String,
        rib: String,
        nif: String,
        ai: String,
        email: String,
        password: String,
        confirmPassword: String,
        bpRole: String,
        phoneNumber: String,
        fullNameResponsible: String,
        documents: String,
        onlyCheck: Boolean
    ) returns String;

    action login(email: String, password: String) returns String;

    action checkUniqueness(
        companyName: String,
        rib: String,
        nif: String,
        ai: String,
        email: String,
        phoneNumber: String
    ) returns String;
}
