// --- CONFIGURAÇÕES GERAIS ---
// A chave agora é buscada do cofre seguro do script.
const ID_PLANILHA = '1O5BGNMWhdHCZ1cdiMODDlgCYWn3UiMOMdQuc7N9yasw'; 

function doGet(e) {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no')
    .setTitle('Loggi Estoque Mobile')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// --- HELPER: BUSCA FLEXÍVEL DE ABAS ---
// Resolve o problema de "estoque " vs "Estoque" vs "ESTOQUE"
function getSheetFlexible(ss, nomesPossiveis) {
  const sheets = ss.getSheets();
  for (let sheet of sheets) {
    const sheetName = sheet.getName().trim().toLowerCase();
    // Verifica se o nome da aba bate com algum dos nomes possíveis (normalizados)
    if (nomesPossiveis.some(n => n.toLowerCase() === sheetName)) {
      return sheet;
    }
  }
  return null;
}

// --- FUNÇÕES DE LEITURA DE DADOS ---
function getDadosCompletos() {
  try {
    if (!ID_PLANILHA) return { error: true, msg: "ID da planilha não configurado." };
    
    const ss = SpreadsheetApp.openById(ID_PLANILHA);
    
    // 1. BUSCAR ABA 'ESTOQUE' (Robustez nível 3)
    const sheetEstoque = getSheetFlexible(ss, ['estoque', 'Estoque', 'Controle de Estoque', 'PRODUTOS']);
    
    if (!sheetEstoque) {
      const nomesExistentes = ss.getSheets().map(s => s.getName()).join(', ');
      return { error: true, msg: `Aba de estoque não encontrada. Abas existentes: [${nomesExistentes}]` };
    }

    const dataEstoque = sheetEstoque.getDataRange().getValues();
    let estoque = [];
    
    if (dataEstoque.length > 1) {
      const headers = dataEstoque.shift(); // Remove cabeçalho
      
      // Mapeamento seguro com fallback
      estoque = dataEstoque.map(row => ({
        material: row[0],                // Col A
        estoqueInicio: row[1],           // Col B
        estoqueAtual: row[2],            // Col C
        qtdRetiradas: row[3],            // Col D
        qtdReposicao: row[4],            // Col E
        estoqueCritico: row[5],          // Col F
        isProximoEstoqueCritico: row[6], // Col G
        // Colunas H e I puladas intencionalmente conforme seu CSV original
        epi: row[9],                     // Col J
        epiAtivo: row[10]                // Col K
      }));
    }

    // 2. BUSCAR ABA 'MOVIMENTACOES'
    const sheetMov = getSheetFlexible(ss, ['movimentacoes', 'Movimentacoes', 'Respostas ao formulário 1', 'Historico']);
    let movimentacoes = [];
    
    if (sheetMov && sheetMov.getLastRow() > 1) {
      const lastRow = sheetMov.getLastRow();
      // Traz as últimas 30 movimentações (aumentado um pouco)
      const startRow = Math.max(2, lastRow - 29);
      const numRows = lastRow - startRow + 1;
      
      // Garante que lemos pelo menos as 6 colunas necessárias
      // dataHora, material, tipo, qtd, usuario, observacao
      const dataMov = sheetMov.getRange(startRow, 1, numRows, 6).getValues();
      
      movimentacoes = dataMov.reverse().map(row => ({
        dataHora: row[0],
        material: row[1],
        tipo: row[2],
        qtd: row[3],
        usuario: row[4]
      }));
    }

    return {
      error: false,
      estoque: estoque,
      movimentacoes: movimentacoes
    };

  } catch (e) {
    return { error: true, msg: "Erro no Servidor: " + e.message };
  }
}

// --- FUNÇÕES DE ESCRITA ---
function salvarMovimentacao(dados) {
  const lock = LockService.getScriptLock();
  // Aumentado para 30 segundos para aguentar concorrência
  try {
    lock.waitLock(30000); 
    
    const ss = SpreadsheetApp.openById(ID_PLANILHA);
    const sheetEstoque = getSheetFlexible(ss, ['estoque', 'Estoque', 'Controle de Estoque']);
    const sheetMov = getSheetFlexible(ss, ['movimentacoes', 'Movimentacoes', 'Respostas ao formulário 1']);
    
    if (!sheetEstoque || !sheetMov) throw new Error("Abas necessárias não encontradas.");

    const timestamp = new Date();
    const data = sheetEstoque.getDataRange().getValues();
    
    let linhaEncontrada = -1;
    let linhaDados = null; // Guarda a linha inteira do array para leitura segura
    
    // Busca Case-Insensitive e Trimmed
    const materialBusca = String(dados.material).trim().toLowerCase();
    
    for (let i = 1; i < data.length; i++) {
      const materialLinha = String(data[i][0]).trim().toLowerCase();
      if (materialLinha === materialBusca) {
        linhaEncontrada = i + 1; // Índice da planilha (base 1)
        linhaDados = data[i];    // Linha do array (base 0)
        break;
      }
    }
    
    if (linhaEncontrada === -1) return { success: false, msg: "Item não encontrado no cadastro." };
    
    // Leituras seguras usando a linha encontrada no array
    const saldoAtual = Number(linhaDados[2] || 0); // Coluna C (index 2)
    
    let novoSaldo = saldoAtual;
    
    if (dados.tipo === 'Retirada') {
      if (saldoAtual < dados.quantidade) return { success: false, msg: `Saldo insuficiente! Atual: ${saldoAtual}` };
      
      novoSaldo = saldoAtual - dados.quantidade;
      
      // Atualiza acumulador de Retiradas (Coluna D -> Index 3 -> ColunaPlanilha 4)
      const qtdRetiradaAtual = Number(linhaDados[3] || 0);
      sheetEstoque.getRange(linhaEncontrada, 4).setValue(qtdRetiradaAtual + dados.quantidade);
      
    } else {
      novoSaldo = saldoAtual + dados.quantidade;
      
      // Atualiza acumulador de Reposição (Coluna E -> Index 4 -> ColunaPlanilha 5)
      const qtdRepoAtual = Number(linhaDados[4] || 0);
      sheetEstoque.getRange(linhaEncontrada, 5).setValue(qtdRepoAtual + dados.quantidade);
    }
    
    // Atualiza Saldo Atual (Coluna C -> ColunaPlanilha 3)
    sheetEstoque.getRange(linhaEncontrada, 3).setValue(novoSaldo);
    
    // Opcional: Recalcular se está crítico (lógica simples)
    const estoqueCritico = Number(linhaDados[5] || 0);
    const isCritico = novoSaldo <= estoqueCritico ? 1 : 0;
    // Atualiza coluna G (Está próximo do crítico?) -> ColunaPlanilha 7
    sheetEstoque.getRange(linhaEncontrada, 7).setValue(isCritico);

    // Gravar no Histórico (Append seguro com 6 colunas)
    sheetMov.appendRow([
      timestamp,
      dados.material,
      dados.tipo,
      dados.quantidade,
      dados.usuario || 'App Mobile',
      dados.observacao || '' // Garante a 6ª coluna vazia se não houver obs
    ]);
    
    return { success: true, novoSaldo: novoSaldo, msg: "Movimentação registrada com sucesso!" };

  } catch (e) {
    return { success: false, msg: "Erro ao salvar: " + e.message };
  } finally {
    lock.releaseLock();
  }
}

// --- INTEGRAÇÃO IA (GEMINI) - SERVERSIDE ---
function callGeminiAPI(prompt) {
  // Busca a chave de forma segura
  const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_KEY');
  
  if (!apiKey) return "⚠️ Erro de Configuração: Chave GEMINI_KEY não encontrada nas Propriedades do Script.";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }]
  };

  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const json = JSON.parse(response.getContentText());
    
    if (responseCode !== 200) {
      return `Erro na IA (${responseCode}): ${json.error ? json.error.message : 'Desconhecido'}`;
    }

    if (json.candidates && json.candidates.length > 0) {
      return json.candidates[0].content.parts[0].text;
    } else {
      return "A IA não retornou resposta válida.";
    }
  } catch (e) {
    return "Erro ao conectar com Gemini: " + e.message;
  }
}
