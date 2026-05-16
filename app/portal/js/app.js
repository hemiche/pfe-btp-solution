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
                const errData = await response.json();
                messageBox.textContent = errData.error?.message || 'Erreur de connexion.';
                messageBox.classList.add('error');
                return;
            }

            const data = await response.json();
            const result = JSON.parse(data.value);

            if (result.status === 'Pending') {
                messageBox.textContent = 'Votre compte n\'est pas encore approuvé par l\'administrateur.';
                messageBox.classList.add('warning');
            } else if (result.status === 'Rejected') {
                messageBox.textContent = result.message;
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

function showStep(step) {
    document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
    document.getElementById(`step${step}`).classList.add('active');
    
    // Update dots
    for(let i=1; i<=3; i++) {
        const dot = document.getElementById(`dot${i}`);
        if(i < step) {
            dot.className = 'wizard-dot completed';
        } else if(i === step) {
            dot.className = 'wizard-dot active';
        } else {
            dot.className = 'wizard-dot';
        }
    }
    currentStep = step;
}

function nextStep(step) {
    // Basic validation before moving forward
    const currentContainer = document.getElementById(`step${currentStep}`);
    const inputs = currentContainer.querySelectorAll('input[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.checkValidity()) {
            input.reportValidity();
            isValid = false;
        }
    });

    if (isValid) {
        showStep(step);
    }
}

function prevStep(step) {
    showStep(step);
}

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Final validation check
        if (!registerForm.checkValidity()) {
            registerForm.reportValidity();
            return;
        }

        const messageBox = document.getElementById('registerMessage');
        messageBox.className = 'sap-message';
        messageBox.textContent = 'Traitement des documents en cours...';

        // Helper to convert file to Base64
        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result.split(',')[1]); // Only get the base64 part
            reader.onerror = error => reject(error);
        });

        try {
            const docs = [];
            const fileRIB = document.getElementById('fileRIB').files[0];
            const fileNIF = document.getElementById('fileNIF').files[0];
            const fileAI = document.getElementById('fileAI').files[0];

            if (fileRIB) docs.push({ type: 'RIB', fileName: fileRIB.name, content: await toBase64(fileRIB) });
            if (fileNIF) docs.push({ type: 'NIF', fileName: fileNIF.name, content: await toBase64(fileNIF) });
            if (fileAI) docs.push({ type: 'AI', fileName: fileAI.name, content: await toBase64(fileAI) });

            const payload = {
                companyName: document.getElementById('companyName').value.trim(),
                secteurActivite: document.getElementById('secteurActivite').value.trim(),
                rib: document.getElementById('rib').value.trim(),
                nif: document.getElementById('nif').value.trim(),
                ai: document.getElementById('ai').value.trim(),
                email: document.getElementById('email').value.trim(),
                password: document.getElementById('password').value,
                bpRole: document.getElementById('bpRole').value,
                documents: JSON.stringify(docs)
            };

            const response = await fetch('/odata/v4/public/registerPartner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                // Check if response is JSON
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.indexOf("application/json") !== -1) {
                    const errData = await response.json();
                    messageBox.textContent = errData.error?.message || 'Erreur lors de l\'inscription.';
                } else {
                    const text = await response.text();
                    messageBox.textContent = text.includes('Payload Too Large') ? 'Erreur : Les fichiers sont trop volumineux (Max 20MB).' : 'Erreur lors de l\'envoi.';
                }
                messageBox.classList.add('error');
                return;
            }

            const data = await response.json();
            messageBox.textContent = data.value;
            messageBox.classList.add('success');
            
            // Hide form and show success
            document.querySelectorAll('.wizard-step').forEach(el => el.classList.remove('active'));
            document.querySelector('.wizard-progress').style.display = 'none';
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 10000);

        } catch (error) {
            messageBox.textContent = 'Erreur réseau.';
            messageBox.classList.add('error');
        }
    });
}
