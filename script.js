const URL_API = "https://script.google.com/macros/s/AKfycbzr3-LyqL1nzwI3f3zOUKhyNwwrcsDS0crMgbH8ZjwjTCkclYnzsnl84StpHtwuXtR-hg/exec";

// Função para criar o HTML do card (para não repetir código)
function criarCardHTML(item) {
    // Limpeza de horário que já fizemos antes
    let horaLimpa = item.horario;
    if (typeof horaLimpa === 'string' && horaLimpa.includes('T')) {
        horaLimpa = horaLimpa.split('T')[1].substring(0, 5);
    }
// A mágica acontece aqui: adicionamos .toUpperCase() na placa
    let placaMaiuscula = item.placa ? item.placa.toUpperCase() : 'N/A';
    return `
        <div class="card-coleta" id="card-${item.nome.replace(/\s+/g, '')}">
            
        <div class="info">
                <strong>${item.nome.toUpperCase()}</strong>
                <span>🚚 ${item.tipo} | 🆔 ${placaMaiuscula || 'N/A'} 📞 ${item.telefone || 'Sem tel'} | 🕒 ${horaLimpa}</span>
                <span></span>
            </div>
                
                <button class="btn-liberar" onclick="liberarColeta('${item.nome}')">Liberar</button>
                
            
            </div>
            
            
        </div>
        `
        ;
        
}
const handlePhone = (event) => {
    let input = event.target
    input.value = phoneMask(input.value)
}

const phoneMask = (value) => {
    if (!value) return ""
    value = value.replace(/\D/g,'') // remove o que não é digito
    value = value.replace(/(\d{2})(\d)/,"($1) $2") // Coloca parênteses em volta dos dois primeiros dígitos
    value = value.replace(/(\d{5})(\d)/,"$1-$2") // Coloca hífen entre o quinto e o sexto dígito
    return value
}

async function adicionarColeta() {
    const nomeInput = document.getElementById('nome');
    const tipoInput = document.getElementById('tipo');
    const placaInput = document.getElementById('placa');
    const phoneInput = document.getElementById('phone');
    const lista = document.getElementById('listaColetas');

    if (!nomeInput.value) return alert("Preencha o nome!");

    const novoItem = {
        nome: nomeInput.value,
        tipo: tipoInput.value,
        placa: placaInput.value,
        telefone: phoneInput.value,
        horario: "'" + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    // 1. Inserir visualmente NA HORA no topo da lista
    lista.insertAdjacentHTML('afterbegin', criarCardHTML(novoItem));

    // 2. Enviar para o Google em segundo plano
    await fetch(URL_API, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify(novoItem)
    });

    nomeInput.value = "";
    placaInput.value = "";
    phoneInput.value = "";
    // Não precisamos limpar a tela toda, o item já está lá!
}

async function liberarColeta(nome) {
    if (confirm(`Liberar cliente ${nome}?`)) {
        // 1. Remover visualmente IMEDIATAMENTE
        const idCard = `card-${nome.replace(/\s+/g, '')}`;
        const elemento = document.getElementById(idCard);
        if (elemento) {
            elemento.style.opacity = "0.3"; // Efeito visual de saindo
            setTimeout(() => elemento.remove(), 500);
        }

        // 2. Avisar o Google para deletar
        await fetch(URL_API, { 
            method: 'POST', 
            mode: 'no-cors',
            body: JSON.stringify({ "action": "delete", "nome": nome }) 
        });
    }
}

async function buscarColetas() {
    const lista = document.getElementById('listaColetas');
    console.log("Atualizando lista de registros...");
    // Só mostramos "Carregando" na primeira vez que abre a página
    if (lista.innerHTML === "") lista.innerHTML = "<p>Buscando dados...</p>";

    try {
        const response = await fetch(URL_API);
        const dados = await response.json();
        
        // Em vez de limpar tudo, vamos reconstruir de forma suave
        let novoConteudo = "";
        dados.forEach(item => {
            novoConteudo += criarCardHTML(item);
        });
        lista.innerHTML = novoConteudo;
    } catch (e) {
        console.error(e);
    }
   
     setInterval(buscarDados, 10);
}

// Inicia a lista
buscarColetas();