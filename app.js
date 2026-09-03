document.addEventListener('DOMContentLoaded', () => {
    // Inicialização de componentes da interface
    initClock();
    setupForm();
});

function initClock() {
    const clockDisplay = document.getElementById('clock-display');

    function updateClock() {
        if (typeof dayjs !== 'undefined') {
            clockDisplay.textContent = dayjs().format('HH:mm:ss');
        } else {
            // Fallback caso dayjs não tenha carregado
            const now = new Date();
            clockDisplay.textContent = now.toLocaleTimeString('pt-BR');
        }
    }

    updateClock();
    setInterval(updateClock, 1000);
}

function setupForm() {
    const form = document.getElementById('ponto-form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const matricula = document.getElementById('matricula').value.trim();

        if (!matricula) {
            alert('Por favor, informe a matrícula.');
            return;
        }

        console.log(`Iniciando fluxo para matrícula: ${matricula}`);
        // TODO: Integrar com supabase.js, biometrics.js e timeUtils.js
        alert(`Fluxo iniciado para matrícula: ${matricula} (Implementação futura)`);
    });
}