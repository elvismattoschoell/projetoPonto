document.addEventListener('DOMContentLoaded', () => {
    // Inicialização do relógio caso a função esteja globalmente disponível, ou fazemos uma versão local simples
    initClock();

    // Inicializar o EmailJS com a Public Key
    if (typeof emailjs !== 'undefined') {
        emailjs.init("SJq1-tSKARLIyasy-");
    }

    setupCadastroForm();
});

function initClock() {
    const clockDisplay = document.getElementById('clock-display');
    if (!clockDisplay) return;

    function updateClock() {
        if (typeof dayjs !== 'undefined') {
            clockDisplay.textContent = dayjs().format('HH:mm:ss');
        } else {
            const now = new Date();
            clockDisplay.textContent = now.toLocaleTimeString('pt-BR');
        }
    }

    updateClock();
    setInterval(updateClock, 1000);
}

function setupCadastroForm() {
    const form = document.getElementById('cadastro-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nome = document.getElementById('nome').value.trim();
        const email = document.getElementById('email').value.trim();
        const funcao = document.getElementById('funcao').value;

        // Validação (embora os atributos HTML 'required' já ajudem, validamos via JS para garantir)
        if (!nome || !email || !funcao) {
            alert('Por favor, preencha todos os campos (Nome, E-mail e Função).');
            return;
        }

        const templateParams = {
            nome: nome,
            email: email,
            funcao: funcao
        };

        const btnSubmit = form.querySelector('button[type="submit"]');
        const originalBtnText = btnSubmit.innerHTML;
        btnSubmit.innerHTML = 'Enviando... <i data-lucide="loader"></i>';
        if(typeof lucide !== 'undefined') lucide.createIcons();
        btnSubmit.disabled = true;

        if (typeof emailjs === 'undefined') {
            alert('Erro: Sistema de e-mail não carregado.');
            btnSubmit.innerHTML = originalBtnText;
            btnSubmit.disabled = false;
            return;
        }

        emailjs.send('service_5861mlu', 'template_9lxog4b', templateParams)
            .then(function(response) {
                console.log('SUCCESS!', response.status, response.text);

                // Exibe o alerta visual
                const alertaSucesso = document.getElementById('alerta-sucesso');
                if (alertaSucesso) {
                    alertaSucesso.style.display = 'block';
                    // Ocultar após 5 segundos
                    setTimeout(() => {
                        alertaSucesso.style.display = 'none';
                    }, 5000);
                } else {
                    alert('Solicitação enviada com sucesso!');
                }

                // Limpa o formulário
                form.reset();
            }, function(error) {
                console.log('FAILED...', error);
                alert('Ocorreu um erro ao enviar a solicitação. Tente novamente mais tarde.');
            })
            .finally(function() {
                // Restaura o botão
                btnSubmit.innerHTML = originalBtnText;
                if(typeof lucide !== 'undefined') lucide.createIcons();
                btnSubmit.disabled = false;
            });
    });
}
