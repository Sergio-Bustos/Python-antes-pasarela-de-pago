// ========== ESTADO ==========
let notaGuardada = false;
let urlDestino   = null;

// ========== TEMA ==========
(function aplicarTema() {
    const match = document.cookie.split(';').find(c => c.trim().startsWith('tema='));
    if (!match) return;
    const valor   = match.split('=')[1]?.trim();
    const esOscuro = valor === 'Negro';
    document.body.classList.toggle('tema-oscuro', esOscuro);
    document.body.classList.toggle('tema-claro',  !esOscuro);
})();

window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
        const match = document.cookie.split(';').find(c => c.trim().startsWith('tema='));
        if (!match) return;
        const esOscuro = match.split('=')[1]?.trim() === 'Negro';
        document.body.classList.toggle('tema-oscuro', esOscuro);
        document.body.classList.toggle('tema-claro',  !esOscuro);
    }
});

// ========== TOOLBAR ==========
function fmt(comando, e) {
    if (e) e.preventDefault();
    document.execCommand(comando, false, null);
    document.getElementById('cuerpo-nota').focus();
}

function cambiarTamano(valor) {
    if (!valor) return;
    document.execCommand('fontSize', false, valor);
    document.getElementById('cuerpo-nota').focus();
}

function cambiarColor(color) {
    document.execCommand('foreColor', false, color);
    const visual = document.getElementById('colorMuestra');
    if (visual) visual.style.backgroundColor = color;
    document.getElementById('cuerpo-nota').focus();
}

// ========== GUARDAR NOTA ==========
async function guardarNota() {
    const titulo      = document.getElementById('inputTitulo').value.trim();
    const descripcion = document.getElementById('inputDescripcion').value.trim();
    const etiquetas   = document.getElementById('inputEtiquetas').value.trim();
    const contenido   = document.getElementById('cuerpo-nota').innerHTML;
    const textoPlano  = document.getElementById('cuerpo-nota').innerText.trim();

    if (!titulo) {
        mostrarToast('⚠️ Escribe un título para la nota', 'error');
        document.getElementById('inputTitulo').focus();
        return;
    }
    if (!textoPlano) {
        mostrarToast('⚠️ La nota está vacía', 'error');
        document.getElementById('cuerpo-nota').focus();
        return;
    }

    const formData = new FormData();
    formData.append('titulo',      titulo);
    formData.append('descripcion', descripcion || `Nota de texto: ${titulo}`);
    formData.append('contenido',   contenido);
    formData.append('etiquetas',   etiquetas);

    try {
        const res = await fetch('/guardar-nota-texto', {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.success) {
            notaGuardada = true;
            mostrarToast('✅ Nota guardada correctamente', 'success');
            setTimeout(() => {
                window.location.href = data.redirect || '/notas';
            }, 1200);
        } else {
            mostrarToast('❌ ' + (data.error || 'Error al guardar'), 'error');
        }
    } catch (err) {
        console.error(err);
        mostrarToast('❌ Error de conexión al servidor', 'error');
    }
}

// ========== BOTÓN VOLVER ==========
document.getElementById('btnVolver').addEventListener('click', function (e) {
    e.preventDefault();
    const textoPlano = document.getElementById('cuerpo-nota').innerText.trim();
    if (textoPlano && !notaGuardada) {
        urlDestino = '/notas';
        document.getElementById('modalSalida').classList.add('visible');
    } else {
        window.location.href = '/notas';
    }
});

// ========== ADVERTENCIA AL CERRAR PESTAÑA ==========
window.addEventListener('beforeunload', function (e) {
    const textoPlano = document.getElementById('cuerpo-nota').innerText.trim();
    if (textoPlano && !notaGuardada) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// ========== MODAL SALIDA ==========
function cerrarModal() {
    document.getElementById('modalSalida').classList.remove('visible');
    urlDestino = null;
}

function confirmarSalida() {
    document.getElementById('modalSalida').classList.remove('visible');
    window.location.href = urlDestino || '/notas';
}

// ========== TOAST ==========
function mostrarToast(mensaje, tipo = '') {
    const t = document.getElementById('toast');
    t.textContent = mensaje;
    t.className   = 'toast ' + tipo;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}