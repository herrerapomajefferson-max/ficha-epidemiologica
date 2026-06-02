let draggedEl = null;
let selectedEl = null;
let offsetX = 0, offsetY = 0;

const DRAGGABLE_CLASSES = ['abs-input', 'abs-check', 'abs-radio', 'abs-fecha-seg', 'abs-digito'];

function esDraggable(el) {
    return DRAGGABLE_CLASSES.some(c => el.classList.contains(c));
}

document.addEventListener('mousedown', function(e) {
    const editToggle = document.getElementById('edit-mode-toggle');
    if (editToggle && editToggle.checked) {
        if (esDraggable(e.target)) {
            draggedEl = e.target;
            selectedEl = e.target;

            // Resaltar el elemento seleccionado con un borde rojo fuerte
            document.querySelectorAll('.abs-input, .abs-check, .abs-radio, .abs-fecha-seg')
                .forEach(el => el.style.boxShadow = 'none');
            selectedEl.style.boxShadow = '0 0 5px 2px red';

            const rect = draggedEl.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            if (e.target.classList.contains('abs-input') && (rect.right - e.clientX) < 15) {
                // Permitir redimensionar desde la esquina derecha
                draggedEl = null;
            } else {
                e.preventDefault();
            }
        } else if (!e.target.closest('#edit-panel')) {
            // Deseleccionar si hacemos clic en otro lado
            if (selectedEl) selectedEl.style.boxShadow = 'none';
            selectedEl = null;
        }
    }
});

document.addEventListener('mousemove', function(e) {
    if (draggedEl) {
        const container = document.querySelector('.document-wrapper');
        const containerRect = container.getBoundingClientRect();
        
        let newLeft = e.clientX - containerRect.left - offsetX;
        let newTop = e.clientY - containerRect.top - offsetY;
        
        let leftPercent = (newLeft / containerRect.width) * 100;
        let topPercent = (newTop / containerRect.height) * 100;
        
        draggedEl.style.left = leftPercent.toFixed(2) + '%';
        draggedEl.style.top = topPercent.toFixed(2) + '%';
    }
});

document.addEventListener('mouseup', function() {
    draggedEl = null;
});

// FUNCIONES PARA AGREGAR Y BORRAR

// Fecha SEPARADA en Día / Mes / Año (auto-avance al siguiente campo)
function agregarFechaSeparada() {
    let nombre = prompt("Escribe el nombre base para esta fecha (ejemplo: fecha_notificacion, sin espacios):");
    if (!nombre) return;

    // Crear los 3 segmentos: DIA, MES, AÑO
    let segmentos = [
        { sufijo: '_dia',  maxLen: 2, ancho: '3%',  placeholder: 'DD' },
        { sufijo: '_mes',  maxLen: 2, ancho: '3%',  placeholder: 'MM' },
        { sufijo: '_anio', maxLen: 4, ancho: '4.5%', placeholder: 'AAAA' }
    ];

    let ids = [];
    segmentos.forEach((seg, i) => {
        let el = document.createElement('input');
        el.type = 'text';
        el.name = nombre + seg.sufijo;
        el.id  = 'fseg_' + nombre + seg.sufijo + '_' + Date.now() + i;
        el.className = 'abs-fecha-seg';
        el.maxLength = seg.maxLen;
        el.placeholder = seg.placeholder;
        el.style.top   = '10%';
        el.style.left  = (10 + i * 6) + '%';
        el.style.width = seg.ancho;
        el.dataset.tipo = 'fecha_seg';
        el.dataset.grupo = nombre;
        document.getElementById('epidemiology-form').appendChild(el);
        ids.push(el.id);
    });

    // Auto-avance: al completar el campo salta al siguiente
    ids.forEach((id, idx) => {
        let el = document.getElementById(id);
        el.addEventListener('input', function() {
            if (this.value.length === this.maxLength && idx < ids.length - 1) {
                let siguiente = document.getElementById(ids[idx + 1]);
                if (siguiente) siguiente.focus();
            }
        });
        // Solo números
        el.addEventListener('keypress', function(e) {
            if (!/[0-9]/.test(e.key)) e.preventDefault();
        });
    });

    // Seleccionar el primero para que el usuario lo arrastre
    let primero = document.getElementById(ids[0]);
    seleccionarElemento(primero);
    alert('✅ Se crearon 3 campos para "' + nombre + '":\n  · ' + nombre + '_dia (DD)\n  · ' + nombre + '_mes (MM)\n  · ' + nombre + '_anio (AAAA)\n\nAhora arrástros uno por uno sobre los casilleros del documento.\nAl escribir, el cursor saltará solo al siguiente campo.');
}

// Campo DÍGITO A DÍGITO: un input por cajita (DNI, códigos, etc.)
function agregarDigitos() {
    let nombre = prompt("Nombre del campo (ejemplo: dni_madre, codigo_rn):");
    if (!nombre) return;

    let cantidad = parseInt(prompt("¿Cuántas cajitas tiene este campo?\n(Ejemplo: DNI = 8, Código RN = 10)", "8"));
    if (isNaN(cantidad) || cantidad < 1) return;

    let anchoPorc = parseFloat(prompt(
        "¿Qué tan ancho es cada cajita en % del formulario?\n" +
        "Consejo: empieza con 1.5 y ajusta arrastrando.",
        "1.5"
    ));
    if (isNaN(anchoPorc)) anchoPorc = 1.5;

    let ids = [];
    for (let i = 0; i < cantidad; i++) {
        let el = document.createElement('input');
        el.type = 'text';
        el.name = nombre + '_' + (i + 1);
        el.id  = 'dig_' + nombre + '_' + i + '_' + Date.now();
        el.className = 'abs-digito';
        el.maxLength = 1;
        el.dataset.tipo  = 'digito';
        el.dataset.grupo = nombre;
        el.dataset.idx   = i;
        el.style.top   = '10%';
        el.style.left  = (10 + i * (anchoPorc + 0.1)) + '%';
        el.style.width = anchoPorc + '%';
        el.style.height = '22px';
        document.getElementById('epidemiology-form').appendChild(el);
        ids.push(el.id);
    }

    // Auto-avance y retroceso entre cajitas
    ids.forEach((id, idx) => {
        let el = document.getElementById(id);

        el.addEventListener('input', function() {
            if (this.value.length > 1) this.value = this.value.slice(-1);
            if (this.value !== '' && idx < ids.length - 1) {
                document.getElementById(ids[idx + 1]).focus();
            }
            this.value.trim() !== '' ? this.classList.add('has-value') : this.classList.remove('has-value');
        });

        el.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && this.value === '' && idx > 0) {
                let prev = document.getElementById(ids[idx - 1]);
                prev.value = '';
                prev.classList.remove('has-value');
                prev.focus();
            }
        });
    });

    seleccionarElemento(document.getElementById(ids[0]));
    alert('✅ Se crearon ' + cantidad + ' cajitas para "' + nombre + '".\n\nArrástralas una por una sobre cada cuadrito del formulario.\nEl cursor saltará solo de cajita en cajita al escribir.');
}

function agregarFecha() {
    let name = prompt("Escribe el nombre para esta fecha (ejemplo: fecha_nacimiento, sin espacios):");
    if (!name) return;
    
    let el = document.createElement('input');
    el.type = 'text';
    el.name = name;
    el.className = 'abs-input abs-fecha';
    el.style.top = '10%';
    el.style.left = '10%';
    el.style.width = '22%';
    el.maxLength = 10;
    el.dataset.tipo = 'fecha';
    
    // Auto-formato DD/MM/AAAA mientras escribe
    el.addEventListener('input', function(e) {
        let val = e.target.value.replace(/\D/g, ''); // Solo números
        if (val.length >= 3 && val.length <= 4) {
            val = val.slice(0,2) + '/' + val.slice(2);
        } else if (val.length >= 5) {
            val = val.slice(0,2) + '/' + val.slice(2,4) + '/' + val.slice(4,8);
        }
        e.target.value = val;
    });
    
    document.getElementById('epidemiology-form').appendChild(el);
    seleccionarElemento(el);
    alert('✅ Fecha "' + name + '" creada.\n\nEl sistema pondrá las barras (/) automáticamente mientras la enfermera escribe.\nFormato: DD/MM/AAAA');
}

function agregarTexto() {
    let name = prompt("Escribe un nombre para este campo (ejemplo: edad_padre, sin espacios):");
    if (!name) return;
    
    let el = document.createElement('input');
    el.type = 'text';
    el.name = name;
    el.className = 'abs-input';
    el.style.top = '10%';
    el.style.left = '10%';
    el.style.width = '20%';
    el.placeholder = name;
    document.getElementById('epidemiology-form').appendChild(el);
    
    seleccionarElemento(el);
}

function agregarCasilla() {
    let name = prompt("Escribe un nombre para esta casilla (ejemplo: opcion_si, sin espacios):");
    if (!name) return;
    
    let el = document.createElement('input');
    el.type = 'checkbox';
    el.name = name;
    el.className = 'abs-check';
    el.style.top = '10%';
    el.style.left = '10%';
    document.getElementById('epidemiology-form').appendChild(el);
    
    seleccionarElemento(el);
}

function agregarSeleccion() {
    let name = prompt("Escribe un nombre para esta lista de selección (ej: tipo_parto):");
    if (!name) return;
    
    let opcionesStr = prompt("Escribe las opciones separadas por coma (ej: Normal,Cesárea,Otro):");
    if (!opcionesStr) return;
    
    let el = document.createElement('select');
    el.name = name;
    el.className = 'abs-input'; // Reutilizamos esta clase para mantener estilos y comportamiento de arrastre
    el.style.top = '10%';
    el.style.left = '10%';
    el.style.width = '20%';
    
    let opciones = opcionesStr.split(',');
    opciones.forEach(op => {
        let optionEl = document.createElement('option');
        optionEl.value = op.trim();
        optionEl.textContent = op.trim();
        el.appendChild(optionEl);
    });
    
    document.getElementById('epidemiology-form').appendChild(el);
    seleccionarElemento(el);
}

function seleccionarElemento(el) {
    document.querySelectorAll('.abs-input, .abs-check, .abs-radio, .abs-fecha-seg')
        .forEach(e => e.style.boxShadow = 'none');
    selectedEl = el;
    el.style.boxShadow = '0 0 5px 2px red';
}

function agregarRadio() {
    let name = prompt("Escribe el nombre de la pregunta (ejemplo: tipo_parto, sin espacios):\nTodas las opciones compartirán este nombre.");
    if (!name) return;
    
    let opcionesStr = prompt("Escribe las opciones separadas por coma (máximo 6):\nEjemplo: Normal,Cesárea,Fórceps,Otro");
    if (!opcionesStr) return;
    
    let opciones = opcionesStr.split(',').map(o => o.trim()).filter(o => o);
    if (opciones.length === 0) return;
    
    let baseTop = 10;
    opciones.forEach((op, i) => {
        let el = document.createElement('input');
        el.type = 'radio';
        el.name = name;
        el.value = op;
        el.className = 'abs-radio';
        el.style.top = (baseTop + i * 2) + '%';
        el.style.left = '10%';
        el.title = op; // Mostrar el valor al pasar el mouse
        document.getElementById('epidemiology-form').appendChild(el);
    });
    
    // Seleccionar el primero
    let primero = document.querySelector('.abs-radio[name="' + name + '"]');
    if (primero) seleccionarElemento(primero);
    
    alert('✅ Se crearon ' + opciones.length + ' opciones de radio para "' + name + '".\n\nAhora acomódalas encima de los cuadritos del documento.\nPasa el mouse sobre cada una para ver qué valor tiene.');
}

function alinearEnFila() {
    let name = prompt("Escribe el nombre del grupo a alinear:\n(Ejemplo: inst_minsa, tipo_parto)\n\nTodas las opciones con ese nombre quedarán a la misma altura y ordenadas.");
    if (!name) return;

    let elementos = Array.from(document.querySelectorAll(`[name="${name}"]`))
        .filter(el => el.classList.contains('abs-radio') || el.classList.contains('abs-check') || el.classList.contains('abs-input'));

    if (elementos.length === 0) {
        alert(`No se encontraron campos con el nombre "${name}".\n\nVerifica que esté escrito igual (mayúsculas/minúsculas).`);
        return;
    }
    if (elementos.length === 1) {
        alert('Solo hay 1 elemento con ese nombre. Necesitas al menos 2 para alinear.');
        return;
    }

    // Ordenar de izquierda a derecha
    elementos.sort((a, b) => parseFloat(a.style.left || 0) - parseFloat(b.style.left || 0));

    // Tomar el top del primero como referencia
    let topRef = parseFloat(elementos[0].style.top) || 10;
    let leftInicio = parseFloat(elementos[0].style.left) || 10;

    let espaciado = parseFloat(prompt(
        `✅ Se encontraron ${elementos.length} opciones.\n\n¿Cuánto espacio entre cada una? (en % del ancho total)\nEjemplo: 7 = separación normal | 5 = más juntas | 10 = más separadas`,
        '7'
    ));
    if (isNaN(espaciado)) espaciado = 7;

    elementos.forEach((el, i) => {
        el.style.top  = topRef + '%';
        el.style.left = (leftInicio + i * espaciado) + '%';
    });

    alert(`✅ ${elementos.length} opciones alineadas en fila con ${espaciado}% de separación.`);
}

function borrarSeleccionado() {
    if (selectedEl) {
        if(confirm("¿Seguro que deseas borrar el campo '" + (selectedEl.name || selectedEl.value) + "'?")) {
            selectedEl.remove();
            selectedEl = null;
        }
    } else {
        alert("Primero haz clic en la cajita o cuadradito que quieres borrar para seleccionarlo (se pondrá con borde rojo), y luego presiona este botón.");
    }
}

function aumentarAncho() {
    if (selectedEl && !selectedEl.classList.contains('abs-check')) {
        let currentWidth = parseFloat(selectedEl.style.width) || 20;
        selectedEl.style.width = (currentWidth + 2) + '%';
    } else {
        alert("Selecciona un cuadro de texto o lista primero. Las casillas no cambian de tamaño.");
    }
}

function reducirAncho() {
    if (selectedEl && !selectedEl.classList.contains('abs-check')) {
        let currentWidth = parseFloat(selectedEl.style.width) || 20;
        selectedEl.style.width = Math.max(2, currentWidth - 2) + '%';
    } else {
        alert("Selecciona un cuadro de texto o lista primero.");
    }
}

function aumentarAlto() {
    if (selectedEl && !selectedEl.classList.contains('abs-check')) {
        let currentHeight = parseFloat(selectedEl.style.height) || selectedEl.offsetHeight;
        if(selectedEl.style.height && selectedEl.style.height.includes('%')) {
           selectedEl.style.height = (parseFloat(selectedEl.style.height) + 0.5) + '%';
        } else {
           selectedEl.style.height = (currentHeight + 2) + 'px';
        }
    }
}

function reducirAlto() {
    if (selectedEl && !selectedEl.classList.contains('abs-check')) {
        let currentHeight = parseFloat(selectedEl.style.height) || selectedEl.offsetHeight;
        if(selectedEl.style.height && selectedEl.style.height.includes('%')) {
           selectedEl.style.height = Math.max(0.5, parseFloat(selectedEl.style.height) - 0.5) + '%';
        } else {
           selectedEl.style.height = Math.max(10, currentHeight - 2) + 'px';
        }
    }
}

function aumentarLetra() {
    if (selectedEl) {
        let currentSize = parseFloat(window.getComputedStyle(selectedEl).fontSize);
        selectedEl.style.fontSize = (currentSize + 1) + 'px';
    }
}

function reducirLetra() {
    if (selectedEl) {
        let currentSize = parseFloat(window.getComputedStyle(selectedEl).fontSize);
        selectedEl.style.fontSize = Math.max(8, currentSize - 1) + 'px';
    }
}

function exportarPosiciones() {
    let finalHTML = "== CODIGO GENERADO ==\n";
    document.querySelectorAll('.abs-input, .abs-check, .abs-radio, .abs-fecha-seg, .abs-digito').forEach(el => {
        let isFecha    = el.classList.contains('abs-fecha');
        let isFechaSeg = el.classList.contains('abs-fecha-seg');
        let isCheck    = el.classList.contains('abs-check');
        let isRadio    = el.classList.contains('abs-radio');
        let style = `top: ${el.style.top}; left: ${el.style.left};`;
        if (el.style.width)    style += ` width: ${el.style.width};`;
        if (el.style.height)   style += ` height: ${el.style.height};`;
        if (el.style.fontSize) style += ` font-size: ${el.style.fontSize};`;

        if (isFechaSeg) {
            finalHTML += `<input type="text" name="${el.name}" class="abs-fecha-seg" maxlength="${el.maxLength}" data-tipo="fecha_seg" data-grupo="${el.dataset.grupo}" placeholder="${el.placeholder}" style="${style}">\n`;
        } else if (el.classList.contains('abs-digito')) {
            finalHTML += `<input type="text" name="${el.name}" class="abs-digito" maxlength="1" data-tipo="digito" data-grupo="${el.dataset.grupo}" data-idx="${el.dataset.idx}" style="${style}">\n`;
        } else if (isCheck) {
            finalHTML += `<input type="checkbox" name="${el.name}" class="abs-check" style="${style}">\n`;
        } else if (isRadio) {
            finalHTML += `<input type="radio" name="${el.name}" value="${el.value}" class="abs-radio" style="${style}">\n`;
        } else if (el.tagName === 'SELECT') {
            finalHTML += `<select name="${el.name}" class="abs-input" style="${style}">`;
            Array.from(el.options).forEach(opt => {
                finalHTML += `<option value="${opt.value}">${opt.text}</option>`;
            });
            finalHTML += `</select>\n`;
        } else if (isFecha) {
            finalHTML += `<input type="text" name="${el.name}" class="abs-input abs-fecha" maxlength="10" data-tipo="fecha" style="${style}">\n`;
        } else {
            finalHTML += `<input type="text" name="${el.name}" class="abs-input" style="${style}">\n`;
        }
    });
    
    navigator.clipboard.writeText(finalHTML).then(() => {
        alert("¡Todo listo! Ve al chat de la IA, dale a Pegar y envíame el texto.");
    }).catch(err => {
        const ta = document.createElement("textarea");
        ta.value = finalHTML;
        ta.style.position = "fixed";
        ta.style.top = "10%"; ta.style.left = "10%";
        ta.style.width = "80%"; ta.style.height = "80%";
        ta.style.zIndex = "9999";
        document.body.appendChild(ta);
        alert("No se pudo copiar automáticamente. Por favor copia el texto del recuadro que acaba de aparecer.");
    });
}
