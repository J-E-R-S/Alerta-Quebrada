/* ===== AlertaQuebrada · app.js ===== */

/* PASO 1: reglas de validación. */
const REGLA_CORREO = /^[^\s@]+@(coe\.org|gmail\.com|outlook\.com)$/i;
const REGLA_CLAVE = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

/* PASO 2: las cuentas se guardan en el navegador (localStorage). La cuenta demo siempre existe. */
function leerUsuarios() {
  const u = JSON.parse(localStorage.getItem('aq_usuarios')) || {};
  u['lucia.rojas@coe.org'] = u['lucia.rojas@coe.org'] || { nombre: 'Lucía Rojas', rol: 'COE', clave: 'Coe12345' };
  return u;
}

/* PASO 3: muestra (o borra) el mensaje de error de un campo. Devuelve true si hubo error. */
function error(idCampo, mensaje) {
  document.getElementById('error-' + idCampo).textContent = mensaje;
  document.getElementById(idCampo).classList.toggle('invalido', mensaje !== '');
  return mensaje !== '';
}

/* PASO 4: todo esto solo corre en la página que tiene el formulario de login. */
const formLogin = document.getElementById('form-login');
const formRegistro = document.getElementById('form-registro');

if (formLogin) {
  /* Pestañas: muestran un formulario y ocultan el otro. */
  function cambiarVista(vista) {
    formLogin.hidden = vista !== 'login';
    formRegistro.hidden = vista !== 'registro';
    document.getElementById('tab-login').setAttribute('aria-pressed', vista === 'login');
    document.getElementById('tab-registro').setAttribute('aria-pressed', vista === 'registro');
  }
  document.querySelectorAll('#tabs-acceso button').forEach(function (b) {
    b.addEventListener('click', function () { cambiarVista(b.dataset.vista); });
  });

  /* Iniciar sesión. */
  formLogin.addEventListener('submit', function (e) {
    e.preventDefault();                       // evita que la página se recargue
    const correo = document.getElementById('correo-login').value.trim().toLowerCase();
    const clave = document.getElementById('clave-login').value;
    let hayError = false;
    hayError = error('correo-login', !correo ? 'Escribe tu correo.' :
      !REGLA_CORREO.test(correo) ? 'Usa un correo de coe.org, gmail.com u outlook.com.' : '') || hayError;
    hayError = error('clave-login', !clave ? 'Escribe tu contraseña.' : '') || hayError;
    if (hayError) return;

    const usuario = leerUsuarios()[correo];
    if (!usuario || usuario.clave !== clave) {
      error('clave-login', 'Correo o contraseña incorrectos.');
      return;
    }
    const almacen = document.getElementById('mantener').checked ? localStorage : sessionStorage;
    almacen.setItem('aq_sesion', correo);
    location.hash = '#panel';   // queda posicionado en el panel
    location.reload();          // recarga para que el panel se arme con la sesión iniciada
  });

  /* Crear cuenta. */
  formRegistro.addEventListener('submit', function (e) {
    e.preventDefault();
    const nombre = document.getElementById('nombre-reg').value.trim();
    const correo = document.getElementById('correo-reg').value.trim().toLowerCase();
    const clave = document.getElementById('clave-reg').value;
    const clave2 = document.getElementById('clave2-reg').value;
    const usuarios = leerUsuarios();
    let hayError = false;
    hayError = error('nombre-reg', nombre.length < 3 ? 'Ingresa tu nombre completo (mínimo 3 letras).' : '') || hayError;
    hayError = error('correo-reg', !correo ? 'Escribe tu correo.' :
      !REGLA_CORREO.test(correo) ? 'Usa un correo de coe.org, gmail.com u outlook.com.' :
      usuarios[correo] ? 'Este correo ya está registrado. Inicia sesión.' : '') || hayError;
    hayError = error('clave-reg', !REGLA_CLAVE.test(clave) ? 'Mínimo 8 caracteres, con una mayúscula y un número.' : '') || hayError;
    hayError = error('clave2-reg', clave2 !== clave ? 'Las contraseñas no coinciden.' : '') || hayError;
    if (hayError) return;

    usuarios[correo] = { nombre: nombre, rol: document.getElementById('rol-reg').value, clave: clave };
    localStorage.setItem('aq_usuarios', JSON.stringify(usuarios));
    cambiarVista('login');
    document.getElementById('correo-login').value = correo;
    document.getElementById('clave-login').value = '';
  });
}

/* ===== Páginas del panel ===== */

/* PASO 5: si hay sesión se muestra el panel; si no, el login. */
const zonaPanel = document.getElementById('zona-panel');
if (zonaPanel) {
  const sesion = localStorage.getItem('aq_sesion') || sessionStorage.getItem('aq_sesion');
  const valida = sesion && leerUsuarios()[sesion];
  document.getElementById('zona-acceso').hidden = !!valida;
  zonaPanel.hidden = !valida;
    /* Con sesión, el título muestra quién ingresó. */
  if (valida) {
    document.getElementById('panel-titulo').textContent = valida.nombre + ' · ' + valida.rol;
  }

  /* Muestra una vista del panel y oculta las demás. */
  function mostrarVista(nombre) {
    document.querySelectorAll('.vista').forEach(function (v) { v.hidden = v.id !== 'vista-' + nombre; });
    document.querySelectorAll('#tabs-panel button[data-vista]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.vista === nombre);
    });
    document.dispatchEvent(new CustomEvent('vista', { detail: nombre }));   // avisa a las demás partes del código
  }
  document.querySelectorAll('#tabs-panel button[data-vista]').forEach(function (b) {
    b.addEventListener('click', function () { mostrarVista(b.dataset.vista); });
  });

  /* Cualquier botón con data-ir="mapa" lleva a esa vista (lo usaremos en Dashboard y Mapa). */
  document.addEventListener('click', function (e) {
    const t = e.target.closest('[data-ir]');
    if (t) { e.preventDefault(); mostrarVista(t.dataset.ir); zonaPanel.scrollIntoView(); }
  });

  mostrarVista('dashboard');
}

/* PASO 6: cerrar sesión borra la sesión y vuelve al inicio. */
const botonSalir = document.getElementById('cerrar-sesion');
if (botonSalir) {
  botonSalir.addEventListener('click', function () {
    localStorage.removeItem('aq_sesion');
    sessionStorage.removeItem('aq_sesion');
    location.hash = '#inicio';
    location.reload();
  });
}

/* PASO 7: compartir la alerta por WhatsApp (HU-019). */
const botonWhatsapp = document.getElementById('btn-whatsapp');
if (botonWhatsapp) {
  botonWhatsapp.addEventListener('click', function () {
    const texto = 'ALERTA: riesgo alto en Quebrada Norte. Evacúa por Calle Central hacia Escuela Norte.';
    window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
  });
}

/* PASO 8: confirmar recepción de una alerta (HU-027). */
document.querySelectorAll('[data-recibir]').forEach(function (b) {
  b.addEventListener('click', function () {
    b.outerHTML = '<span class="estado ok">Recibida</span>';
  });
});

/* PASO 9: abrir y cerrar la alerta a pantalla completa (HU-033). */
const alertaTotal = document.getElementById('alerta-total');
const botonAlerta = document.getElementById('btn-alerta');
if (alertaTotal && botonAlerta) {
  /* NUEVO: al cambiar de pestaña, la alerta se cierra (si no, quedaría abierta al volver). */
  document.addEventListener('vista', function () { alertaTotal.hidden = true; });

  botonAlerta.addEventListener('click', function () {
    alertaTotal.hidden = false;                          // la muestra
    document.getElementById('alerta-cerrar').focus();    // lleva el teclado al botón Cerrar
  });
  document.getElementById('alerta-cerrar').addEventListener('click', function () {
    alertaTotal.hidden = true;                           // la oculta
    botonAlerta.focus();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { alertaTotal.hidden = true; }   // Esc también la cierra
  });
}

/* ===== Datos compartidos (mapa, evacuación y dashboard usarán los mismos) ===== */
/* PASO 10: cada manzana es una lista de hogares. 0 = pendiente, 1 = en ruta, 2 = a salvo. */
const MANZANAS_BASE = {
  'A-01': [2,2,2,2,2,2], 'A-02': [2,2,2], 'A-03': [2,2,2,2,2,1,0],
  'A-04': [2,2,2,2], 'A-05': [2,2,1,1,2], 'A-06': [2,2,2]
};
function leerManzanas() { return JSON.parse(localStorage.getItem('aq_manzanas')) || MANZANAS_BASE; }
/* PASO 11: el estado de una manzana se calcula a partir de sus hogares. */
function estadoManzana(hogares) { return hogares.includes(0) ? 'r' : hogares.includes(1) ? 'a' : 'v'; }
const ETIQUETA = { r: 'Riesgo alto', a: 'En proceso', v: 'Evacuada' };
const MENSAJE = { r: 'EVACÚA ahora por Calle Central hacia Escuela Norte', a: 'Salida en curso: confirma los hogares pendientes', v: 'Manzana segura: no requiere acciones' };
const BRIGADAS = { 'B-02': { nombre: 'Marcos Silva', zona: 'A-03' }, 'B-03': { nombre: 'Rosa Díaz', zona: 'A-05' } };

/* ===== Mapa operativo ===== */
const contMapa = document.getElementById('mapa');
if (contMapa) {
  let pestana = 'zonas';
  let elegida = localStorage.getItem('aq_manzana_sel') || 'A-03';

  function brigadasDe(id) {
    return Object.keys(BRIGADAS).filter(function (b) { return BRIGADAS[b].zona === id; });
  }

  /* PASO 12: dibuja las manzanas y el panel lateral cada vez que algo cambia. */
  function dibujar() {
    const datos = leerManzanas();
    contMapa.innerHTML = '';
    Object.keys(datos).forEach(function (id) {
      const est = estadoManzana(datos[id]);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mz ' + est + (id === elegida ? ' elegida' : '');
      b.setAttribute('aria-pressed', id === elegida);
      const texto = pestana === 'zonas' ? datos[id].length + ' hogares'
                  : pestana === 'riesgos' ? ETIQUETA[est]
                  : brigadasDe(id).length ? 'Brigada ' + brigadasDe(id).join(', ') : 'Sin brigada';
      b.innerHTML = '<strong>' + id + '</strong><span>' + texto + '</span>';
      b.addEventListener('click', function () { elegida = id; localStorage.setItem('aq_manzana_sel', id); dibujar(); });
      contMapa.appendChild(b);
    });

    const hogares = datos[elegida];
    const est = estadoManzana(hogares);
    const pendientes = hogares.filter(function (h) { return h < 2; }).length;
    document.getElementById('p-titulo').textContent = 'Manzana ' + elegida;
    document.getElementById('p-estado').textContent = ETIQUETA[est];
    document.getElementById('p-estado').className = 'estado ' + (est === 'v' ? 'ok' : est === 'a' ? 'aviso' : 'peligro');
    document.getElementById('p-resumen').textContent = hogares.length + ' hogares · ' + pendientes + ' pendientes';
    document.getElementById('p-mensaje').textContent = MENSAJE[est];
    document.getElementById('p-mensaje').className = 'mensaje ' + est;
    document.getElementById('p-semaforo').textContent = ETIQUETA[est];
    document.getElementById('p-brigadas').textContent = brigadasDe(elegida).map(function (b) { return b + ' ' + BRIGADAS[b].nombre; }).join(', ') || 'ninguna';
  }

  /* PASO 13: las pestañas Zonas / Riesgos / Brigadas. */
  document.querySelectorAll('#pestanas-mapa button').forEach(function (b) {
    b.addEventListener('click', function () {
      pestana = b.dataset.pestana;
      document.querySelectorAll('#pestanas-mapa button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      dibujar();
    });
  });

  /* PASO 14: al ir a Evacuación, recordamos qué manzana estaba elegida. */
  document.getElementById('ver-evacuacion').addEventListener('click', function () { localStorage.setItem('aq_manzana_sel', elegida); });

  /* PASO 15: guardar la ruta para verla sin internet (HU-016). */
  const botonOffline = document.getElementById('btn-offline');
  function pintarOffline() {
    botonOffline.textContent = localStorage.getItem('aq_ruta_offline') ? 'Ruta guardada sin conexión ✓ (quitar)' : 'Guardar ruta sin conexión';
  }
  botonOffline.addEventListener('click', function () {
    if (localStorage.getItem('aq_ruta_offline')) { localStorage.removeItem('aq_ruta_offline'); }
    else { localStorage.setItem('aq_ruta_offline', JSON.stringify({ ruta: 'Calle Central', punto: 'Escuela Norte' })); }
    pintarOffline();
  });
  pintarOffline();
  dibujar();

  /* NUEVO: cada vez que se entra a la pestaña Mapa, se vuelve a dibujar con los datos actuales. */
  document.addEventListener('vista', function (e) {
    if (e.detail === 'mapa') {
      elegida = localStorage.getItem('aq_manzana_sel') || elegida;
      dibujar();
    }
  });
}

/* ===== Evacuación ===== */
const listaEv = document.getElementById('ev-lista');
if (listaEv) {
  /* PASO 16: hogares que necesitan apoyo (HU-043 y HU-021). Clave = posición del hogar en la manzana. */
  const APOYOS = {
    'A-03': { 5: 'Laura Méndez · movilidad reducida', 6: 'José Rojas · requiere transporte' },
    'A-05': { 2: 'Ana Cárdenas · 2 menores' }
  };
  const ESTADOS_HOGAR = ['Pendiente', 'En ruta (comparte ubicación)', 'A salvo en punto seguro'];
  let manzana = localStorage.getItem('aq_manzana_sel') || 'A-03';
  const msg = document.getElementById('ev-mensaje');

  /* PASO 17: dibuja pestañas, resumen y hogares. */
  function dibujarEv(foco) {
    const datos = leerManzanas();
    if (!datos[manzana]) { manzana = Object.keys(datos)[0]; }
    const hogares = datos[manzana];
    const apoyos = APOYOS[manzana] || {};

    const tabs = document.getElementById('ev-tabs');
    tabs.innerHTML = '';
    Object.keys(datos).forEach(function (id) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = id;
      b.setAttribute('aria-pressed', id === manzana);
      b.addEventListener('click', function () { manzana = id; msg.textContent = ''; localStorage.setItem('aq_manzana_sel', id); dibujarEv(); });
      tabs.appendChild(b);
    });

    document.getElementById('k-hogares').textContent = hogares.length;
    document.getElementById('k-salvo').textContent = hogares.filter(function (h) { return h === 2; }).length + '/' + hogares.length;
    document.getElementById('k-ruta').textContent = hogares.filter(function (h) { return h === 1; }).length;
    document.getElementById('k-apoyo').textContent = Object.keys(apoyos).length;
    document.getElementById('ev-titulo').textContent = 'Hogares de ' + manzana;

    listaEv.innerHTML = '';
    hogares.forEach(function (estado, i) {
      const fila = document.createElement('div');
      fila.className = 'hogar';
      const etiqueta = 'Hogar ' + manzana + '-' + (i + 1);
      fila.innerHTML = '<span><strong>' + etiqueta + '</strong>' +
        (apoyos[i] ? '<br><span class="apoyo">' + apoyos[i] + '</span>' : '') + '</span>';
      const sel = document.createElement('select');
      sel.setAttribute('aria-label', 'Estado de ' + etiqueta);
      ESTADOS_HOGAR.forEach(function (t, v) {
        const o = document.createElement('option');
        o.value = v; o.textContent = t; o.selected = v === estado;
        sel.appendChild(o);
      });
      /* PASO 18: al cambiar un hogar se guarda; el mapa leerá este mismo dato. */
      sel.addEventListener('change', function () {
        datos[manzana][i] = Number(sel.value);
        localStorage.setItem('aq_manzanas', JSON.stringify(datos));
        msg.textContent = '';
        dibujarEv(i);
      });
      fila.appendChild(sel);
      listaEv.appendChild(fila);
    });
    if (foco !== undefined) { listaEv.querySelectorAll('select')[foco].focus(); }
  }

  /* PASO 19: confirmar la evacuación solo si ya no quedan hogares pendientes (HU-022). */
  document.getElementById('ev-confirmar').addEventListener('click', function () {
    const faltan = leerManzanas()[manzana].filter(function (h) { return h < 2; }).length;
    msg.className = 'mensaje-ev ' + (faltan ? 'mal' : 'bien');
    msg.textContent = faltan ? 'Faltan ' + faltan + ' hogares por confirmar.' : 'Evacuación de ' + manzana + ' confirmada.';
  });

  /* PASO 20: volver a los datos de ejemplo (útil antes de exponer). */
  document.getElementById('ev-reset').addEventListener('click', function () {
    localStorage.removeItem('aq_manzanas');
    msg.textContent = 'Datos de ejemplo restablecidos.';
    msg.className = 'mensaje-ev bien';
    dibujarEv();
  });

  document.addEventListener('vista', function (e) {
    if (e.detail === 'evacuacion') {
      manzana = localStorage.getItem('aq_manzana_sel') || manzana;
      msg.textContent = '';
      dibujarEv();
    }
  });

  dibujarEv();
}


/* ===== Solicitudes de apoyo ===== */
const listaSol = document.getElementById('sol-lista');
if (listaSol) {
  /* PASO 22: datos de ejemplo. Se guardan en el navegador para que no se pierdan al recargar. */
  const SOL_BASE = [
    { id: 'SOL-014', hogar: 'H-014 · A-03', tipo: 'Movilidad reducida', prio: 'Alta', brig: '' },
    { id: 'SOL-015', hogar: 'H-015 · A-03', tipo: 'Requiere transporte', prio: 'Alta', brig: '' },
    { id: 'SOL-027', hogar: 'H-027 · A-05', tipo: 'Menores a cargo', prio: 'Alta', brig: '' },
    { id: 'SOL-028', hogar: 'H-028 · A-05', tipo: 'Adulto mayor', prio: 'Normal', brig: '' }
  ];
  function leerSol() { return JSON.parse(localStorage.getItem('aq_solicitudes')) || JSON.parse(JSON.stringify(SOL_BASE)); }
  function guardarSol(s) { localStorage.setItem('aq_solicitudes', JSON.stringify(s)); }
  function leerDisp() { return JSON.parse(localStorage.getItem('aq_disp')) || { 'B-02': true, 'B-03': true }; }
  let elegidaSol = 'SOL-014';
  const msgSol = document.getElementById('sol-msg');

  /* PASO 23: dibuja la bandeja, el detalle y la disponibilidad. */
  function dibujarSol() {
    const sols = leerSol(), disp = leerDisp();
    if (!sols.some(function (s) { return s.id === elegidaSol; })) { elegidaSol = sols[0].id; }
    const actual = sols.find(function (s) { return s.id === elegidaSol; });
    const pendientes = sols.filter(function (s) { return !s.brig; }).length;

    document.getElementById('sol-h').textContent = 'Solicitudes recibidas · ' + pendientes + ' pendientes';
    listaSol.innerHTML = '';
    sols.forEach(function (s) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'sol-item' + (s.id === elegidaSol ? ' elegida' : '');
      b.innerHTML = '<span><strong>' + s.id + '</strong> · ' + s.hogar + '<br><small>' + s.tipo + '</small></span>' +
        '<span><span class="estado ' + (s.prio === 'Alta' ? 'peligro' : 'aviso') + '">' + s.prio + '</span> ' +
        '<span class="estado ' + (s.brig ? 'ok' : 'aviso') + '">' + (s.brig ? 'Asignada ' + s.brig : 'Pendiente') + '</span></span>';
      b.addEventListener('click', function () { elegidaSol = s.id; msgSol.textContent = ''; dibujarSol(); });
      listaSol.appendChild(b);
    });

    document.getElementById('sol-titulo').textContent = actual.id + ' · ' + actual.hogar;
    document.getElementById('sol-tipo-det').textContent = actual.tipo + ' · prioridad ' + actual.prio;
    const libres = Object.keys(BRIGADAS).filter(function (b) { return disp[b]; });
    const sel = document.getElementById('sol-brig');
    sel.innerHTML = libres.length ? libres.map(function (b) { return '<option value="' + b + '">' + b + ' · ' + BRIGADAS[b].nombre + '</option>'; }).join('')
                                  : '<option value="">No hay brigadas disponibles</option>';
    document.getElementById('sol-asignar').disabled = !libres.length;
    document.getElementById('sol-asignar').textContent = actual.brig ? 'Reasignar brigada' : 'Asignar brigada';

    const cont = document.getElementById('sol-disp');
    cont.innerHTML = '';
    Object.keys(BRIGADAS).forEach(function (b) {
      const l = document.createElement('label');
      l.className = 'disp';
      l.innerHTML = '<span>' + b + ' · ' + BRIGADAS[b].nombre + '</span>';
      const c = document.createElement('input');
      c.type = 'checkbox'; c.checked = !!disp[b];
      c.setAttribute('aria-label', 'Disponibilidad de ' + b);
      c.addEventListener('change', function () {
        disp[b] = c.checked;
        localStorage.setItem('aq_disp', JSON.stringify(disp));
        dibujarSol();
      });
      l.appendChild(c);
      cont.appendChild(l);
    });
  }

  /* PASO 24: asignar una brigada y enviarle la tarea (HU-044 y HU-031). */
  document.getElementById('sol-asignar').addEventListener('click', function () {
    const b = document.getElementById('sol-brig').value;
    if (!b) { return; }
    const sols = leerSol();
    const s = sols.find(function (x) { return x.id === elegidaSol; });
    s.brig = b;
    guardarSol(sols);
    msgSol.className = 'mensaje-ev bien';
    msgSol.textContent = 'Tarea enviada a ' + b + ' · ' + BRIGADAS[b].nombre + ': atender ' + s.id + ' (' + s.hogar + ').';
    dibujarSol();
  });

  /* PASO 25: registrar una solicitud nueva con validación (HU-007 y HU-020). */
  document.getElementById('sol-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const quien = document.getElementById('sol-quien').value.trim();
    if (error('sol-quien', quien.length < 3 ? 'Escribe a quién se debe apoyar (mínimo 3 letras).' : '')) { return; }
    const sols = leerSol();
    const id = 'SOL-0' + (30 + sols.length);
    sols.push({ id: id, hogar: quien + ' · ' + document.getElementById('sol-manz').value, tipo: document.getElementById('sol-tipo').value, prio: document.getElementById('sol-prio').value, brig: '' });
    guardarSol(sols);
    elegidaSol = id;
    document.getElementById('sol-quien').value = '';
    msgSol.className = 'mensaje-ev bien';
    msgSol.textContent = 'Solicitud ' + id + ' registrada.';
    dibujarSol();
  });

  /* PASO 26: volver a los datos de ejemplo. */
  document.getElementById('sol-reset').addEventListener('click', function () {
    localStorage.removeItem('aq_solicitudes');
    localStorage.removeItem('aq_disp');
    msgSol.className = 'mensaje-ev bien';
    msgSol.textContent = 'Datos de ejemplo restablecidos.';
    dibujarSol();
  });

  dibujarSol();
}
/* ===== Reportes e incidencias ===== */
const listaInc = document.getElementById('inc-lista');
if (listaInc) {
  /* PASO 27: datos de ejemplo, guardados en el navegador. */
  const INC_BASE = [
    { id: 'INC-021', tipo: 'Vía bloqueada', ubic: 'Paso Norte · A-03', desc: 'Huaico cubre la vía', estado: 'Verificado' },
    { id: 'INC-022', tipo: 'Vía bloqueada', ubic: 'Calle Sur · A-05', desc: 'Árbol caído en la pista', estado: 'Pendiente' },
    { id: 'INC-020', tipo: 'Zona peligrosa', ubic: 'Ribera · A-04', desc: 'Orilla inestable', estado: 'Verificado' },
    { id: 'INC-019', tipo: 'Zona peligrosa', ubic: 'Ladera · A-06', desc: 'Piedras sueltas', estado: 'Pendiente' }
  ];
  function leerInc() { return JSON.parse(localStorage.getItem('aq_incidencias')) || JSON.parse(JSON.stringify(INC_BASE)); }
  function guardarInc(x) { localStorage.setItem('aq_incidencias', JSON.stringify(x)); }
  let filtro = 'todos';
  const msgInc = document.getElementById('inc-msg');

  /* PASO 28: dibuja la lista según el filtro elegido. */
  function dibujarInc() {
    const todos = leerInc();
    const porValidar = todos.filter(function (r) { return r.estado === 'Pendiente'; }).length;
    document.getElementById('inc-h').textContent = 'Reportes recibidos · ' + porValidar + ' por validar';
    listaInc.innerHTML = '';
    todos.filter(function (r) { return filtro === 'todos' || r.estado === filtro; }).forEach(function (r) {
      const fila = document.createElement('div');
      fila.className = 'hogar';
      const info = document.createElement('span');
      const t = document.createElement('strong');
      t.textContent = r.id + ' · ' + r.tipo;
      const s = document.createElement('small');
      s.textContent = r.ubic + ' — ' + r.desc;      // textContent: lo escrito se muestra como texto, no como código
      info.append(t, document.createElement('br'), s);
      fila.appendChild(info);
      if (r.estado === 'Pendiente') {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'boton chico'; b.textContent = 'Validar';
        b.addEventListener('click', function () {
          r.estado = 'Verificado';
          guardarInc(todos);
          msgInc.className = 'mensaje-ev bien';
          msgInc.textContent = r.id + ' validado.';
          dibujarInc();
        });
        fila.appendChild(b);
      } else {
        const ok = document.createElement('span');
        ok.className = 'estado ok'; ok.textContent = 'Verificado';
        fila.appendChild(ok);
      }
      listaInc.appendChild(fila);
    });
    if (!listaInc.children.length) { listaInc.innerHTML = '<p class="nota">No hay reportes en esta categoría.</p>'; }
  }

  /* PASO 29: los filtros Todos / Pendientes / Verificados. */
  document.querySelectorAll('#inc-filtros button').forEach(function (b) {
    b.addEventListener('click', function () {
      filtro = b.dataset.filtro;
      document.querySelectorAll('#inc-filtros button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      dibujarInc();
    });
  });

  /* PASO 30: registrar un reporte nuevo (HU-023 y HU-028). */
  document.getElementById('inc-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const desc = document.getElementById('inc-desc').value.trim();
    if (error('inc-desc', desc.length < 8 ? 'Describe el problema en al menos 8 caracteres.' : '')) { return; }
    const todos = leerInc();
    const tipo = document.getElementById('inc-tipo').value;
    const id = 'INC-0' + (30 + todos.length);
    todos.unshift({ id: id, tipo: tipo, ubic: 'Manzana ' + document.getElementById('inc-manz').value, desc: desc, estado: 'Pendiente' });
    guardarInc(todos);
    document.getElementById('inc-desc').value = '';
    msgInc.className = 'mensaje-ev bien';
    msgInc.textContent = 'Reporte ' + id + ' enviado para validación.' + (tipo === 'Vía bloqueada' ? ' Ruta alterna sugerida: Calle Sur hacia Escuela Norte.' : '');
    dibujarInc();
  });

  /* PASO 31: volver a los datos de ejemplo. */
  document.getElementById('inc-reset').addEventListener('click', function () {
    localStorage.removeItem('aq_incidencias');
    msgInc.className = 'mensaje-ev bien';
    msgInc.textContent = 'Datos de ejemplo restablecidos.';
    dibujarInc();
  });

  dibujarInc();
}

/* ===== Administración ===== */
const contAdm = document.getElementById('adm-contenido');
if (contAdm) {
  /* PASO 32: solo el rol COE puede ver esta página. */
  const correoSesion = localStorage.getItem('aq_sesion') || sessionStorage.getItem('aq_sesion');
  const quien = leerUsuarios()[correoSesion];
  if (!quien || quien.rol !== 'COE') {
    contAdm.hidden = true;
    document.getElementById('adm-bloqueo').hidden = false;
  } else {
    /* PASO 33: líderes por zona (HU-048) y parámetros guardados en el navegador. */
    const LIDERES = [
      { zona: 'Norte · Sector A', nombre: 'Ana Pérez', tel: '987654321' },
      { zona: 'Ribera · Sector B', nombre: 'Mario León', tel: '986543210' },
      { zona: 'Ladera · Sector C', nombre: 'Sara Cruz', tel: '985432109' }
    ];
    const CFG_BASE = { sms: true, auto: true, tel: '987654321' };
    function leerCfg() { return JSON.parse(localStorage.getItem('aq_config')) || CFG_BASE; }
    const msgAdm = document.getElementById('adm-msg');

    /* Usuarios: salen de las cuentas creadas en el login (por eso aquí aparecen las que registres). */
    const contUs = document.getElementById('adm-usuarios');
    const usuarios = leerUsuarios();
    Object.keys(usuarios).forEach(function (correo) {
      const fila = document.createElement('div');
      fila.className = 'hogar';
      const n = document.createElement('span');
      n.textContent = usuarios[correo].nombre + ' · ' + correo;    // textContent: se muestra como texto
      const r = document.createElement('span');
      r.className = 'estado ok'; r.textContent = usuarios[correo].rol;
      fila.append(n, r);
      contUs.appendChild(fila);
    });

    /* Líderes con enlace para llamar. */
    const contLi = document.getElementById('adm-lideres');
    LIDERES.forEach(function (l) {
      const fila = document.createElement('div');
      fila.className = 'hogar';
      const z = document.createElement('span');
      z.innerHTML = '<strong></strong><br><small></small>';
      z.querySelector('strong').textContent = l.zona;
      z.querySelector('small').textContent = 'Líder: ' + l.nombre;
      const a = document.createElement('a');
      a.href = 'tel:+51' + l.tel; a.textContent = 'Llamar · ' + l.tel;
      fila.append(z, a);
      contLi.appendChild(fila);
    });

    /* PASO 34: cargar los parámetros guardados. */
    function pintarCfg() {
      const c = leerCfg();
      document.getElementById('cfg-sms').checked = c.sms;
      document.getElementById('cfg-auto').checked = c.auto;
      document.getElementById('cfg-tel').value = c.tel;
    }

    /* PASO 35: guardar con validación del contacto (HU-004 y HU-025). */
    document.getElementById('adm-form').addEventListener('submit', function (e) {
      e.preventDefault();
      const tel = document.getElementById('cfg-tel').value.trim();
      if (error('cfg-tel', !/^9\d{8}$/.test(tel) ? 'Ingresa un celular de 9 dígitos que empiece con 9.' : '')) { return; }
      const c = { sms: document.getElementById('cfg-sms').checked, auto: document.getElementById('cfg-auto').checked, tel: tel };
      localStorage.setItem('aq_config', JSON.stringify(c));
      msgAdm.className = 'mensaje-ev bien';
      msgAdm.textContent = 'Cambios guardados.' + (c.sms ? ' Si no hay internet, la alerta se enviará por SMS.' : ' El SMS de contingencia está desactivado.');
    });

    document.getElementById('adm-reset').addEventListener('click', function () {
      localStorage.removeItem('aq_config');
      pintarCfg();
      error('cfg-tel', '');
      msgAdm.className = 'mensaje-ev bien';
      msgAdm.textContent = 'Datos de ejemplo restablecidos.';
    });

    pintarCfg();
  }
}