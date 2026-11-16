/* ============================================================
   PAINEL: a base de tudo
   1. confere a sessão (antes de qualquer outra coisa)
   2. carrega os dados das tabelas, uma por uma, sem deixar
      uma tabela com problema derrubar o resto
   3. cuida do menu, das janelas de formulário e dos avisos
   ============================================================ */

/* 1. CONFERE A SESSÃO. Sem sessão, vai pro login. A página só aparece depois disso. */
const sessaoConferida = (async () => {
  const db = window.banco;
  if (!db) {
    document.documentElement.classList.remove("conferindo");
    document.body.innerHTML = '<p style="padding:40px;font-family:Jost,sans-serif">Não foi possível conectar ao banco. Confira a internet e recarregue a página.</p>';
    return null;
  }
  let sessao = null;
  try { sessao = (await db.auth.getSession()).data.session; } catch (e) { sessao = null; }
  if (!sessao) { location.replace("../login/"); return null; }
  return sessao;
})();

const Painel = {
  abas: {},          /* cada arquivo de aba se registra aqui */
  dados: { videos: [], marcas: [], calendario: [], campanhas: [], marcados: new Set(), visitas: [] },
  faltando: {},      /* tabelas que deram problema ao carregar */
  abaAtual: null
};

/* ---------- utilidades ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const dinheiro = (v) => num(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const doisDig = (n) => String(n).padStart(2, "0");
const isoDe = (d) => `${d.getFullYear()}-${doisDig(d.getMonth() + 1)}-${doisDig(d.getDate())}`;
const hojeISO = () => isoDe(new Date());
const dataDeISO = (iso) => { const [a, m, d] = String(iso).slice(0, 10).split("-").map(Number); return new Date(a, (m || 1) - 1, d || 1); };
const diasEntre = (isoA, isoB) => Math.round((dataDeISO(isoB) - dataDeISO(isoA)) / 86400000);
const dataBR = (iso) => { if (!iso) return ""; const [a, m, d] = String(iso).slice(0, 10).split("-"); return `${d}/${m}/${a}`; };
const dataCurta = (iso) => { if (!iso) return ""; const [, m, d] = String(iso).slice(0, 10).split("-"); return `${d}/${m}`; };
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const etiquetaExemplo = (linha) => linha && linha.exemplo ? '<span class="etiqueta-exemplo">exemplo</span>' : "";

const ICONES = {
  mais: '<svg class="svg" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  editar: '<svg class="svg" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>',
  lixo: '<svg class="svg" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  olho: '<svg class="svg" viewBox="0 0 24 24"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  olhoFechado: '<svg class="svg" viewBox="0 0 24 24"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.8M6.6 6.6A17 17 0 0 0 2 12s3.6 7 10 7a9.700 9.700 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>',
  alca: '<svg class="svg" viewBox="0 0 24 24"><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg>',
  baixar: '<svg class="svg" viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  busca: '<svg class="svg" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
  fechar: '<svg class="svg" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  esquerda: '<svg class="svg" viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>',
  direita: '<svg class="svg" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>',
  link: '<svg class="svg" viewBox="0 0 24 24"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>',
  estrela: '<svg class="svg" viewBox="0 0 24 24"><path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z"/></svg>',
  zap: '<svg class="svg" viewBox="0 0 24 24" style="width:12px;height:12px"><path d="M4 20l1.2-4A8 8 0 1 1 8 19Z"/></svg>',
  check: '<svg class="svg" viewBox="0 0 24 24"><path d="m5 12 4.5 4.5L19 7"/></svg>',
  gira: '<svg class="svg gira" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>'
};

/* ---------- avisos e mensagens ---------- */
const NOMES_TABELAS = { videos: "videos", marcas: "marcas", calendario: "calendario", campanhas: "campanhas", marcados: "marcados", visitas: "visitas" };

/* transforma o erro do banco numa frase em português */
function traduzErro(erro, tabela) {
  const msg = String(erro?.message || erro || "");
  const codigo = erro?.code || "";
  if (codigo === "42P01" || codigo === "PGRST205" || /does not exist|could not find the table/i.test(msg) && !/column/i.test(msg))
    return `Falta a tabela "${tabela}" no banco. Rode o arquivo banco.sql no Supabase.`;
  const coluna = msg.match(/'([^']+)' column/i) || msg.match(/column "?([\w.]+)"? (?:of relation \S+ )?does not exist/i);
  if (codigo === "PGRST204" || codigo === "42703" || coluna)
    return `Falta o campo "${coluna ? coluna[1].replace(/^\w+\./, "") : "?"}" na tabela "${tabela}". Rode o arquivo banco.sql no Supabase de novo.`;
  if (codigo === "42501" || /row-level security|permission denied/i.test(msg))
    return `O banco não deixou mexer na tabela "${tabela}". Confira se você entrou com o e-mail certo.`;
  if (codigo === "23514" || /check constraint/i.test(msg))
    return `Algum valor não é aceito pela tabela "${tabela}". Confira as opções escolhidas.`;
  if (/fetch|network|Failed to fetch/i.test(msg)) return "Sem conexão com o banco. Confira a internet.";
  return `Não deu certo na tabela "${tabela}". Tente de novo em instantes.`;
}

function mostraAvisos() {
  const caixa = $("#avisos");
  const itens = Object.entries(Painel.faltando).map(([t, texto]) => `<div class="alerta">${esc(texto)} O resto do painel segue funcionando.</div>`);
  if (Painel.emailEstranho) itens.unshift(`<div class="alerta alerta--erro">Você entrou com ${esc(Painel.email)}, que não é o e-mail do dono do painel. O banco não vai mostrar nem salvar os dados.</div>`);
  caixa.innerHTML = itens.join("");
}

let tempoRecado;
function recado(texto, erro) {
  const r = $("#recado");
  r.textContent = texto;
  r.className = "recado mostra" + (erro ? " recado--erro" : "");
  clearTimeout(tempoRecado);
  tempoRecado = setTimeout(() => r.classList.remove("mostra"), erro ? 5200 : 2600);
}

/* ---------- leitura e escrita no banco ---------- */
async function lerTabela(tabela, monta) {
  try {
    let q = window.banco.from(tabela).select("*");
    if (monta) q = monta(q);
    const { data, error } = await q;
    if (error) throw error;
    delete Painel.faltando[tabela];
    return data || [];
  } catch (erro) {
    Painel.faltando[tabela] = traduzErro(erro, tabela);
    console.warn("[painel]", tabela, erro);
    return null;
  }
}

/* salva uma linha: com id edita, sem id cria. Devolve a linha salva ou null. */
async function salvarLinha(tabela, valores, id) {
  try {
    const consulta = id
      ? window.banco.from(tabela).update(valores).eq("id", id).select().single()
      : window.banco.from(tabela).insert(valores).select().single();
    const { data, error } = await consulta;
    if (error) throw error;
    return { linha: data };
  } catch (erro) {
    console.warn("[painel] salvar", tabela, erro);
    return { erro: traduzErro(erro, tabela) };
  }
}

async function apagarLinha(tabela, id) {
  try {
    const { error } = await window.banco.from(tabela).delete().eq("id", id);
    if (error) throw error;
    return {};
  } catch (erro) {
    return { erro: traduzErro(erro, tabela) };
  }
}

/* troca a linha na lista local depois de salvar */
function atualizaLocal(tabela, linha, idAntigo) {
  const lista = Painel.dados[tabela];
  const i = lista.findIndex(l => l.id === (idAntigo || linha.id));
  if (i >= 0) lista[i] = linha; else lista.push(linha);
}
function removeLocal(tabela, id) {
  Painel.dados[tabela] = Painel.dados[tabela].filter(l => l.id !== id);
}

async function carregaTudo() {
  const quatorze = new Date(); quatorze.setHours(0, 0, 0, 0); quatorze.setDate(quatorze.getDate() - 13);
  const [videos, marcas, calendario, campanhas, marcados, visitas] = await Promise.all([
    lerTabela("videos", q => q.order("ordem", { ascending: true })),
    lerTabela("marcas", q => q.order("criado_em", { ascending: false })),
    lerTabela("calendario", q => q.order("data", { ascending: true })),
    lerTabela("campanhas", q => q.order("criado_em", { ascending: false })),
    lerTabela("marcados"),
    lerTabela("visitas", q => q.gte("data", quatorze.toISOString()).order("data", { ascending: true }).limit(20000))
  ]);
  Painel.dados.videos = videos || [];
  Painel.dados.marcas = marcas || [];
  Painel.dados.calendario = calendario || [];
  Painel.dados.campanhas = campanhas || [];
  Painel.dados.marcados = new Set((marcados || []).map(m => m.chave));
  Painel.dados.visitas = visitas || [];
  mostraAvisos();
}

/* ---------- janela com formulário ----------
   campos: [{ nome, rotulo, tipo: text|email|tel|url|date|number|select|textarea|check, opcoes: [[valor, texto]], dica, inteiro, lista }] */
function abreJanela({ titulo, campos = [], valores = {}, corpo = "", larga, aoSalvar, aoApagar, textoSalvar = "Salvar", semPe }) {
  fechaJanela();
  const fundo = document.createElement("div");
  fundo.className = "janela-fundo";
  fundo.id = "janela";
  const htmlCampos = campos.map(c => {
    const v = valores[c.nome] ?? c.padrao ?? "";
    const id = "campo-" + c.nome;
    const classe = "campo" + (c.inteiro || c.tipo === "textarea" ? " campo--inteiro" : "");
    if (c.tipo === "check")
      return `<label class="campo campo--check campo--inteiro"><input type="checkbox" name="${c.nome}" ${v ? "checked" : ""}> ${esc(c.rotulo)}</label>`;
    let entrada;
    if (c.tipo === "select")
      entrada = `<select id="${id}" name="${c.nome}">${c.opcoes.map(([ov, ot]) => `<option value="${esc(ov)}" ${String(ov) === String(v) ? "selected" : ""}>${esc(ot)}</option>`).join("")}</select>`;
    else if (c.tipo === "textarea")
      entrada = `<textarea id="${id}" name="${c.nome}">${esc(v)}</textarea>`;
    else
      entrada = `<input id="${id}" name="${c.nome}" type="${c.tipo || "text"}" value="${esc(v)}" ${c.tipo === "number" ? 'step="any" min="0"' : ""} ${c.obrigatorio ? "required" : ""} ${c.lista ? `list="lista-${c.nome}"` : ""} ${c.placeholder ? `placeholder="${esc(c.placeholder)}"` : ""}>` +
        (c.lista ? `<datalist id="lista-${c.nome}">${c.lista.map(o => `<option value="${esc(o)}">`).join("")}</datalist>` : "");
    return `<label class="${classe}" for="${id}">${esc(c.rotulo)}${entrada}${c.dica ? `<small>${esc(c.dica)}</small>` : ""}</label>`;
  }).join("");
  fundo.innerHTML = `
    <form class="janela${larga ? " janela--larga" : ""}" role="dialog" aria-modal="true" aria-label="${esc(titulo)}" novalidate>
      <div class="janela-cabeca"><h3>${esc(titulo)}</h3><button type="button" class="icone-btn" data-fecha aria-label="Fechar">${ICONES.fechar}</button></div>
      <div class="janela-corpo"><p class="erro-janela" hidden></p>${corpo}${campos.length ? `<div class="campos">${htmlCampos}</div>` : ""}</div>
      ${semPe ? "" : `<div class="janela-pe">
        ${aoApagar ? `<button type="button" class="btn btn--perigo" data-apaga>${ICONES.lixo}Apagar</button>` : ""}
        <div class="direita"><button type="button" class="btn" data-fecha>Cancelar</button>${aoSalvar ? `<button type="submit" class="btn btn--principal">${esc(textoSalvar)}</button>` : ""}</div>
      </div>`}
    </form>`;
  document.body.appendChild(fundo);
  const form = $("form", fundo);
  const erroBox = $(".erro-janela", fundo);
  const mostraErro = (t) => { erroBox.textContent = t; erroBox.hidden = !t; if (t) erroBox.scrollIntoView({ block: "nearest" }); };
  fundo.addEventListener("mousedown", (e) => { if (e.target === fundo) fechaJanela(); });
  $$("[data-fecha]", fundo).forEach(b => b.addEventListener("click", fechaJanela));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!aoSalvar) return;
    const lidos = {};
    campos.forEach(c => {
      const el = form.elements[c.nome];
      if (!el) return;
      if (c.tipo === "check") lidos[c.nome] = el.checked;
      else if (c.tipo === "number") lidos[c.nome] = el.value === "" ? 0 : num(String(el.value).replace(",", "."));
      else if (c.tipo === "date") lidos[c.nome] = el.value || null;
      else lidos[c.nome] = el.value.trim();
    });
    const falta = campos.find(c => c.obrigatorio && !lidos[c.nome]);
    if (falta) { mostraErro(`Preencha: ${falta.rotulo}.`); form.elements[falta.nome]?.focus(); return; }
    const botao = $("button[type=submit]", form);
    botao.disabled = true;
    const erro = await aoSalvar(lidos);
    botao.disabled = false;
    if (erro) mostraErro(erro); else fechaJanela();
  });
  const apaga = $("[data-apaga]", fundo);
  if (apaga) {
    let confirmando = false;
    apaga.addEventListener("click", async () => {
      if (!confirmando) {
        confirmando = true;
        apaga.innerHTML = `${ICONES.lixo}Clique de novo pra apagar`;
        setTimeout(() => { confirmando = false; if (apaga.isConnected) apaga.innerHTML = `${ICONES.lixo}Apagar`; }, 3500);
        return;
      }
      apaga.disabled = true;
      const erro = await aoApagar();
      apaga.disabled = false;
      if (erro) mostraErro(erro); else fechaJanela();
    });
  }
  const primeiro = $("input:not([type=checkbox]),select,textarea", form);
  setTimeout(() => (primeiro || $("[data-fecha]", fundo)).focus(), 30);
  return fundo;
}
function fechaJanela() { $("#janela")?.remove(); }
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { if ($("#janela")) fechaJanela(); else document.body.classList.remove("menu-aberto"); }
});

/* ---------- planilha CSV que abre certinho no Excel (com acento) ---------- */
function baixaCSV(nomeArquivo, cabecalhos, linhas) {
  const cel = (v) => { const s = String(v ?? ""); return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const texto = "﻿" + [cabecalhos, ...linhas].map(l => l.map(cel).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob([texto], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: nomeArquivo });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------- ordenação de tabelas ---------- */
function cabecalhoOrdenavel(colunas, estado) {
  return colunas.map(c => {
    if (!c.chave) return `<th class="${c.classe || ""}">${c.rotulo}</th>`;
    const ativo = estado.coluna === c.chave;
    const seta = ativo ? (estado.sobe ? "▲" : "▼") : "↕";
    return `<th class="ordena ${ativo ? "ativo" : ""} ${c.classe || ""}" data-ordena="${c.chave}" aria-sort="${ativo ? (estado.sobe ? "ascending" : "descending") : "none"}">${c.rotulo}<span class="seta" aria-hidden="true">${seta}</span></th>`;
  }).join("");
}
function ligaOrdenacao(raiz, estado, redesenha) {
  $$("th[data-ordena]", raiz).forEach(th => th.addEventListener("click", () => {
    const c = th.dataset.ordena;
    if (estado.coluna === c) estado.sobe = !estado.sobe; else { estado.coluna = c; estado.sobe = true; }
    redesenha();
  }));
}
function comparador(valorDe, sobe) {
  return (a, b) => {
    const va = valorDe(a), vb = valorDe(b);
    const vazioA = va === null || va === undefined || va === "", vazioB = vb === null || vb === undefined || vb === "";
    if (vazioA && vazioB) return 0;
    if (vazioA) return 1;            /* vazios sempre no fim */
    if (vazioB) return -1;
    const r = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "pt-BR", { sensitivity: "base", numeric: true });
    return sobe ? r : -r;
  };
}

/* ---------- navegação entre abas ---------- */
function abreAba(nome) {
  if (!Painel.abas[nome]) nome = "portfolio";
  Painel.abaAtual = nome;
  $$(".menu-item").forEach(a => a.classList.toggle("ativo", a.dataset.aba === nome));
  $$("main section[data-aba]").forEach(s => { s.hidden = s.dataset.aba !== nome; });
  $("#titulo-aba").textContent = Painel.abas[nome].titulo;
  document.title = Painel.abas[nome].titulo + " · Painel Rodrigo Press";
  $("#acoes-topo").innerHTML = "";
  document.body.classList.remove("menu-aberto");
  desenhaAba(nome);
}
/* desenha a aba sem deixar um erro de uma aba quebrar o painel */
function desenhaAba(nome = Painel.abaAtual) {
  const secao = $("#aba-" + nome);
  try { Painel.abas[nome].desenha(secao); }
  catch (e) {
    console.error("[painel] aba", nome, e);
    secao.innerHTML = `<div class="alerta alerta--erro">Esta aba teve um problema pra abrir. As outras abas seguem funcionando. Recarregue a página e, se continuar, confira se o banco.sql foi rodado.</div>`;
  }
}

/* ---------- começa ---------- */
(async () => {
  const sessao = await sessaoConferida;
  if (!sessao) return;
  /* espera os outros arquivos do painel terminarem de carregar */
  if (document.readyState === "loading") await new Promise(r => document.addEventListener("DOMContentLoaded", r));

  Painel.email = sessao.user?.email || "";
  Painel.emailEstranho = window.EMAIL_DONO && Painel.email.toLowerCase() !== window.EMAIL_DONO.toLowerCase();
  $("#meu-email").textContent = Painel.email;
  /* as suas próprias visitas ao portfólio não entram nas métricas */
  try { localStorage.setItem("naoContarVisita", "1"); } catch (e) {}

  $("#sair").addEventListener("click", async () => {
    try { await window.banco.auth.signOut(); } catch (e) {}
    location.replace("../login/");
  });
  window.banco.auth.onAuthStateChange((evento, s) => { if (evento === "SIGNED_OUT" || !s) location.replace("../login/"); });
  $("#abre-menu").addEventListener("click", () => document.body.classList.add("menu-aberto"));
  $("#menu-fundo").addEventListener("click", () => document.body.classList.remove("menu-aberto"));
  window.addEventListener("hashchange", () => abreAba(location.hash.slice(1)));

  /* mostra o painel já com a aba aberta e um "carregando", e busca os dados */
  const inicial = location.hash.slice(1);
  $$("main section[data-aba]").forEach(s => { s.innerHTML = '<div class="cartao vazio">Carregando...</div>'; });
  $("#titulo-aba").textContent = (Painel.abas[inicial] || Painel.abas.portfolio).titulo;
  $$(".menu-item").forEach(a => a.classList.toggle("ativo", a.dataset.aba === (Painel.abas[inicial] ? inicial : "portfolio")));
  $("#aba-" + (Painel.abas[inicial] ? inicial : "portfolio")).hidden = false;
  document.documentElement.classList.remove("conferindo");

  await carregaTudo();
  abreAba(inicial);
})();
