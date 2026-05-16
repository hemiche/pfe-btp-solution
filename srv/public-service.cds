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
        bpRole: String,
        documents: String // JSON stringified array of {type, content, fileName}
    ) returns String;

    action login(email: String, password: String) returns String;
}
