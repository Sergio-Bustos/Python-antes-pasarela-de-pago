/* =====================================================================
   PAPELERA.JS — NoteFlow
   ===================================================================== */

/* ─────────────────────────────────────
   1. TEMA (claro / oscuro)
───────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
    const color = window.COLOR_PRINCIPAL || 'Blanco';
    aplicarTema(color);
    document.cookie = `tema=${color};path=/;max-age=31536000`;
});

window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        const match = document.cookie.split(';').find(c => c.trim().startsWith('tema='));
        if (!match) return;
        const valor = match.split('=')[1]?.trim();
        aplicarTema(valor);
    }
});

function aplicarTema(color) {
    const esOscuro = color === 'Negro';
    document.body.classList.toggle('tema-oscuro', esOscuro);
    document.body.classList.toggle('tema-claro', !esOscuro);
}


/* ─────────────────────────────────────
   2. TOASTS
───────────────────────────────────── */
function mostrarToast(mensaje, tipo = 'info') {
    const container = document.getElementById('toast-container');
    const colores = {
        success: 'bg-success',
        error: 'bg-danger',
        warning: 'bg-warning text-dark',
        info: 'bg-info text-dark'
    };
    const iconos = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };

    const el = document.createElement('div');
    el.className = `toast align-items-center text-white ${colores[tipo]} border-0`;
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-atomic', 'true');
    el.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas ${iconos[tipo]} me-2"></i>${mensaje}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto"
                    data-bs-dismiss="toast"></button>
        </div>`;
    container.appendChild(el);
    const toast = new bootstrap.Toast(el, { autohide: true, delay: 4000 });
    toast.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
}


/* ─────────────────────────────────────
   3. RESTAURAR NOTA
───────────────────────────────────── */
function confirmarRestaurar(btn) {
    const id = btn.dataset.id;
    const titulo = btn.dataset.titulo;

    document.getElementById('modal-restaurar-titulo').textContent = `"${titulo}"`;

    const modal = new bootstrap.Modal(document.getElementById('modalRestaurar'));
    modal.show();

    const btnConfirmar = document.getElementById('btn-confirmar-restaurar');
    const nuevoBtn = btnConfirmar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(nuevoBtn, btnConfirmar);

    nuevoBtn.addEventListener('click', async function () {
        modal.hide();
        await ejecutarAccion(`/papelera/restaurar/${id}`, id, 'restaurar');
    });
}


/* ─────────────────────────────────────
   4. ELIMINAR DEFINITIVAMENTE
───────────────────────────────────── */
function confirmarEliminar(btn) {
    const id = btn.dataset.id;
    const titulo = btn.dataset.titulo;

    document.getElementById('modal-eliminar-titulo').textContent = `"${titulo}"`;

    const modal = new bootstrap.Modal(document.getElementById('modalEliminar'));
    modal.show();

    const btnConfirmar = document.getElementById('btn-confirmar-eliminar');
    const nuevoBtn = btnConfirmar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(nuevoBtn, btnConfirmar);

    nuevoBtn.addEventListener('click', async function () {
        modal.hide();
        await ejecutarAccion(`/papelera/eliminar/${id}`, id, 'eliminar');
    });
}


/* ─────────────────────────────────────
   5. VACIAR PAPELERA
───────────────────────────────────── */
function confirmarVaciarTodo() {
    const modal = new bootstrap.Modal(document.getElementById('modalVaciar'));
    modal.show();
}

async function vaciarPapelera() {
    const modalEl = document.getElementById('modalVaciar');
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) modalInstance.hide();

    const btnVaciar = document.getElementById('btn-vaciar-todo');
    if (btnVaciar) {
        btnVaciar.disabled = true;
        btnVaciar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Vaciando...';
    }

    try {
        const resp = await fetch('/papelera/vaciar', { method: 'POST' });
        const data = await resp.json();

        if (data.success) {
            // Animar eliminación de todas las tarjetas
            const tarjetas = document.querySelectorAll('.nota-papelera');
            tarjetas.forEach((el, i) => {
                el.style.transition = `opacity 0.3s ${i * 40}ms, transform 0.3s ${i * 40}ms`;
                el.style.opacity = '0';
                el.style.transform = 'translateX(30px)';
            });
            const tiempoTotal = tarjetas.length * 40 + 360;
            setTimeout(() => {
                tarjetas.forEach(el => el.remove());
                actualizarBadge(0);
                mostrarVacia();
            }, tiempoTotal);
            mostrarToast('Papelera vaciada correctamente', 'success');
        } else {
            mostrarToast(data.error || 'Error al vaciar la papelera', 'error');
            if (btnVaciar) {
                btnVaciar.disabled = false;
                btnVaciar.innerHTML = '<i class="fas fa-bomb"></i> Vaciar papelera';
            }
        }
    } catch (e) {
        console.error(e);
        mostrarToast('Error de conexión al vaciar la papelera', 'error');
        if (btnVaciar) {
            btnVaciar.disabled = false;
            btnVaciar.innerHTML = '<i class="fas fa-bomb"></i> Vaciar papelera';
        }
    }
}


/* ─────────────────────────────────────
   6. ACCIÓN GENÉRICA (restaurar / eliminar)
───────────────────────────────────── */
async function ejecutarAccion(url, id, tipo) {
    try {
        const resp = await fetch(url, { method: 'POST' });
        const data = await resp.json();

        if (data.success) {
            const card = document.getElementById(`nota-${id}`);
            if (card) {
                card.style.transition = 'opacity 0.35s, transform 0.35s';
                card.style.opacity = '0';
                card.style.transform = tipo === 'restaurar'
                    ? 'translateX(-30px)'
                    : 'translateX(30px)';
                setTimeout(() => {
                    card.remove();
                    actualizarContador();
                }, 360);
            }
            const msg = tipo === 'restaurar'
                ? 'Nota restaurada correctamente'
                : 'Nota eliminada definitivamente';
            mostrarToast(msg, 'success');
        } else {
            mostrarToast(data.error || 'Error al procesar la acción', 'error');
        }
    } catch (e) {
        console.error(e);
        mostrarToast('Error de conexión', 'error');
    }
}


/* ─────────────────────────────────────
   7. CONTADOR Y ESTADO VACÍO
───────────────────────────────────── */
function actualizarContador() {
    const total = document.querySelectorAll('.nota-papelera').length;
    actualizarBadge(total);
    if (total === 0) mostrarVacia();
}

function actualizarBadge(total) {
    const badge = document.getElementById('badge-total');
    if (badge) badge.textContent = total;

    const btnVaciar = document.getElementById('btn-vaciar-todo');
    if (btnVaciar) {
        btnVaciar.style.display = total === 0 ? 'none' : '';
        btnVaciar.disabled = false;
        btnVaciar.innerHTML = '<i class="fas fa-bomb"></i> Vaciar papelera';
    }
}

function mostrarVacia() {
    const lista = document.getElementById('lista-papelera');
    if (lista && !lista.querySelector('.papelera-vacia')) {
        lista.innerHTML = `
            <div class="papelera-vacia" style="animation: fadeInUp 0.4s ease;">
                <i class="fas fa-trash-alt"></i>
                <p>La papelera está vacía. ¡Todo en orden!</p>
            </div>`;
    }
}


/* ─────────────────────────────────────
   8. MODAL FORMATO (crear nota)
───────────────────────────────────── */
function abrirFormato() {
    document.getElementById('formato-modal').classList.add('visible');
    document.getElementById('formato-backdrop').classList.add('visible');
}

function cerrarFormato() {
    document.getElementById('formato-modal').classList.remove('visible');
    document.getElementById('formato-backdrop').classList.remove('visible');
}

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarFormato();
});