const MAPA_IMAGENES = {
    "Fiesta": "img/autos/ford_fiesta.jpg",
    "Focus": "img/autos/ford_focus.jpg",
    "Ka": "img/autos/ford_ka.jpg",
    "EcoSport": "img/autos/ford_ecosport.jpg",
    "Ranger": "img/autos/ford_ranger.jpg",
    "Transit": "img/autos/ford_transit.jpg",
    "Agile": "img/autos/chevrolet_agile.jpg",
    "Cruze": "img/autos/chevrolet_cruze.jpg",
    "Onix": "img/autos/chevrolet_onix.jpg",
    "S10": "img/autos/chevrolet_s10.jpg",
    "Tracker": "img/autos/chevrolet_tracker.jpg",
    "Gol": "img/autos/vw_gol.jpg",
    "Polo": "img/autos/vw_polo.jpg",
    "Golf": "img/autos/vw_golf.jpg",
    "Amarok": "img/autos/vw_amarok.jpg",
    "Clio": "img/autos/renault_clio.jpg",
    "Megane": "img/autos/renault_megane.jpg",
    "Kangoo": "img/autos/renault_kangoo.jpg",
    "207": "img/autos/peugeot_207.jpg",
    "208": "img/autos/peugeot_208.jpg",
    "308": "img/autos/peugeot_308.jpg",
    "Palio": "img/autos/fiat_palio.jpg",
    "Punto": "img/autos/fiat_punto.jpg",
    "Siena": "img/autos/fiat_siena.jpg",
    "Cronos": "img/autos/fiat_cronos.jpg",
    "Strada": "img/autos/fiat_strada.jpg",
    "Uno": "img/autos/fiat_uno.jpg",
    "Corolla": "img/autos/toyota_corolla.jpg",
    "Hilux": "img/autos/toyota_hilux.jpg",
    "SW4": "img/autos/toyota_sw4.jpg",
    "Etios": "img/autos/toyota_etios.jpg",
    "Yaris": "img/autos/toyota_yaris.jpg",
    "Civic": "img/autos/honda_civic.jpg",
    "Fit": "img/autos/honda_fit.jpg",
    "CR-V": "img/autos/honda_crv.jpg",
    "HR-V": "img/autos/honda_hrv.jpg",
    "Accent": "img/autos/hyundai_accent.jpg",
    "i30": "img/autos/hyundai_i30.jpg",
    "Santa Fe": "img/autos/hyundai_santafe.jpg",
    "C3": "img/autos/citroen_c3.jpg",
    "C4": "img/autos/citroen_c4.jpg",
    "Kicks": "img/autos/nissan_kicks.jpg",
};

// ─── INDEXEDDB ───────────────────────────────────────────────────────────────
let db;

function abrirDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('ManualesAutos', 1);
        req.onupgradeneeded = e => {
            e.target.result.createObjectStore('pdfs', { autoIncrement: true });
        };
        req.onsuccess = e => { db = e.target.result; resolve(); };
        req.onerror = () => reject(req.error);
    });
}

function guardarPDF(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
            const tx = db.transaction('pdfs', 'readwrite');
            const req = tx.objectStore('pdfs').add({ buffer: e.target.result, nombre: file.name, tipo: file.type });
            req.onsuccess = () => resolve('idb:' + req.result);
            req.onerror = () => reject(req.error);
        };
        reader.readAsArrayBuffer(file);
    });
}

function abrirPDF(key) {
    const id = parseInt(key.replace('idb:', ''));
    const tx = db.transaction('pdfs', 'readonly');
    const req = tx.objectStore('pdfs').get(id);
    req.onsuccess = () => {
        const { buffer, tipo } = req.result;
        const blob = new Blob([buffer], { type: tipo });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    };
}


function guardarImagen(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => {
            const tx = db.transaction('pdfs', 'readwrite');
            const req = tx.objectStore('pdfs').add({ buffer: e.target.result, nombre: file.name, tipo: file.type });
            req.onsuccess = () => resolve('idb:' + req.result);
            req.onerror = () => reject(req.error);
        };
        reader.readAsArrayBuffer(file);
    });
}

function cargarImagenEnImg(key, imgElement) {
    if (!key || !key.startsWith('idb:')) return;
    const id = parseInt(key.replace('idb:', ''));
    const tx = db.transaction('pdfs', 'readonly');
    const req = tx.objectStore('pdfs').get(id);
    req.onsuccess = () => {
        const { buffer, tipo } = req.result;
        const blob = new Blob([buffer], { type: tipo });
        imgElement.src = URL.createObjectURL(blob);

        imgElement.classList.add('custom');
    };
}


// ─── RANGO DE AÑOS ─────────────────────────────────────────────────

function poblarSelectAnios(desdeId, hastaId) {
    const actual = new Date().getFullYear();
    const desde = document.getElementById(desdeId);
    const hasta = document.getElementById(hastaId);
    desde.innerHTML = '';
    hasta.innerHTML = '';

    const optPresente = document.createElement('option');
    optPresente.value = 'presente';
    optPresente.textContent = 'Presente';
    hasta.appendChild(optPresente);

    for (let y = actual; y >= 1960; y--) {
        [desde, hasta].forEach(sel => {
            if (sel === hasta && y === actual) return;
            const o = document.createElement('option');
            o.value = y; o.textContent = y;
            sel.appendChild(o);
        });
    }
}

// ─── VARIABLES GLOBALES ─────────────────────────────────────────────────────
let data = [];
const filterSel = document.getElementById('filterMarca');

// ─── CARGA DE DATOS (FETCH + LOCALSTORAGE) ──────────────────────────────────
async function cargarDatos() {
    try {
        await abrirDB();
        const cache = localStorage.getItem('misManualesAutos');

        if (cache) {

            data = JSON.parse(cache);
        } else {
            // Si no hay caché, pedimos el data.json original
            const respuesta = await fetch('data.json');
            if (!respuesta.ok) throw new Error('Error de red al cargar el JSON');
            data = await respuesta.json();


            actualizarCache();
        }


        data.forEach(m => {
            const o = document.createElement('option');
            o.value = m.marca;
            o.textContent = m.marca;
            filterSel.appendChild(o);
        });

        renderLista();

    } catch (error) {
        console.error("Hubo un problema cargando los manuales:", error);
        document.getElementById('lista').innerHTML = '<div class="no-resultados">Error al cargar los datos.</div>';
    }

    lucide.createIcons();
}

function actualizarCache() {
    localStorage.setItem('misManualesAutos', JSON.stringify(data));
}

// ─── RENDER ──────────────────────────────────────────────────────────────────
function renderLista(query = '', marcaFiltro = '') {
    const lista = document.getElementById('lista');
    lista.innerHTML = '';
    const q = query.toLowerCase();
    let hayResultados = false;

    data.forEach(m => {
        if (marcaFiltro && m.marca !== marcaFiltro) return;
        const modelos = q ? m.modelos.filter(mo => mo.nombre.toLowerCase().includes(q)) : m.modelos;
        if (modelos.length === 0) return;
        hayResultados = true;

        const sec = document.createElement('div');
        sec.className = 'marca-section';
        sec.innerHTML = `
      <div class="marca-header">
        <div class="marca-stripe"><span></span><span></span><span></span></div>
        <span class="marca-nombre">${m.marca}</span>
      </div>
      <div class="modelos-grid"></div>
    `;

        const grid = sec.querySelector('.modelos-grid');

        modelos.forEach(mo => {
            const gens = mo.generaciones.filter(g => g.pdf !== '#');
            const desde = gens.length ? gens[0].años.split(/[-–]/)[0].trim() : '';
            const hasta = gens.length ? gens[gens.length - 1].años.split(/[-–]/)[1]?.trim() || 'presente' : '';

            const card = document.createElement('div');
            card.className = 'modelo-card';
            card.innerHTML = `
        <div class="modelo-img-wrap"><img class="modelo-img" data-imgkey="${mo.imagen || ''}" src="img/car.svg" alt="auto"></div>
        ${gens.length ? `<span class="gen-count-badge">${gens.length} manual${gens.length > 1 ? 'es' : ''}</span>` : ''}
        <div class="modelo-nombre">${mo.nombre}</div>
        ${desde ? `<div class="modelo-años">${desde}–${hasta}</div>` : '<div class="modelo-años" style="color:var(--border)">Sin manuales cargados</div>'}
        <div class="modelo-link">Ver manuales →</div>
      `;
            card.addEventListener('click', () => abrirModalVer(m.marca, mo));
            grid.appendChild(card);

            const img = card.querySelector('.modelo-img');
            if (mo.imagen) {
                cargarImagenEnImg(mo.imagen, img);
            } else if (MAPA_IMAGENES[mo.nombre]) {
                img.src = MAPA_IMAGENES[mo.nombre];
                img.classList.add('custom');
            }
        });

        // Card +
        const addCard = document.createElement('div');
        addCard.className = 'modelo-card add-card';
        addCard.innerHTML = `
      <div class="add-card-icon"><i data-lucide="plus" width="20" height="20"></i></div>
      <div class="add-card-label">Agregar manual</div>
    `;
        addCard.addEventListener('click', () => abrirModalCargar(m.marca));
        grid.appendChild(addCard);

        lista.appendChild(sec);
    });

    if (!hayResultados) {
        lista.innerHTML = '<div class="no-resultados">No se encontraron modelos.</div>';
    }

    lucide.createIcons();
}

// ─── MODAL VER ───────────────────────────────────────────────────────────────
function abrirModalVer(marca, modelo) {
    document.getElementById('verMarca').textContent = marca;
    document.getElementById('verTitulo').textContent = modelo.nombre;

    const imgWrap = document.getElementById('verImgWrap');
    imgWrap.innerHTML = `<img id="verImgPreview" src="img/car.svg" style="height:80px; opacity:0.25; margin: 0 1em 0 1em;">`;
    const preview = document.getElementById('verImgPreview');
    if (modelo.imagen) {
        cargarImagenEnImg(modelo.imagen, preview);
    } else if (MAPA_IMAGENES[modelo.nombre]) {
        preview.src = MAPA_IMAGENES[modelo.nombre];
        preview.style.opacity = '1';
    }

    document.getElementById('verCambiarFoto').onclick = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async e => {
            const file = e.target.files[0];
            if (!file) return;
            const key = await guardarImagen(file);
            modelo.imagen = key;
            actualizarCache();
            cargarImagenEnImg(key, document.getElementById('verImgPreview'));
            renderLista(document.getElementById('navSearch').value, filterSel.value);
        };
        input.click();
    };

    const genDiv = document.getElementById('verGeneraciones');
    genDiv.innerHTML = '';

    const conPdf = modelo.generaciones.filter(g => g.pdf !== '#');

    if (!conPdf.length) {
        genDiv.innerHTML = '<div class="modal-empty">Aún no hay manuales cargados para este modelo.</div>';
    } else {
        conPdf.forEach((gen, index) => {
            const item = document.createElement('div');
            item.className = 'generacion-item';
            item.innerHTML = `
        <div class="gen-info">
            <div class="gen-nombre" id="genNombre-${index}">${gen.nombre}</div>
            <div class="gen-años" id="genAnios-${index}">${gen.años}</div>
            ${gen.nota ? `<div class="gen-nota" id="genNota-${index}">${gen.nota}</div>` : ''}
        </div>
        <div class="gen-acciones">
            <button class="gen-btn" onclick="abrirPDF('${gen.pdf}')">Abrir PDF →</button>
            <button class="gen-btn-edit" onclick="editarGen(this, '${modelo.nombre}', '${marca}', ${index})">✏</button>
            <button class="gen-btn-delete" onclick="eliminarGen('${modelo.nombre}', '${marca}', ${index})">✕</button>
        </div>
    `;
            genDiv.appendChild(item);
        });
    }

    document.getElementById('modalVer').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function cerrarModalVer() {
    document.getElementById('modalVer').classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('verClose').addEventListener('click', cerrarModalVer);
document.getElementById('modalVer').addEventListener('click', e => {
    if (e.target === document.getElementById('modalVer')) cerrarModalVer();
});

function editarGen(btn, modeloNombre, marca, index) {
    const marcaData = data.find(m => m.marca === marca);
    const modeloData = marcaData.modelos.find(mo => mo.nombre === modeloNombre);
    const gen = modeloData.generaciones.filter(g => g.pdf !== '#')[index];
    const item = btn.closest('.generacion-item');

    // Si ya está en modo edición, salir
    if (item.classList.contains('editando')) {
        const nuevoNombre = item.querySelector('.edit-nombre').value.trim();
        const nuevosAnios = `${item.querySelector('.edit-anio-desde').value}–${item.querySelector('.edit-anio-hasta').value}`;
        const nuevaNota = item.querySelector('.edit-nota').value.trim();

        gen.nombre = nuevoNombre || gen.nombre;
        gen.años = nuevosAnios;
        gen.nota = nuevaNota;

        actualizarCache();
        abrirModalVer(marca, modeloData);
        return;
    }

    item.classList.add('editando');
    item.querySelector('.gen-info').innerHTML = `
    <input class="form-input edit-nombre" value="${gen.nombre}" placeholder="Generación">
    <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
        <select class="form-select edit-anio-desde"></select>
        <span style="color:var(--text-muted); font-size:13px;">hasta</span>
        <select class="form-select edit-anio-hasta"></select>
    </div>
    <input class="form-input edit-nota" value="${gen.nota || ''}" placeholder="Nota opcional">
`;
    const partes = gen.años.split(/[-–]/);
    const desdeVal = partes[0]?.trim();
    const hastaVal = partes[1]?.trim();

    const selDesde = item.querySelector('.edit-anio-desde');
    const selHasta = item.querySelector('.edit-anio-hasta');

    const actualYear = new Date().getFullYear();
    const optPresente = document.createElement('option');
    optPresente.value = 'presente'; optPresente.textContent = 'Presente';
    selHasta.appendChild(optPresente);

    for (let y = actualYear; y >= 1960; y--) {
        const o1 = document.createElement('option');
        o1.value = y; o1.textContent = y;
        if (String(y) === desdeVal) o1.selected = true;
        selDesde.appendChild(o1);

        if (y === actualYear) continue;
        const o2 = document.createElement('option');
        o2.value = y; o2.textContent = y;
        if (String(y) === hastaVal) o2.selected = true;
        selHasta.appendChild(o2);
    }

    if (hastaVal === 'presente') selHasta.value = 'presente';
    btn.textContent = '✔';
}

function eliminarGen(modeloNombre, marca, index) {
    const marcaData = data.find(m => m.marca === marca);
    const modeloData = marcaData.modelos.find(mo => mo.nombre === modeloNombre);
    const conPdf = modeloData.generaciones.filter(g => g.pdf !== '#');
    const gen = conPdf[index];
    const posReal = modeloData.generaciones.indexOf(gen);

    modeloData.generaciones.splice(posReal, 1);
    actualizarCache();
    abrirModalVer(marca, modeloData);

    renderLista(document.getElementById('navSearch').value, filterSel.value);
}

// ─── MODAL CARGAR ────────────────────────────────────────────────────────────
let marcaActual = '';
let archivoSeleccionado = null;

function abrirModalCargar(marca) {
    marcaActual = marca;
    archivoSeleccionado = null;
    document.getElementById('cargarMarca').textContent = marca;
    document.getElementById('cargarGen').value = '';
    poblarSelectAnios('anioDesde', 'anioHasta');
    document.getElementById('cargarNota').value = '';
    document.getElementById('fileDropName').textContent = '';
    document.getElementById('fileDrop').classList.remove('has-file');
    document.getElementById('fileError').classList.remove('visible');
    document.getElementById('fileInput').value = '';

    // Poblar select de modelos
    const sel = document.getElementById('cargarModelo');
    sel.innerHTML = '';
    const marcaData = data.find(m => m.marca === marca);
    if (marcaData) {
        marcaData.modelos.forEach(mo => {
            const o = document.createElement('option');
            o.value = mo.nombre; o.textContent = mo.nombre;
            sel.appendChild(o);
        });
    }

    document.getElementById('modalCargar').classList.add('active');
    document.body.style.overflow = 'hidden';

    const otraOpcion = document.createElement('option');
    otraOpcion.value = '__nuevo__';
    otraOpcion.textContent = '+ Escribir nuevo modelo...';
    sel.appendChild(otraOpcion);

    document.getElementById('nuevoModeloWrap').style.display = 'none';
    document.getElementById('nuevoModeloInput').value = '';
}

function cerrarModalCargar() {
    document.getElementById('modalCargar').classList.remove('active');
    document.body.style.overflow = '';
}

document.getElementById('cargarModelo').addEventListener('change', function () {
    const wrap = document.getElementById('nuevoModeloWrap');
    wrap.style.display = this.value === '__nuevo__' ? 'block' : 'none';
});

document.getElementById('cargarClose').addEventListener('click', cerrarModalCargar);
document.getElementById('modalCargar').addEventListener('click', e => {
    if (e.target === document.getElementById('modalCargar')) cerrarModalCargar();
});

// File input
const fileDrop = document.getElementById('fileDrop');
const fileInput = document.getElementById('fileInput');

fileDrop.addEventListener('click', () => fileInput.click());
fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.style.borderColor = 'var(--navy)'; });
fileDrop.addEventListener('dragleave', () => { fileDrop.style.borderColor = ''; });
fileDrop.addEventListener('drop', e => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') setFile(file);
});
fileInput.addEventListener('change', e => {
    if (e.target.files[0]) setFile(e.target.files[0]);
});

function setFile(file) {
    archivoSeleccionado = file;
    document.getElementById('fileDropName').textContent = file.name;
    fileDrop.classList.add('has-file');
    document.getElementById('fileError').classList.remove('visible');
}

// Guardar
document.getElementById('btnGuardar').addEventListener('click', async () => {
    const genNombre = document.getElementById('cargarGen').value.trim();
    const años = `${document.getElementById('anioDesde').value}–${document.getElementById('anioHasta').value}`;
    const nota = document.getElementById('cargarNota').value.trim();

    if (!archivoSeleccionado) {
        document.getElementById('fileError').classList.add('visible');
        return;
    }

    const marcaData = data.find(m => m.marca === marcaActual);

    let modeloNombre = document.getElementById('cargarModelo').value;
    if (modeloNombre === '__nuevo__') {
        modeloNombre = document.getElementById('nuevoModeloInput').value.trim();
        if (!modeloNombre) return;
        if (!marcaData.modelos.find(mo => mo.nombre === modeloNombre)) {
            marcaData.modelos.push({ nombre: modeloNombre, generaciones: [] });
        }
    }
    const modeloData = marcaData.modelos.find(mo => mo.nombre === modeloNombre);

    const pdfKey = await guardarPDF(archivoSeleccionado);

    modeloData.generaciones.push({
        nombre: genNombre || 'Sin nombre',
        años: años || 'Sin especificar',
        pdf: pdfKey,
        nota: nota
    });

    actualizarCache();

    cerrarModalCargar();
    renderLista(document.getElementById('navSearch').value, filterSel.value);
});

// ─── DESCARGAR JSON ─────────────────────────────────────────────────────────
function descargarJSON() {

    const dataStr = JSON.stringify(data, null, 2);

    // Creamos un Blob con el contenido de texto
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);


    const a = document.createElement('a');
    a.href = url;
    a.download = "manuales_actualizados.json";
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Escuchador de evento para el botón (lo creamos en el HTML en el paso siguiente)
document.getElementById('btnDescargarJSON').addEventListener('click', descargarJSON);

// ─── ATAJOS ──────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { cerrarModalVer(); cerrarModalCargar(); }
});

let searchTimeout;
document.getElementById('navSearch').addEventListener('input', e => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => renderLista(e.target.value, filterSel.value), 200);
});
filterSel.addEventListener('change', () => {
    renderLista(document.getElementById('navSearch').value, filterSel.value);
});



cargarDatos();