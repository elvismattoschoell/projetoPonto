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

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const matricula = document.getElementById('matricula').value.trim();

        if (!matricula) {
            alert('Por favor, informe a matrícula.');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            if (!window.supabaseClient) {
                alert('Erro de conexão com o banco de dados. Recarregue a página.');
                return;
            }

            // Busca na tabela employees filtrando por matricula ou registration_id
            let employee = null;

            // Tenta consultar por registration_id
            const { data: dataReg, error: errReg } = await window.supabaseClient
                .from('employees')
                .select('*')
                .eq('registration_id', matricula)
                .maybeSingle();

            if (!errReg && dataReg) {
                employee = dataReg;
            } else {
                // Tenta por matricula como fallback
                const { data: dataMat, error: errMat } = await window.supabaseClient
                    .from('employees')
                    .select('*')
                    .eq('matricula', matricula)
                    .maybeSingle();
                if (!errMat && dataMat) {
                    employee = dataMat;
                }
            }

            if (!employee || employee.is_active === false) {
                alert('Matrícula não encontrada. Se ainda não possui cadastro, clique abaixo em Solicitar.');
                return;
            }

            // Salva dados no sessionStorage e redireciona
            sessionStorage.setItem('current_employee', JSON.stringify(employee));
            window.location.href = 'camera.html';

        } catch (err) {
            console.error('Erro ao validar matrícula:', err);
            alert('Ocorreu um erro ao consultar a matrícula. Tente novamente.');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });
}
