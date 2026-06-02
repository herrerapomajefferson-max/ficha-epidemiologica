// Configuración del acceso único
const CREDENTIALS = {
    username: "minsa",
    password: "123" // Contraseña fácil por defecto, el usuario la puede cambiar en el código
};

// URL de tu Google Apps Script (Debe ser reemplazada por el usuario más adelante)
// const GOOGLE_SCRIPT_URL = "URL_DE_TU_SCRIPT_AQUI";
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvacow__X9DVV8KZdMu_9uS27ZFToqLsvHijYs189FbeYXn6xFOh4M0apKRK2ZUi2p4w/exec"; 

function login() {
    const userIn = document.getElementById("username").value;
    const passIn = document.getElementById("password").value;
    const errorMsg = document.getElementById("login-error");

    if (userIn === CREDENTIALS.username && passIn === CREDENTIALS.password) {
        // Acceso exitoso
        document.getElementById("login-container").style.display = "none";
        document.getElementById("form-container").style.display = "flex";
    } else {
        // Error
        errorMsg.textContent = "Usuario o contraseña incorrectos.";
    }
}

// Permitir login con Enter
document.getElementById("password").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        login();
    }
});

// Función para recolectar datos y enviar
function submitData() {
    const btn = document.getElementById("btn-submit");
    const status = document.getElementById("submit-status");
    
    if (!GOOGLE_SCRIPT_URL) {
        status.style.color = "red";
        status.textContent = "Error: Falta configurar la URL de Google Apps Script. Revisa el archivo app.js.";
        return;
    }

    btn.disabled = true;
    btn.textContent = "Enviando...";
    status.style.color = "#3498db";
    status.textContent = "Procesando...";

    // Recolectar datos del formulario
    const form = document.getElementById("epidemiology-form");
    const formData = new FormData(form);
    
    // Convertir a un objeto plano
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    // Checkboxes: registrar marcados y no marcados
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
        data[cb.name] = cb.checked ? "Sí" : "No";
    });

    // Radio buttons: registrar el valor seleccionado, o "Sin selección" si ninguno fue marcado
    const radioNames = new Set();
    form.querySelectorAll('input[type="radio"]').forEach(r => radioNames.add(r.name));
    radioNames.forEach(name => {
        const selected = form.querySelector(`input[type="radio"][name="${name}"]:checked`);
        data[name] = selected ? selected.value : "Sin selección";
    });

    console.log("Datos a enviar:", data);

    // Enviar por fetch usando POST/GET (dependiendo de la conf. de GAS. Usaremos POST a través de form-urlencoded o JSON stringificado)
    fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // Requerido para peticiones a Google Apps Script sin problemas de CORS en el cliente
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        // En mode no-cors, la respuesta siempre es opaca (status 0), asumimos éxito si no hay excepción
        status.style.color = "#2ecc71";
        status.textContent = "¡Datos guardados exitosamente en Google Drive!";
        btn.textContent = "Guardar e Enviar a Drive";
        btn.disabled = false;
        form.reset(); // Limpiar el formulario
        
        // Ocultar mensaje de éxito después de 5 segundos
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
// Activa el auto-formato DD/MM/AAAA en todos los campos con clase abs-fecha
function activarAutoFechas() {
    document.querySelectorAll('.abs-fecha').forEach(function(el) {
        if (el.dataset.fechaActiva) return; // Evitar duplicar el listener
        el.dataset.fechaActiva = 'true';
        el.maxLength = 10;

        el.addEventListener('input', function(e) {
            let val = e.target.value.replace(/\D/g, ''); // Solo dígitos
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
// Conecta el salto automático entre cajitas de un mismo grupo (DNI, códigos)
function activarDigitos() {
    // Agrupar todas las cajitas por su data-grupo
    const grupos = {};
    document.querySelectorAll('.abs-digito').forEach(function(el) {
        if (el.dataset.digitoActivo) return; // Evitar duplicar listeners
        const grupo = el.dataset.grupo || '__sin_grupo__';
        if (!grupos[grupo]) grupos[grupo] = [];
        grupos[grupo].push(el);
    });

    Object.values(grupos).forEach(function(cajitas) {
        // Ordenar por data-idx para respetar el orden original
        cajitas.sort((a, b) => parseInt(a.dataset.idx || 0) - parseInt(b.dataset.idx || 0));

        cajitas.forEach(function(el, idx) {
            el.dataset.digitoActivo = 'true';

            el.addEventListener('input', function() {
                // Solo permitir 1 dígito
                if (this.value.length > 1) this.value = this.value.slice(-1);

                // Saltar al siguiente si se escribió algo
                if (this.value !== '' && idx < cajitas.length - 1) {
                    cajitas[idx + 1].focus();
                }

                // Clase visual
                this.value.trim() !== ''
                    ? this.classList.add('has-value')
                    : this.classList.remove('has-value');
            });

            el.addEventListener('keydown', function(e) {
                // Retroceder con Backspace si la cajita está vacía
                if (e.key === 'Backspace' && this.value === '' && idx > 0) {
                    cajitas[idx - 1].value = '';
                    cajitas[idx - 1].classList.remove('has-value');
                    cajitas[idx - 1].focus();
                }
                // Saltar al siguiente con ArrowRight
                if (e.key === 'ArrowRight' && idx < cajitas.length - 1) {
                    cajitas[idx + 1].focus();
                }
                // Saltar al anterior con ArrowLeft
                if (e.key === 'ArrowLeft' && idx > 0) {
                    cajitas[idx - 1].focus();
                }
            });

            // Solo números (opcional: quitar si necesitas letras también)
            el.addEventListener('keypress', function(e) {
                if (!/[0-9]/.test(e.key)) e.preventDefault();
            });
        });
    });
}

// Ejecutar al cargar y observar campos nuevos que se agreguen dinámicamente
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
