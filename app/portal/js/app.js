// ════════════════════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════════════════════
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const messageBox = document.getElementById('loginMessage');
        messageBox.className = 'sap-message';

        try {
            const response = await fetch('/odata/v4/public/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                let msg = 'Erreur de connexion.';
                try { const d = await response.json(); msg = d.error?.message || msg; } catch(e) { msg = await response.text(); }
                messageBox.textContent = msg;
                messageBox.classList.add('error');
                return;
            }

            const data = await response.json();
            const result = JSON.parse(data.value);

            if (result.status === 'Pending') {
                messageBox.textContent = "Votre compte n'est pas encore approuvé par l'administrateur.";
                messageBox.classList.add('warning');
            } else if (result.status === 'Rejected') {
                messageBox.innerHTML = `<strong>Dossier refusé</strong><br>
Votre demande d'inscription a été rejetée.<br>
Motif : ${result.motif || 'Non spécifié'}<br><br>
<a href="register.html" style="color:inherit;text-decoration:underline;font-weight:bold;">Soumettre une nouvelle demande</a>`;
                messageBox.classList.add('error');
            } else if (result.status === 'Blocked') {
                messageBox.innerHTML = `<strong>⛔ Compte bloqué</strong><br>
Votre compte a été suspendu par l'administrateur.<br>
Motif : ${result.motif || 'Non spécifié'}<br>
Veuillez contacter l'administration pour plus d'informations.`;
                messageBox.classList.add('error');
            } else if (result.status === 'Approved') {
                messageBox.textContent = 'Connexion réussie ! Redirection...';
                messageBox.classList.add('success');
                setTimeout(() => {
                    if (result.role === 'Admin') {
                        window.location.href = '/admin-dashboard.html';
                    } else if (result.role === 'Supplier') {
                        window.location.href = '/srm-btp/webapp/index.html';
                    } else {
                        window.location.href = '/crm-btp/webapp/index.html';
                    }
                }, 1000);
            }
        } catch (error) {
            messageBox.textContent = 'Erreur réseau.';
            messageBox.classList.add('error');
        }
    });
}

// ════════════════════════════════════════════════════════════════════════════
// WIZARD REGISTRATION
// ════════════════════════════════════════════════════════════════════════════
let currentStep = 1;

window.showStep = function(step) {
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
    const stepEl = document.getElementById(`step${step}`);
    if (stepEl) stepEl.classList.add('active');
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById(`dot${i}`);
        if (!dot) continue;
        if (i < step)      dot.className = 'wizard-dot completed';
        else if (i === step) dot.className = 'wizard-dot active';
        else                 dot.className = 'wizard-dot';
    }
    currentStep = step;
};

function _getSelectedRole() {
    const checked = document.querySelector('input[name="roleChoice"]:checked');
    if (checked) {
        const [role, type] = checked.value.split('_');
        return { role, type };
    }
    return { role: 'Supplier', type: 'B2B' };
}

function _getWilaya() {
    const sel = document.getElementById('wilaya');
    if (!sel || !sel.value) return { wilaya: '', wilayaCode: null };
    const opt = sel.options[sel.selectedIndex];
    return { wilaya: sel.value, wilayaCode: parseInt(opt.getAttribute('data-code')) || null };
}

window.nextStep = async function(step) {
    const messageBox = document.getElementById('registerMessage');
    messageBox.className = 'sap-message';
    messageBox.textContent = '';
    messageBox.style.display = 'none';

    const currentContainer = document.getElementById(`step${currentStep}`);
    if (!currentContainer) return;

    const { role: bpRole, type: clientType } = _getSelectedRole();

    // ── Step 1 → 2 : Validation infos société/individu ──────────────────────
    if (step === 2) {
        if (!document.getElementById('wilaya').value) {
            messageBox.textContent = 'Veuillez sélectionner votre wilaya.';
            messageBox.classList.add('error');
            messageBox.style.display = 'block';
            return;
        }

        const inputs = currentContainer.querySelectorAll('input[required], select[required]');
        let valid = true;
        inputs.forEach(inp => { if (!inp.checkValidity()) { inp.reportValidity(); valid = false; } });
        if (!valid) return;

        const payload = {
            companyName: document.getElementById('companyName').value.trim(),
            rib:         document.getElementById('rib').value.trim(),
            nif:         document.getElementById('nif').value.trim(),
            ai:          document.getElementById('ai').value.trim(),
            rc:          document.getElementById('rc').value.trim(),
            onlyCheck:   true,
            clientType:  clientType
        };
        try {
            const res = await fetch('/odata/v4/public/registerPartner', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const err = await res.json();
                messageBox.textContent = err.error?.message || 'Erreur de validation.';
                messageBox.classList.add('error');
                messageBox.style.display = 'block';
                return;
            }
        } catch (e) {
            messageBox.textContent = 'Erreur lors de la vérification.';
            messageBox.classList.add('error');
            messageBox.style.display = 'block';
            return;
        }
        window.showStep(2);
        return;
    }

    // ── Step 2 → 3 : Validation email + téléphone ───────────────────────────
    if (step === 3) {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            messageBox.textContent = 'Les mots de passe ne correspondent pas !';
            messageBox.classList.add('error');
            messageBox.style.display = 'block';
            return;
        }

        const inputs = document.getElementById('step2').querySelectorAll('input[required]');
        let valid = true;
        inputs.forEach(inp => { if (!inp.checkValidity()) { inp.reportValidity(); valid = false; } });
        if (!valid) return;

        const payload = {
            email:       document.getElementById('email').value.trim(),
            phoneNumber: document.getElementById('phoneNumber').value.trim(),
            onlyCheck:   true,
            clientType:  clientType
        };
        try {
            const res = await fetch('/odata/v4/public/registerPartner', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const err = await res.json();
                messageBox.textContent = err.error?.message || 'Email déjà utilisé.';
                messageBox.classList.add('error');
                messageBox.style.display = 'block';
                return;
            }
        } catch (e) {
            messageBox.textContent = "Erreur lors de la vérification de l'email.";
            messageBox.classList.add('error');
            messageBox.style.display = 'block';
            return;
        }

        window.showStep(3);
        return;
    }

    window.showStep(step);
};

window.prevStep = function(step) { window.showStep(step); };

window.togglePassword = function(id) {
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
};

// ════════════════════════════════════════════════════════════════════════════
// FORM SUBMIT
// ════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageBox = document.getElementById('registerMessage');
        messageBox.className = 'sap-message';
        messageBox.style.display = 'none';

        const { role: bpRole, type: clientType } = _getSelectedRole();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            messageBox.textContent = 'Les mots de passe ne correspondent pas !';
            messageBox.classList.add('error');
            messageBox.style.display = 'block';
            return;
        }

        messageBox.textContent = 'Traitement de votre demande en cours...';
        messageBox.style.display = 'block';

        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload  = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });

        try {
            const docs = [];
            const fileRC  = document.getElementById('fileRC').files[0];
            const fileRIB = document.getElementById('fileRIB').files[0];
            const fileNIF = document.getElementById('fileNIF').files[0];
            const fileAI  = document.getElementById('fileAI').files[0];
            if (fileRC)  docs.push({ type: 'RC',  fileName: fileRC.name,  content: await toBase64(fileRC) });
            if (fileRIB) docs.push({ type: 'RIB', fileName: fileRIB.name, content: await toBase64(fileRIB) });
            if (fileNIF) docs.push({ type: 'NIF', fileName: fileNIF.name, content: await toBase64(fileNIF) });
            if (fileAI)  docs.push({ type: 'AI',  fileName: fileAI.name,  content: await toBase64(fileAI) });

            const { wilaya, wilayaCode } = _getWilaya();

            const payload = {
                companyName:         document.getElementById('companyName').value.trim(),
                secteurActivite:     document.getElementById('secteurActivite').value.trim(),
                rib:                 document.getElementById('rib').value.trim(),
                nif:                 document.getElementById('nif').value.trim(),
                ai:                  document.getElementById('ai').value.trim(),
                rc:                  document.getElementById('rc').value.trim(),
                email:               document.getElementById('email').value.trim(),
                password:            password,
                confirmPassword:     confirmPassword,
                fullNameResponsible: document.getElementById('fullNameResponsible').value.trim(),
                phoneNumber:         document.getElementById('phoneNumber').value.trim(),
                bpRole:              bpRole,
                clientType:          clientType,
                wilaya:              wilaya,
                wilayaCode:          wilayaCode,
                documents:           JSON.stringify(docs),
                onlyCheck:           false
            };

            const response = await fetch('/odata/v4/public/registerPartner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                let errorMessage = "Erreur lors de l'inscription.";
                if (contentType && contentType.includes('application/json')) {
                    const errData = await response.json();
                    errorMessage = errData.error?.message || errorMessage;
                } else {
                    const text = await response.text();
                    if (text.includes('Payload Too Large')) errorMessage = 'Fichiers trop volumineux (Max 20MB).';
                }
                messageBox.textContent = errorMessage;
                messageBox.classList.add('error');
                return;
            }

            const data = await response.json();
            messageBox.textContent = data.value;
            messageBox.className = 'sap-message success';
            document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
            document.querySelector('.wizard-progress').style.display = 'none';
            setTimeout(() => { window.location.href = 'index.html'; }, 5000);

        } catch (error) {
            console.error('Registration error:', error);
            messageBox.textContent = 'Une erreur est survenue lors du traitement.';
            messageBox.classList.add('error');
        }
    });
});
