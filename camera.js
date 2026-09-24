let currentEmployee = null;
let mediaStream = null;
let detectionInterval = null;
let faceDetected = false;
let modelsLoaded = false;

document.addEventListener('DOMContentLoaded', async () => {
    initClock();
    checkEmployeeSession();
    setupActions();
    await initFaceApiAndCamera();
});

function initClock() {
    const clockDisplay = document.getElementById('clock-display');
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

function checkEmployeeSession() {
    const sessionData = sessionStorage.getItem('current_employee');
    if (!sessionData) {
        alert('Nenhum funcionário selecionado. Redirecionando...');
        window.location.href = 'index.html';
        return;
    }

    try {
        currentEmployee = JSON.parse(sessionData);
        const nameElem = document.getElementById('employee-name-display');
        const regElem = document.getElementById('employee-reg-display');

        if (nameElem) nameElem.textContent = currentEmployee.name || 'Funcionário';
        const regVal = currentEmployee.registration_id || currentEmployee.matricula || '--';
        if (regElem) regElem.textContent = `Matrícula: ${regVal}`;
    } catch (e) {
        console.error('Erro ao ler dados da sessão:', e);
        window.location.href = 'index.html';
    }
}

function setupActions() {
    const btnCancel = document.getElementById('btn-cancelar');
    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            stopCamera();
            sessionStorage.removeItem('current_employee');
            window.location.href = 'index.html';
        });
    }

    const btnConfirm = document.getElementById('btn-confirmar');
    if (btnConfirm) {
        btnConfirm.addEventListener('click', () => {
            if (faceDetected || !modelsLoaded) {
                registrarPonto();
            }
        });
    }
}

async function initFaceApiAndCamera() {
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');

    // 1. Iniciar Vídeo
    try {
        const video = document.getElementById('video');
        mediaStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
            audio: false
        });
        video.srcObject = mediaStream;
    } catch (err) {
        console.error('Erro ao acessar webcam:', err);
        if (statusText) statusText.textContent = 'Erro ao acessar câmera';
        alert('Não foi possível acessar a câmera. Verifique as permissões.');
        return;
    }

    // 2. Carregar modelo do face-api.js se disponível
    try {
        if (typeof faceapi !== 'undefined') {
            if (statusText) statusText.textContent = 'Carregando detector facial...';
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';
            await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
            modelsLoaded = true;
            if (statusText) statusText.textContent = 'Procurando rosto...';
            startFaceDetection();
        } else {
            console.warn('face-api.js não carregado. Ativando modo de segurança.');
            enableConfirmButtonFallback();
        }
    } catch (err) {
        console.error('Erro ao carregar modelos face-api:', err);
        // Fallback para permitir o uso se o modelo falhar
        enableConfirmButtonFallback();
    }
}

function enableConfirmButtonFallback() {
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');
    const btnConfirm = document.getElementById('btn-confirmar');

    if (statusText) statusText.textContent = 'Câmera Ativa';
    if (statusIndicator) statusIndicator.classList.add('status-detected');
    if (btnConfirm) btnConfirm.disabled = false;
    faceDetected = true;
}

function startFaceDetection() {
    const video = document.getElementById('video');
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');
    const btnConfirm = document.getElementById('btn-confirmar');

    if (!video) return;

    detectionInterval = setInterval(async () => {
        if (video.paused || video.ended || !modelsLoaded) return;

        try {
            const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 });
            const detections = await faceapi.detectSingleFace(video, options);

            if (detections) {
                faceDetected = true;
                if (statusText) statusText.textContent = 'Rosto Detectado';
                if (statusIndicator) statusIndicator.classList.add('status-detected');
                if (btnConfirm) btnConfirm.disabled = false;
            } else {
                faceDetected = false;
                if (statusText) statusText.textContent = 'Aguardando detecção de rosto...';
                if (statusIndicator) statusIndicator.classList.remove('status-detected');
                if (btnConfirm) btnConfirm.disabled = true;
            }
        } catch (e) {
            console.error('Erro na detecção de rosto:', e);
        }
    }, 500);
}

function stopCamera() {
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
}

async function registrarPonto() {
    const btnConfirm = document.getElementById('btn-confirmar');
    if (btnConfirm) btnConfirm.disabled = true;

    try {
        const now = dayjs ? dayjs() : new Date();
        const formattedTimestamp = typeof dayjs !== 'undefined' ? now.toISOString() : new Date().toISOString();
        const formattedDisplayTime = typeof dayjs !== 'undefined' ? now.format('DD/MM/YYYY HH:mm:ss') : new Date().toLocaleString('pt-BR');

        // Determinar o Tipo (Entrada/Saída) com base nos registros do dia ou padrão Entrada
        let type = 'Entrada';
        let statusTolerance = 'Dentro da tolerância';

        // Regra de tolerância de 15 minutos em relação ao horário do funcionário
        // Se o funcionário possuir expected_time ou padrão 08:00
        const expectedTimeString = currentEmployee.work_schedule || currentEmployee.expected_time || '08:00';
        const currentHour = typeof dayjs !== 'undefined' ? now.hour() : new Date().getHours();
        const currentMinute = typeof dayjs !== 'undefined' ? now.minute() : new Date().getMinutes();

        // Calcular diferença em minutos se for entrada matutina proxima do horario
        const [expHour, expMinute] = expectedTimeString.split(':').map(Number);
        if (!isNaN(expHour) && !isNaN(expMinute)) {
            const expTotalMinutes = expHour * 60 + expMinute;
            const curTotalMinutes = currentHour * 60 + currentMinute;
            const diffMinutes = curTotalMinutes - expTotalMinutes;

            if (diffMinutes > 15) {
                statusTolerance = `Atraso (${diffMinutes} min acima da tolerância)`;
            } else if (diffMinutes < -15) {
                statusTolerance = `Adiantado (${Math.abs(diffMinutes)} min antes)`;
            } else {
                statusTolerance = 'Dentro da tolerância (15 min)';
            }
        }

        // Consultar histórico recente para definir Entrada vs Saída se aplicável
        if (window.supabaseClient && currentEmployee.id) {
            const todayStart = typeof dayjs !== 'undefined' ? dayjs().startOf('day').toISOString() : new Date().setHours(0,0,0,0);

            // Tenta verificar na tabela time_records primeiro, senão time_logs
            let logs = [];
            const { data: recData, error: recErr } = await window.supabaseClient
                .from('time_records')
                .select('*')
                .eq('employee_id', currentEmployee.id)
                .gte('created_at', todayStart)
                .order('created_at', { ascending: false });

            if (!recErr && recData) {
                logs = recData;
            } else {
                const { data: logData } = await window.supabaseClient
                    .from('time_logs')
                    .select('*')
                    .eq('employee_id', currentEmployee.id)
                    .gte('created_at', todayStart)
                    .order('created_at', { ascending: false });
                if (logData) logs = logData;
            }

            if (logs.length > 0) {
                const lastLogType = logs[0].type || logs[0].log_type;
                if (lastLogType === 'Entrada' || lastLogType === 'IN') {
                    type = 'Saída';
                } else {
                    type = 'Entrada';
                }
            }
        }

        // Tentar inserir na tabela time_records do Supabase
        const recordData = {
            employee_id: currentEmployee.id,
            created_at: formattedTimestamp,
            type: type,
            status: statusTolerance
        };

        if (window.supabaseClient) {
            const { error: recErr } = await window.supabaseClient
                .from('time_records')
                .insert([recordData]);

            if (recErr) {
                console.warn('Inserção em time_records falhou, tentando time_logs:', recErr);
                // Fallback para time_logs (se time_records não existir)
                const logData = {
                    employee_id: currentEmployee.id,
                    log_type: type === 'Entrada' ? 'IN' : 'OUT',
                    log_time: formattedTimestamp,
                    status: statusTolerance
                };
                await window.supabaseClient.from('time_logs').insert([logData]);
            }
        }

        stopCamera();
        exibirModalConfirmacao(type, formattedDisplayTime, statusTolerance);

    } catch (err) {
        console.error('Erro ao registrar ponto:', err);
        alert('Ocorreu um erro ao salvar o ponto. Tente novamente.');
        if (btnConfirm) btnConfirm.disabled = false;
    }
}

function exibirModalConfirmacao(type, timeFormatted, statusTolerance) {
    const modal = document.getElementById('modal-confirmation');
    const empName = document.getElementById('modal-emp-name');
    const empReg = document.getElementById('modal-emp-reg');
    const modalType = document.getElementById('modal-type');
    const modalTime = document.getElementById('modal-time');
    const modalStatus = document.getElementById('modal-status');
    const countdown = document.getElementById('countdown');

    const regVal = currentEmployee.registration_id || currentEmployee.matricula || '--';

    if (empName) empName.textContent = currentEmployee.name || '--';
    if (empReg) empReg.textContent = regVal;
    if (modalType) modalType.textContent = type;
    if (modalTime) modalTime.textContent = timeFormatted;
    if (modalStatus) modalStatus.textContent = statusTolerance;

    if (modal) modal.style.display = 'flex';

    let secondsLeft = 5;
    if (countdown) countdown.textContent = secondsLeft;

    const timer = setInterval(() => {
        secondsLeft -= 1;
        if (countdown) countdown.textContent = secondsLeft;
        if (secondsLeft <= 0) {
            clearInterval(timer);
            sessionStorage.removeItem('current_employee');
            window.location.href = 'index.html';
        }
    }, 1000);
}
