// --- LOGIC FOR LOGIN PAGE ---
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const messageBox = document.getElementById('loginMessage');
        
        messageBox.className = 'sap-message'; // reset

        try {
            const response = await fetch('/odata/v4/public/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                let msg = 'Erreur de connexion.';
                try {
                    const errData = await response.json();
                    msg = errData.error?.message || msg;
                } catch(e) {
                    msg = await response.text();
                }
                messageBox.textContent = msg;
                messageBox.classList.add('error');
                return;
            }

            const data = await response.json();
            const result = JSON.parse(data.value);

            if (result.status === 'Pending') {
                messageBox.textContent = 'Votre compte n\'est pas encore approuvé par l\'administrateur.';
                messageBox.classList.add('warning');
            } else if (result.status === 'Rejected') {
                messageBox.innerHTML = `<strong>Dossier refusé</strong><br/>
Votre demande d'inscription a été rejetée par l'administrateur.<br/>
Motif : ${result.motif || 'Non spécifié'}<br/><br/>
<a href="register.html" style="color: inherit; text-decoration: underline; font-weight: bold;">Cliquez ici pour soumettre une nouvelle demande</a>`;
                messageBox.classList.add('error');
            } else if (result.status === 'Approved') {
                messageBox.textContent = 'Connexion réussie ! Redirection...';
                messageBox.classList.add('success');
                
                // Routing based on role
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

// --- LOGIC FOR REGISTRATION WIZARD ---
let currentStep = 1;

window.showStep = function(step) {
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    
    // Update dots
    for(let i=1; i<=3; i++) {
        const dot = document.getElementById(`dot${i}`);
        if(dot) {
            if(i < step) {
                dot.className = 'wizard-dot completed';
            } else if(i === step) {
                dot.className = 'wizard-dot active';
            } else {
                dot.className = 'wizard-dot';
            }
        }
    }
    currentStep = step;
}

window.nextStep = async function(step) {
    const messageBox = document.getElementById('registerMessage');
    messageBox.className = 'sap-message'; // Reset
    messageBox.textContent = '';
    messageBox.style.display = 'none';

    // Basic validation before moving forward
    const currentContainer = document.getElementById(`step${currentStep}`);
    if (!currentContainer) return;
    
    const inputs = currentContainer.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.checkValidity()) {
            input.reportValidity();
            isValid = false;
        }
    });

    if (isValid && step === 2) {
        // Validation spécifique Phase 1 -> Phase 2 : Vérifier les doublons société
        const payload = {
            companyName: document.getElementById('companyName').value.trim(),
            rib: document.getElementById('rib').value.trim(),
            nif: document.getElementById('nif').value.trim(),
            ai: document.getElementById('ai').value.trim(),
            rc: document.getElementById('rc').value.trim(),
            onlyCheck: true
        };

        try {
            const response = await fetch('/odata/v4/public/registerPartner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                messageBox.textContent = errData.error?.message || 'Erreur de validation.';
                messageBox.classList.add('error');
                messageBox.style.display = 'block';
                return;
            }
            window.showStep(step);
        } catch (error) {
            messageBox.textContent = 'Erreur lors de la vérification.';
            messageBox.classList.add('error');
            messageBox.style.display = 'block';
        }
    } else if (isValid && step === 3) {
        // Validation spécifique Phase 2 -> Phase 3 : Vérifier l'email et les mots de passe
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            messageBox.textContent = 'Les mots de passe ne correspondent pas !';
            messageBox.classList.add('error');
            messageBox.style.display = 'block';
            return;
        }

        const payload = {
            email: document.getElementById('email').value.trim(),
            phoneNumber: document.getElementById('phoneNumber').value.trim(),
            onlyCheck: true
        };

        try {
            const response = await fetch('/odata/v4/public/registerPartner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errData = await response.json();
                messageBox.textContent = errData.error?.message || 'Email déjà utilisé.';
                messageBox.classList.add('error');
                messageBox.style.display = 'block';
                return;
            }
            window.showStep(step);
        } catch (error) {
            messageBox.textContent = 'Erreur lors de la vérification de l\'email.';
            messageBox.classList.add('error');
            messageBox.style.display = 'block';
        }
    } else if (isValid) {
        window.showStep(step);
    }
}

window.prevStep = function(step) {
    window.showStep(step);
}

window.togglePassword = function(id) {
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
};

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    
    if (!registerForm) return;

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Submission started...');
        
        const messageBox = document.getElementById('registerMessage');
        messageBox.className = 'sap-message';
        messageBox.style.display = 'none';

        // Final validation check
        if (!registerForm.checkValidity()) {
            registerForm.reportValidity();
            return;
        }

        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            messageBox.textContent = 'Les mots de passe ne correspondent pas !';
            messageBox.classList.add('error');
            messageBox.style.display = 'block';
            return;
        }

        messageBox.textContent = 'Traitement des documents en cours...';
        messageBox.style.display = 'block';

        // Helper to convert file to Base64
        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = error => reject(error);
        });

        try {
            const docs = [];
            const fileRC = document.getElementById('fileRC').files[0];
            const fileRIB = document.getElementById('fileRIB').files[0];
            const fileNIF = document.getElementById('fileNIF').files[0];
            const fileAI = document.getElementById('fileAI').files[0];

            console.log('Converting files to base64...');
            if (fileRC) docs.push({ type: 'RC', fileName: fileRC.name, content: await toBase64(fileRC) });
            if (fileRIB) docs.push({ type: 'RIB', fileName: fileRIB.name, content: await toBase64(fileRIB) });
            if (fileNIF) docs.push({ type: 'NIF', fileName: fileNIF.name, content: await toBase64(fileNIF) });
            if (fileAI) docs.push({ type: 'AI', fileName: fileAI.name, content: await toBase64(fileAI) });

            const payload = {
                companyName: document.getElementById('companyName').value.trim(),
                secteurActivite: document.getElementById('secteurActivite').value.trim(),
                rib: document.getElementById('rib').value.trim(),
                nif: document.getElementById('nif').value.trim(),
                ai: document.getElementById('ai').value.trim(),
                rc: document.getElementById('rc').value.trim(),
                email: document.getElementById('email').value.trim(),
                password: password,
                confirmPassword: confirmPassword,
                fullNameResponsible: document.getElementById('fullNameResponsible').value.trim(),
                phoneNumber: document.getElementById('phoneNumber').value.trim(),
                bpRole: document.getElementById('bpRole').value,
                documents: JSON.stringify(docs),
                onlyCheck: false
            };

            console.log('Sending payload to server...');
            const response = await fetch('/odata/v4/public/registerPartner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                let errorMessage = 'Erreur lors de l\'inscription.';
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errData = await response.json();
                    errorMessage = errData.error?.message || errorMessage;
                } else {
                    const text = await response.text();
                    if (text.includes('Payload Too Large')) errorMessage = 'Fichiers trop volumineux (Max 20MB).';
                }
                messageBox.textContent = errorMessage;
                messageBox.classList.add('error');
                console.error('Server error:', errorMessage);
                return;
            }

            const data = await response.json();
            messageBox.textContent = data.value;
            messageBox.className = 'sap-message success';
            console.log('Registration success!');
            
            // Hide form and show success
            document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
            document.querySelector('.wizard-progress').style.display = 'none';
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 5000);

        } catch (error) {
            console.error('Network or Processing error:', error);
            messageBox.textContent = 'Une erreur est survenue lors du traitement.';
            messageBox.classList.add('error');
        }
    });
});
