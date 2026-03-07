// ========== UTILIDAD DE TEMA ==========
function aplicarTemaDesdeServidor() {
    // Lee el valor renderizado por Jinja (fuente de verdad principal)
    const colorPrincipal = window.COLOR_PRINCIPAL || 'Blanco';
    const esOscuro = colorPrincipal === 'Negro';
    document.body.classList.toggle('tema-oscuro', esOscuro);
    document.body.classList.toggle('tema-claro',  !esOscuro);
    // Sincroniza la cookie para que pageshow la lea correctamente al volver
    document.cookie = `tema=${colorPrincipal};path=/;max-age=31536000`;
}

function aplicarTemaDesdeCookie() {
    const match = document.cookie.split(';').find(c => c.trim().startsWith('tema='));
    // Si no hay cookie todavía, no hacer nada
    if (!match) return;
    const valor = match.split('=')[1]?.trim();
    const esOscuro = valor === 'Negro';
    document.body.classList.toggle('tema-oscuro', esOscuro);
    document.body.classList.toggle('tema-claro',  !esOscuro);
}

// ========== APLICAR TEMA AL CARGAR ==========
document.addEventListener('DOMContentLoaded', aplicarTemaDesdeServidor);

// ========== RESTAURAR TEMA AL VOLVER CON BOTÓN ATRÁS (bfcache) ==========
// event.persisted = true cuando el navegador restaura la página desde caché
// (ej: volver desde editor de imagen, dibujo, texto, etc.)
window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
        aplicarTemaDesdeCookie();
    }
});


// ========== MODAL ELEGIR FORMATO ==========
function abrirFormato() {
    document.getElementById('formato-modal').classList.add('visible');
    document.getElementById('formato-backdrop').classList.add('visible');
}
function cerrarFormato() {
    document.getElementById('formato-modal').classList.remove('visible');
    document.getElementById('formato-backdrop').classList.remove('visible');
}
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') cerrarFormato();
});