// Configuración del acceso único
const CREDENTIALS = {
    username: "minsa",
    password: "123"
};

// URL de tu Google Apps Script
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxxYHVKfSPEPmXg7kd2rVgBtgdVhV01zIgxX4u_pvogr97Y0dY3tlIkFTW7KP_8saCpDQ/exec"; 

function login() {
    const userIn = document.getElementById("username").value;
    const passIn = document.getElementById("password").value;
    const errorMsg = document.getElementById("login-error");

    if (userIn === CREDENTIALS.username && passIn === CREDENTIALS.password) {
        document.getElementById("login-container").style.display = "none";
        document.getElementById("form-container").style.display = "flex";
    } else {
        errorMsg.textContent = "Usuario o contraseña incorrectos.";
    }
}

// Permitir login con Enter
if (document.getElementById("password")) {
    document.getElementById("password").addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            login();
        }
    });
}

// Función genérica para enviar datos a Google Sheets
function submitData(sheetName = "Sifilis") {
    const btn = document.getElementById("btn-submit");
    const status = document.getElementById("submit-status");
    
    if (!GOOGLE_SCRIPT_URL) {
        status.style.color = "red";
        status.textContent = "Error: Falta configurar la URL de Google Apps Script.";
        return;
    }

    btn.disabled = true;
    btn.textContent = "Enviando...";
    status.style.color = "#3498db";
    status.textContent = "Procesando...";

    const form = document.getElementById("epidemiology-form");
    const formData = new FormData(form);
    
    const data = { sheet: sheetName };
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Checkboxes
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        data[cb.name] = cb.checked ? "Sí" : "No";
    });

    // Radio buttons
    const radioNames = new Set();
    form.querySelectorAll('input[type="radio"]').forEach(r => radioNames.add(r.name));
    radioNames.forEach(name => {
        const selected = form.querySelector(`input[type="radio"][name="${name}"]:checked`);
        data[name] = selected ? selected.value : "Sin selección";
    });

    console.log("Datos a enviar a hoja:", sheetName, data);

    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        status.style.color = "#2ecc71";
        status.textContent = "¡Datos guardados exitosamente en Google Drive!";
        btn.textContent = "Guardar e Enviar a Drive";
        btn.disabled = false;
        form.reset();
        
        setTimeout(() => {
            status.textContent = "";
        }, 5000);
    })
    .catch(error => {
        console.error("Error al enviar:", error);
        status.style.color = "red";
        status.textContent = "Hubo un error de conexión al enviar los datos.";
        btn.textContent = "Guardar e Enviar a Drive";
        btn.disabled = false;
    });
}

// ─── AUTO FORMATO FECHAS ────────────────────────────────────────────────────
function activarAutoFechas() {
    document.querySelectorAll('.abs-fecha').forEach(function(el) {
        if (el.dataset.fechaActiva) return;
        el.dataset.fechaActiva = 'true';
        el.maxLength = 10;

        el.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, '');
            if (val.length >= 3 && val.length <= 4) {
                val = val.slice(0,2) + '/' + val.slice(2);
            } else if (val.length >= 5) {
                val = val.slice(0,2) + '/' + val.slice(2,4) + '/' + val.slice(4,8);
            }
            e.target.value = val;
        });
    });
}

// ─── AUTO AVANCE DÍGITO A DÍGITO ────────────────────────────────────────────
function activarDigitos() {
    const grupos = {};
    document.querySelectorAll('.abs-digito').forEach(function(el) {
        if (el.dataset.digitoActivo) return;
        const grupo = el.dataset.grupo || '__sin_grupo__';
        if (!grupos[grupo]) grupos[grupo] = [];
        grupos[grupo].push(el);
    });

    Object.values(grupos).forEach(function(cajitas) {
        cajitas.sort((a, b) => parseInt(a.dataset.idx || 0) - parseInt(b.dataset.idx || 0));

        cajitas.forEach(function(el, idx) {
            el.dataset.digitoActivo = 'true';

            el.addEventListener('input', function() {
                if (this.value.length > 1) this.value = this.value.slice(-1);

                if (this.value !== '' && idx < cajitas.length - 1) {
                    cajitas[idx + 1].focus();
                }

                this.value.trim() !== ''
                    ? this.classList.add('has-value')
                    : this.classList.remove('has-value');
            });

            el.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && this.value === '' && idx > 0) {
                    cajitas[idx - 1].value = '';
                    cajitas[idx - 1].classList.remove('has-value');
                    cajitas[idx - 1].focus();
                }
                if (e.key === 'ArrowRight' && idx < cajitas.length - 1) {
                    cajitas[idx + 1].focus();
                }
                if (e.key === 'ArrowLeft' && idx > 0) {
                    cajitas[idx - 1].focus();
                }
            });

            el.addEventListener('keypress', function(e) {
                if (!/[0-9]/.test(e.key)) e.preventDefault();
            });
        });
    });
}

// Ejecutar al cargar
document.addEventListener('DOMContentLoaded', function() {
    activarAutoFechas();
    activarDigitos();
    const form = document.getElementById('epidemiology-form');
    if (form) {
        const observer = new MutationObserver(function() {
            activarAutoFechas();
            activarDigitos();
        });
        observer.observe(form, { childList: true });
    }
});
