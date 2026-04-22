// app.js

// START BACKEND INTEGRATION 
const SUPABASE_URL = "https://xxrgxklwahmanxlgioxk.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4cmd4a2x3YWhtYW54bGdpb3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzMTE2OTEsImV4cCI6MjA5MTg4NzY5MX0.unV6eUzgQjrrP2oZRllSiSGb7wsxoSJVdG94G6iZUFw";
const dbClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// STATE
let state = {
    user: { name: "", whatsapp: "", email: "" },
    currentBlock: 0,
    currentQuestion: 0,
    answers: {},
    scores: { total: 0, metabolic: 0, hormonal: 0, sleep: 0, stress: 0, lifestyle: 0, business: 0 }
};

// QUIZ DATA DEFINITION (Simplified Vocabulary & No Photos)
const blocks = [
    {
        title: "Dados Físicos",
        icon: "solar:user-circle-bold-duotone",
        questions: [
            { id: "sexo", type: "formatC", text: "Sexo", options: [
                { label: "Masculino", value: "M", icon: "solar:men-bold-duotone" },
                { label: "Feminino", value: "F", icon: "solar:women-bold-duotone" }
            ]},
            { id: "idade", type: "formatD", text: "Qual é a sua idade?", placeholder: "Ex: 42", min: 18, max: 100, unit: "anos" },
            { id: "peso", type: "formatD", text: "Qual é o seu peso?", placeholder: "Ex: 85", min: 40, max: 200, unit: "kg" },
            { id: "altura", type: "formatD", text: "Qual é a sua altura?", placeholder: "Ex: 180", min: 140, max: 250, unit: "cm" },
            { id: "doenca", type: "formatC", text: "Você possui alguma doença crônica?", options: [
                { label: "Não", desc: "Estou saudável", value: "N", icon: "solar:shield-check-bold-duotone" },
                { label: "Sim", desc: "Faço acompanhamento", value: "S", icon: "solar:danger-circle-bold-duotone" }
            ]}
        ]
    },
    {
        title: "Coração e Metabolismo",
        icon: "solar:heart-pulse-bold-duotone",
        questions: [
            { id: "b2q1", type: "formatA", text: "Quando foi a última vez que você fez um check-up médico completo?", options: [
                { label: "Há menos de 1 ano", desc: "Tudo em dia", value: 2, weight: 2, icon: "solar:calendar-date-bold-duotone" },
                { label: "Há mais de 1 ano", desc: "Estou atrasado", value: 1, weight: 2, icon: "solar:calendar-search-bold-duotone" },
                { label: "Nunca fiz", desc: "Preciso fazer", value: 0, weight: 2, icon: "solar:close-square-bold-duotone" }
            ]},
            { id: "b2q2", type: "formatA", text: "Como estavam os resultados dos seus exames de sangue mais recentes?", options: [
                { label: "Tudo normal", desc: "Exames ótimos", value: 2, weight: 2, icon: "solar:chart-square-bold-duotone" },
                { label: "Alguns alterados", desc: "Tinha alguma alteração", value: 1, weight: 2, icon: "solar:graph-down-bold-duotone" },
                { label: "Não sei / Não lembro", desc: "Não sei responder", value: 0, weight: 2, icon: "solar:question-circle-bold-duotone" }
            ]},
            { id: "b2q3", type: "formatC", text: "Você costuma ter muito cansaço diário, falta de ar ou pressão alta?", options: [
                { label: "Não", desc: "Coração em dia", value: 2, weight: 3, icon: "solar:bolt-bold-duotone" },
                { label: "Sim", desc: "Sintoma frequente", value: 0, weight: 3, icon: "solar:pulse-bold-duotone" }
            ]}
        ]
    },
    {
        title: "Energia e Disposição",
        icon: "solar:bolt-circle-bold-duotone",
        questions: [
            { id: "b3q1", type: "formatB", text: "Como você classificaria a sua disposição durante um dia normal?", leftLabel: "Totalmente sem energia", rightLabel: "Muita energia o tempo todo", map: (v) => v<=3 ? 0 : (v<=6 ? 1 : 2), weight: 4 },
            { id: "b3q2", type: "formatA", text: "Você precisa tomar café ou estimulantes para conseguir trabalhar focado?", options: [
                { label: "Quase nunca", desc: "Não dependo de café", value: 2, weight: 3, icon: "solar:cup-hot-outline" },
                { label: "Um pouco", desc: "Ajuda de vez em quando", value: 1, weight: 3, icon: "solar:cup-hot-bold-duotone" },
                { label: "Muito dependente", desc: "Não funciono sem", value: 0, weight: 3, icon: "solar:danger-triangle-bold-duotone" }
            ]},
            { id: "b3q3", type: "formatC", text: "Você sente muito sono ou preguiça logo depois de almoçar?", options: [
                { label: "Quase Nunca", desc: "Meu foco segue", value: 2, weight: 2, icon: "solar:check-circle-bold-duotone" },
                { label: "Com Frequência", desc: "Bate uma lentidão", value: 0, weight: 2, icon: "solar:brain-bold-duotone" }
            ]}
        ]
    },
    {
        title: "Qualidade do Sono",
        icon: "solar:moon-stars-bold-duotone",
        questions: [
            { id: "b4q1", type: "formatD", text: "Você costuma dormir quantas horas por noite?", min: 2, max: 12, unit: "horas", weight: 4 },
            { id: "b4q2", type: "formatA", text: "Você costuma usar o celular ou ver TV na cama horas antes de dormir?", options: [
                { label: "Quase nunca", desc: "Gosto de silêncio", value: 2, weight: 3, icon: "solar:shield-check-bold-duotone" },
                { label: "De vez em quando", desc: "Às vezes dou uma olhada", value: 1, weight: 3, icon: "solar:shield-warning-bold-duotone" },
                { label: "Sempre", desc: "Uso até pegar no sono", value: 0, weight: 3, icon: "solar:smartphone-bold-duotone" }
            ]},
            { id: "b4q3", type: "formatC", text: "Como você se sente quando acorda de manhã?", options: [
                { label: "Acordo descansado", desc: "Pronto para o dia", value: 2, weight: 2, icon: "solar:sunrise-bold-duotone" },
                { label: "Acordo cansado(a)", desc: "Como se não tivesse dormido", value: 0, weight: 2, icon: "solar:ghost-bold-duotone" }
            ]}
        ]
    },
    {
        title: "Estresse e Mente",
        icon: "solar:brain-bold-duotone",
        questions: [
            { id: "b5q1", type: "formatB", text: "O quanto de estresse o seu trabalho causa na sua vida emocional?", leftLabel: "Super Tranquilo", rightLabel: "Muito estresse / Sobrecarga", map: (v) => v<=3 ? 2 : (v<=6 ? 1 : 0), weight: 4 },
            { id: "b5q2", type: "formatA", text: "O seu trabalho invade muito a sua vida pessoal (família e finais de semana)?", options: [
                { label: "Bem pouco", desc: "Consigo separar bem", value: 2, weight: 3, icon: "solar:lock-bold-duotone" },
                { label: "Às vezes", desc: "Resolvo pepinos urgentes", value: 1, weight: 3, icon: "solar:case-bold-duotone" },
                { label: "Sempre", desc: "Nunca desligo do trabalho", value: 0, weight: 3, icon: "solar:server-square-bold-duotone" }
            ]}
        ]
    },
    {
        title: "Rotina Física",
        icon: "solar:running-bold-duotone",
        questions: [
            { id: "b6q1", type: "formatA", text: "Quantas vezes por semana você pratica algum exercício físico?", options: [
                { label: "3 vezes ou mais", desc: "Gosto de malhar", value: 2, weight: 4, icon: "solar:dumbbell-bold-duotone" },
                { label: "1 a 2 vezes", desc: "Mas costumo falhar", value: 1, weight: 4, icon: "solar:calendar-bold-duotone" },
                { label: "Nenhuma (Sedentário)", desc: "Estou sem tempo", value: 0, weight: 4, icon: "solar:armchair-bold-duotone" }
            ]},
            { id: "b6q2", type: "formatA", text: "Qual a sua frequência de consumo de álcool?", options: [
                { label: "Quase nunca", desc: "Bebo raramente ou não bebo", value: 2, weight: 2, icon: "solar:cup-bold-duotone" },
                { label: "Apenas socialmente", desc: "Fins de semana e saídas", value: 1, weight: 2, icon: "solar:wineglass-bold-duotone" },
                { label: "Frequente/Diário", desc: "Bebo para relaxar ou direto", value: 0, weight: 2, icon: "solar:danger-square-bold-duotone" }
            ]}
        ]
    },
    {
        title: "Impacto no Negócio",
        icon: "solar:buildings-bold-duotone",
        questions: [
            { id: "b7q1", type: "formatA", text: "Se você ficar menos produtivo ou doente hoje, as vendas ou lucros da sua empresa caem rapidamente?", options: [
                { label: "Não afeta", desc: "O time toca bem", value: 2, weight: 2, icon: "solar:round-transfer-diagonal-bold-duotone" },
                { label: "Afeta de leve", desc: "Eu ainda sou central", value: 1, weight: 2, icon: "solar:chart-down-bold-duotone" },
                { label: "Cai na hora", desc: "A empresa para sem mim", value: 0, weight: 2, icon: "solar:fire-bold-duotone" }
            ]},
            { id: "b7q2", type: "formatC", text: "Sua empresa conseguiria funcionar bem se você precisasse ficar afastado por 60 dias devido a saúde?", options: [
                { label: "Não conseguiria", desc: "Seria um risco gigante", value: 0, weight: 2, icon: "solar:shield-cross-bold-duotone" },
                { label: "Sim", desc: "A casa tá arrumada", value: 2, weight: 2, icon: "solar:shield-check-bold-duotone" }
            ]}
        ]
    },
    {
        title: "Qual o seu Objetivo Principal",
        icon: "solar:target-bold-duotone",
        questions: [
            { id: "b8q1", type: "formatA", text: "Qual você diria que é hoje o seu maior motivo para querer melhorar sua saúde?", options: [
                { label: "Ter mais tempo e saúde ativa", desc: "Evitar doenças de modo geral", value: "Prevenção", weight: 0, icon: "solar:shield-bold-duotone" },
                { label: "Ter muito mais energia", desc: "Parar de me sentir cansado", value: "Performance", weight: 0, icon: "solar:bolt-bold-duotone" },
                { label: "Meu trabalho exige", desc: "Usar meu corpo para escalar a empresa", value: "Negócio", weight: 0, icon: "solar:banknotes-bold-duotone" }
            ]}
        ]
    }
];

// --- FLOW MANAGEMENT ---

document.addEventListener("DOMContentLoaded", () => {
    const loadingWords = ["Consultando diretrizes biológicas...", "Avaliando pilares do evento...", "Carregando motores preditivos...", "Quase lá..."];
    let wordIdx = 0;
    const msgEl = document.getElementById("loading-msg");
    const barFill = document.getElementById("loading-bar-fill");
    
    const msgInt = setInterval(() => {
        wordIdx = (wordIdx + 1) % loadingWords.length;
        if(msgEl) msgEl.innerText = loadingWords[wordIdx];
    }, 600);

    setTimeout(() => { if(barFill) barFill.style.width = "100%"; }, 10);
    
    setTimeout(() => {
        clearInterval(msgInt);
        hideScreen("loading-screen");
        showScreen("welcome-screen");
    }, 3000);

    document.getElementById("welcome-form").addEventListener("submit", (e) => {
        e.preventDefault();
        state.user.name = document.getElementById("lead_name").value;
        state.user.whatsapp = document.getElementById("lead_whatsapp").value;
        state.user.email = document.getElementById("lead_email").value;
        
        hideScreen("welcome-screen");
        showScreen("quiz-screen");
        renderCurrentQuestion();
    });

    document.getElementById("btn-quiz-next").addEventListener("click", nextQuestion);
    document.getElementById("btn-quiz-prev").addEventListener("click", prevQuestion);
});

function hideScreen(id) { 
    if(document.getElementById(id)) document.getElementById(id).setAttribute("hidden", "true"); 
}
function showScreen(id) { 
    if(document.getElementById(id)) document.getElementById(id).removeAttribute("hidden"); 
}

const wAppInput = document.getElementById("lead_whatsapp");
if(wAppInput) {
    wAppInput.addEventListener("input", function(e) {
        let x = e.target.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,5})(\d{0,4})/);
        e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
    });
}

function computeDynamicIMC() {
    let peso = parseFloat(state.answers["peso"]);
    let altura = parseFloat(state.answers["altura"]);
    if (peso && altura) {
        let altM = altura / 100;
        let imc = peso / (altM * altM);
        if (imc < 18.5) {
            state.answers["imc_status"] = "Abaixo do peso";
            state.scores.metabolic += 1;
        } else if (imc >= 18.5 && imc <= 24.9) {
            state.answers["imc_status"] = "Dentro do esperado";
            state.scores.metabolic += 2;
        } else {
            state.answers["imc_status"] = "Acima do ideal";
            state.scores.metabolic += 0;
        }
        state.answers["imc_value"] = imc.toFixed(1);
    }
}

// QUIZ ENGINE
function renderCurrentQuestion() {
    const block = blocks[state.currentBlock];
    const q = block.questions[state.currentQuestion];
    
    document.getElementById("quiz-block-label").innerHTML = `<iconify-icon icon="${block.icon}"></iconify-icon> Bloco ${state.currentBlock + 1} de 8 — ${block.title}`;
    const totBlocks = blocks.length;
    document.getElementById("quiz-progress-bar").style.width = `${((state.currentBlock) / totBlocks) * 100}%`;
    document.getElementById("quiz-time-label").innerText = `~${totBlocks - state.currentBlock} min`;

    const wrapper = document.getElementById("question-wrapper");
    wrapper.classList.remove("exit");
    wrapper.classList.add("enter");
    
    let qText = q.text;
    if(state.answers["sexo"] === "F") {
        qText = qText.replace("estressado", "estressada").replace("descansado", "descansada").replace("Ativo", "Ativa").replace("Quebrado(a)", "Quebrada");
    } else {
        qText = qText.replace("Quebrado(a)", "Quebrado");
    }

    document.getElementById("question-title").innerHTML = qText;
    const contentBox = document.getElementById("question-content");
    contentBox.innerHTML = "";
    
    if (q.type === "formatA" || q.type === "formatC") {
        const grid = document.createElement("div");
        grid.className = "options-grid";
        q.options.forEach((opt, idx) => {
            const card = document.createElement("div");
            card.className = "option-card option-interactive";
            if (state.answers[q.id] === opt.value) card.classList.add("selected");
            if (q.id === "sexo") card.classList.add("gender-anim-card"); // Add animation class for Sex
            
            let htmlInner = "";
            
            htmlInner += `<div class="option-content">
                            ${opt.icon ? `<iconify-icon class="option-icon option-glow-icon ${q.id === 'sexo'? 'gender-icon' : ''}" icon="${opt.icon}"></iconify-icon>` : ''}
                            <div class="option-label">${opt.label}</div>
                            ${opt.desc ? `<div class="option-desc">${opt.desc}</div>` : ''}
                         </div>`;
                         
            card.innerHTML = htmlInner;
            card.onclick = () => selectOption(q.id, opt.value, card, grid);
            grid.appendChild(card);
        });
        contentBox.appendChild(grid);
    } 
    else if (q.type === "formatB") { // Slider
        const c = document.createElement("div");
        c.className = "slider-container option-interactive";
        const valBox = document.createElement("div");
        valBox.className = "slider-value-display";
        const min = q.min || 0; const max = q.max || 10;
        let currVal = state.answers[q.id] || (max/2);
        valBox.innerText = currVal;

        const html = `
            <div class="slider-labels">
                <span>${q.leftLabel}</span>
                <span>${q.rightLabel}</span>
            </div>
            <input type="range" id="slider-${q.id}" class="accent-slider" min="${min}" max="${max}" value="${currVal}">
        `;
        c.innerHTML = html;
        c.appendChild(valBox);
        contentBox.appendChild(c);

        const slider = document.getElementById(`slider-${q.id}`);
        slider.oninput = (e) => {
            valBox.innerText = e.target.value;
            state.answers[q.id] = parseInt(e.target.value);
            validateNav();
        };
        state.answers[q.id] = parseInt(currVal);
    } 
    else if (q.type === "formatD") { // EXATO (Exact Number Input)
        const c = document.createElement("div");
        c.className = "exact-input-container option-interactive";
        c.style.textAlign = "center";
        
        let currVal = state.answers[q.id] || "";
        
        c.innerHTML = `
            <input type="number" id="input-${q.id}" class="input-field vibrant-input" placeholder="${q.placeholder || ''}" value="${currVal}" min="${q.min}" max="${q.max}">
            <div class="unit-label">${q.unit}</div>
        `;
        contentBox.appendChild(c);

        const inp = document.getElementById(`input-${q.id}`);
        inp.oninput = (e) => {
            state.answers[q.id] = e.target.value;
            validateNav();
            
            // Auto IMC computation visual feedback
            if(q.id === "peso" || q.id === "altura") {
                if (state.answers["peso"] && state.answers["altura"]) {
                    let p = parseFloat(state.answers["peso"]);
                    let a = parseFloat(state.answers["altura"]) / 100;
                    if(p && a) {
                        let imc = (p / (a*a)).toFixed(1);
                        let feedback = document.getElementById("imc-feedback");
                        if(!feedback) {
                            feedback = document.createElement("div");
                            feedback.id = "imc-feedback";
                            feedback.className = "imc-preview";
                            c.appendChild(feedback);
                        }
                        feedback.innerHTML = `IMC Calculado: <strong>${imc}</strong>`;
                    }
                }
            }
        };
        setTimeout(() => inp.focus(), 500);
    }

    validateNav();
    setTimeout(() => wrapper.classList.remove("enter"), 400);
    document.getElementById("btn-quiz-prev").style.visibility = (state.currentQuestion > 0 || state.currentBlock > 0) ? "visible" : "hidden";
}

function selectOption(qId, val, cardEl, gridEl) {
    state.answers[qId] = val;
    Array.from(gridEl.children).forEach(c => c.classList.remove("selected"));
    cardEl.classList.add("selected");
    validateNav();
}

function validateNav() {
    const q = blocks[state.currentBlock].questions[state.currentQuestion];
    const nxt = document.getElementById("btn-quiz-next");
    let valid = false;
    
    if (state.answers[q.id] !== undefined && state.answers[q.id] !== "") {
        if(q.type === "formatD") {
            let val = parseFloat(state.answers[q.id]);
            if(val >= q.min && val <= q.max) valid = true;
        } else {
            valid = true;
        }
    }
    
    if (valid) nxt.removeAttribute("disabled");
    else nxt.setAttribute("disabled", "true");
}

function nextQuestion() {
    const block = blocks[state.currentBlock];
    const wrapper = document.getElementById("question-wrapper");
    wrapper.classList.remove("enter");
    wrapper.classList.add("exit");

    setTimeout(() => {
        if (state.currentQuestion < block.questions.length - 1) {
            state.currentQuestion++;
            renderCurrentQuestion();
        } else {
            showMicroResult(block.title, block.icon, () => {
                if (state.currentBlock < blocks.length - 1) {
                    state.currentBlock++;
                    state.currentQuestion = 0;
                    renderCurrentQuestion();
                } else {
                    computeDynamicIMC(); // Calulate BMI before submitting
                    finishQuiz();
                }
            });
        }
    }, 300);
}

function prevQuestion() {
    const wrapper = document.getElementById("question-wrapper");
    wrapper.classList.remove("enter");
    wrapper.classList.add("exit");
    
    setTimeout(() => {
        if (state.currentQuestion > 0) {
            state.currentQuestion--;
        } else if (state.currentBlock > 0) {
            state.currentBlock--;
            state.currentQuestion = blocks[state.currentBlock].questions.length - 1;
        }
        renderCurrentQuestion();
    }, 300);
}

function showMicroResult(title, icon, cb) {
    const overlay = document.getElementById("micro-result-overlay");
    document.getElementById("micro-title").innerText = `Analisado`;
    document.getElementById("micro-icon").setAttribute("icon", icon);
    overlay.classList.add("show");
    
    setTimeout(() => {
        overlay.classList.remove("show");
        cb();
    }, 900);
}

function calculateScores() {
    const a = state.answers;
    const getNum = (id) => {
        const v = a[id];
        return (v !== undefined && v !== '') ? Number(v) : 0;
    };

    // IMC (recalculado direto das respostas)
    const peso = parseFloat(a['peso']) || 0;
    const altura = parseFloat(a['altura']) || 0;
    let imcScore = 0;
    if (peso && altura) {
        const imc = peso / Math.pow(altura / 100, 2);
        imcScore = (imc >= 18.5 && imc <= 24.9) ? 2 : (imc < 18.5 ? 1 : 0);
    }

    // Metabólico: bloco 2 + IMC (max 16)
    const metabolic = Math.min(10, Math.round(
        (getNum('b2q1') * 2 + getNum('b2q2') * 2 + getNum('b2q3') * 3 + imcScore) / 16 * 10
    ));

    // Hormonal/Energia: bloco 3 (max 18)
    const b3q1 = getNum('b3q1');
    const b3q1Score = b3q1 <= 3 ? 0 : (b3q1 <= 6 ? 1 : 2);
    const hormonal = Math.min(10, Math.round(
        (b3q1Score * 4 + getNum('b3q2') * 3 + getNum('b3q3') * 2) / 18 * 10
    ));

    // Sono: bloco 4 (max 18)
    const sleepH = parseFloat(a['b4q1']) || 0;
    const sleepHScore = sleepH >= 7 ? 2 : (sleepH >= 5 ? 1 : 0);
    const sleep = Math.min(10, Math.round(
        (sleepHScore * 4 + getNum('b4q2') * 3 + getNum('b4q3') * 2) / 18 * 10
    ));

    // Estresse: bloco 5, escala invertida (max 14)
    const b5q1 = getNum('b5q1');
    const b5q1Score = b5q1 <= 3 ? 2 : (b5q1 <= 6 ? 1 : 0);
    const stress = Math.min(10, Math.round(
        (b5q1Score * 4 + getNum('b5q2') * 3) / 14 * 10
    ));

    // Estilo de vida: bloco 6 (max 12)
    const lifestyle = Math.min(10, Math.round(
        (getNum('b6q1') * 4 + getNum('b6q2') * 2) / 12 * 10
    ));

    // Negócio: bloco 7 (max 8)
    const business = Math.min(10, Math.round(
        (getNum('b7q1') * 2 + getNum('b7q2') * 2) / 8 * 10
    ));

    // Total: média dos pilares escalada para 50
    const total = Math.round((metabolic + hormonal + sleep + stress + lifestyle + business) / 60 * 50);

    return { total, metabolic, hormonal, sleep, stress, lifestyle, business };
}

function finishQuiz() {
    hideScreen("quiz-screen");
    showScreen("processing-screen");

    state.scores = calculateScores();
    
    localStorage.setItem("mle_session", JSON.stringify(state));

    const steps = ["step-0", "step-1", "step-2", "step-3", "step-4", "step-5"];
    
    // BACKEND PAYLOAD PUSH
    if(dbClient) {
        let totalScore = state.scores.total;
        let risk = totalScore < 25 ? 'high' : (totalScore < 40 ? 'medium' : 'low');
        
        dbClient.from('leads').insert([{
            name: state.user.name,
            email: state.user.email,
            whatsapp: state.user.whatsapp,
            
            age: String(state.answers.idade || ''),
            weight: String(state.answers.peso || ''),
            height: String(state.answers.altura || ''),
            sex: state.answers.sexo || '',
            condition: state.answers.doenca || '',
            
            primary_goal: String(state.answers.b8q1 || ''),
            business_dependency: String(state.answers.b7q1 || ''),
            business_growth: String(state.answers.b7q2 || ''),
            
            score_total: totalScore,
            score_metabolic: state.scores.metabolic,
            score_hormonal: state.scores.hormonal,
            score_sleep: state.scores.sleep,
            score_stress: state.scores.stress,
            score_lifestyle: state.scores.lifestyle,
            score_business: state.scores.business,
            risk_level: risk
        }]).select().then(({data, error}) => {
            if(data && data.length > 0) {
                state.lead_id = data[0].id; // Save server ID mapping
                localStorage.setItem("mle_session", JSON.stringify(state));
            } else if (error) {
                console.error("Supabase Save Error: ", error);
            }
        });
    }

    const bar = document.getElementById("processing-bar");
    bar.style.transition = "width " + (steps.length * 0.8) + "s cubic-bezier(0.4, 0, 0.2, 1)";
    setTimeout(() => bar.style.width = "100%", 10);

    steps.forEach((step, idx) => {
        setTimeout(() => {
            document.getElementById(step).classList.add("active");
        }, (idx + 1) * 800);
    });

    setTimeout(() => {
        window.location.href = "resultado.html";
    }, (steps.length + 1) * 800);
}
