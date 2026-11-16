/* ============================================================
   MINHA ROTINA: abas Calendário e Campanhas
   ============================================================ */

/* cores de cada tipo no calendário */
const TIPOS_CAL = {
  gravar: { nome: "Gravar", cor: "#4f5a2c", fundo: "#e3e8d2" },
  editar: { nome: "Editar", cor: "#3f6683", fundo: "#e3ecf2" },
  postar: { nome: "Postar", cor: "#7a4a6b", fundo: "#f0e3ec" },
  prazo:  { nome: "Prazo de campanha", cor: "#8a3a26", fundo: "#f6e3df" }
};
const STATUS_FUNIL = ["Briefing", "Roteiro", "Aprovação Roteiro", "Gravação", "Edição", "Aprovado", "Entregue"];
const COR_STATUS = {
  "Briefing": ["#5d625c", "#ebebe7"],
  "Roteiro": ["#3f6683", "#e3ecf2"],
  "Aprovação Roteiro": ["#6a4f86", "#ece6f3"],
  "Gravação": ["#8a6a12", "#f7edcf"],
  "Edição": ["#9a5326", "#f6e6d9"],
  "Aprovado": ["#2f6b5a", "#dcefe8"],
  "Entregue": ["#4f5a2c", "#e3e8d2"]
};
const COR_TIPO_CAMP = { "Conteúdo": ["#3f6683", "#e3ecf2"], "Publicidade": ["#7a4a6b", "#f0e3ec"] };
const pilula = (texto, cores, semPonto) => `<span class="pilula${semPonto ? " pilula--sem-ponto" : ""}" style="color:${(cores || [])[0] || "#5d625c"};background:${(cores || [])[1] || "#ebebe7"}">${esc(texto)}</span>`;
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/* ---------------- CALENDÁRIO ---------------- */
const estadoCal = { ano: new Date().getFullYear(), mes: new Date().getMonth(), filtro: "" };

/* junta os itens do calendário com os prazos das campanhas (sem digitar duas vezes) */
function itensDoCalendario() {
  const itens = Painel.dados.calendario.map(c => ({ ...c, origem: "calendario", dataISO: String(c.data || "").slice(0, 10) }));
  Painel.dados.campanhas.forEach(c => {
    if (!c.prazo) return;
    itens.push({ id: "camp-" + c.id, campanhaId: c.id, origem: "campanha", tipo: "prazo", dataISO: String(c.prazo).slice(0, 10),
      titulo: "Prazo: " + (c.campanha || "campanha"), marca: c.cliente, status: c.status === "Entregue" ? "feito" : "a fazer", exemplo: c.exemplo });
  });
  return itens.filter(i => i.dataISO && (!estadoCal.filtro || i.tipo === estadoCal.filtro));
}

Painel.abas.calendario = {
  titulo: "Calendário",
  desenha(secao) {
    const { ano, mes } = estadoCal;
    const hoje = hojeISO();
    const itens = itensDoCalendario();
    const porDia = {};
    itens.forEach(i => { (porDia[i.dataISO] = porDia[i.dataISO] || []).push(i); });
    Object.values(porDia).forEach(l => l.sort((a, b) => (a.status === "feito") - (b.status === "feito")));

    /* grade de segunda a domingo, com os dias do mês anterior e do seguinte nas pontas */
    const primeiro = new Date(ano, mes, 1);
    const recuo = (primeiro.getDay() + 6) % 7;
    const inicio = new Date(ano, mes, 1 - recuo);
    const ultimo = new Date(ano, mes + 1, 0);
    const totalCelulas = Math.ceil((recuo + ultimo.getDate()) / 7) * 7;
    let celulas = "";
    for (let i = 0; i < totalCelulas; i++) {
      const d = new Date(inicio); d.setDate(inicio.getDate() + i);
      const iso = isoDe(d);
      const doDia = porDia[iso] || [];
      const visiveis = doDia.slice(0, 3);
      celulas += `<div class="cal-dia${d.getMonth() !== mes ? " fora" : ""}${iso === hoje ? " hoje" : ""}" data-dia="${iso}" role="button" tabindex="0" aria-label="${d.getDate()} de ${MESES[d.getMonth()]}${doDia.length ? `, ${plural(doDia.length, "item", "itens")}` : ""}">
        <span class="cal-num">${d.getDate()}</span>
        <button class="cal-mais-dia" type="button" data-add="${iso}" aria-label="Adicionar no dia ${dataBR(iso)}">${ICONES.mais}</button>
        <div class="cal-itens">
          ${visiveis.map(it => `<button class="cal-item${it.status === "feito" ? " feito" : ""}" type="button" data-item="${esc(it.id)}" style="--cor:${TIPOS_CAL[it.tipo]?.cor};--cor-fundo:${TIPOS_CAL[it.tipo]?.fundo}" title="${esc(it.titulo)}${it.marca ? " · " + esc(it.marca) : ""}"><span>${esc(it.titulo)}</span></button>`).join("")}
          ${doDia.length > 3 ? `<button class="cal-ver-mais" type="button" data-ver="${iso}">+${doDia.length - 3} mais</button>` : ""}
        </div>
      </div>`;
    }

    /* o que ficou pra trás: passou do dia e não foi feito */
    const atrasados = itensDoCalendario().filter(i => i.dataISO < hoje && i.status !== "feito").sort((a, b) => a.dataISO.localeCompare(b.dataISO));

    secao.innerHTML = `
      <div class="cartao" style="margin-bottom:16px">
        <div class="cal-topo">
          <button class="icone-btn" type="button" data-mes="-1" aria-label="Mês anterior">${ICONES.esquerda}</button>
          <span class="cal-mes">${MESES[mes][0].toUpperCase() + MESES[mes].slice(1)} de ${ano}</span>
          <button class="icone-btn" type="button" data-mes="1" aria-label="Próximo mês">${ICONES.direita}</button>
          <button class="btn" type="button" data-este-mes>Este mês</button>
          <div class="chips" role="group" aria-label="Filtrar por tipo" style="margin-left:auto">
            <button class="chip ${estadoCal.filtro ? "" : "ativo"}" type="button" data-filtro="">Tudo</button>
            ${Object.entries(TIPOS_CAL).map(([k, t]) => `<button class="chip ${estadoCal.filtro === k ? "ativo" : ""}" type="button" data-filtro="${k}">${k === "prazo" ? "Prazos" : t.nome}</button>`).join("")}
          </div>
          <button class="btn btn--principal" type="button" data-add="${hoje}">${ICONES.mais}Adicionar</button>
        </div>
        <div class="cal-semana">${["seg", "ter", "qua", "qui", "sex", "sáb", "dom"].map(d => `<span>${d}</span>`).join("")}</div>
        <div class="cal-grade">${celulas}</div>
        <div class="legenda-cal">${Object.values(TIPOS_CAL).map(t => `<span><i style="background:${t.cor}"></i>${t.nome}</span>`).join("")}</div>
      </div>
      <div class="cartao">
        <div class="cartao-cabeca"><h2>Ficou pra trás</h2><span class="dica">passou do dia e não foi feito</span></div>
        ${atrasados.length ? `<ul class="atrasados">${atrasados.map(i => {
          const dias = diasEntre(i.dataISO, hoje);
          return `<li>
            <span class="texto">${esc(i.titulo)}${etiquetaExemplo(i)}<small>${esc(TIPOS_CAL[i.tipo]?.nome || i.tipo)}${i.marca ? " · " + esc(i.marca) : ""} · era pra ${dataBR(i.dataISO)}</small></span>
            <span class="aviso-prazo aviso-prazo--atrasado">há ${plural(dias, "dia", "dias")}</span>
            ${i.origem === "calendario" ? `<button class="btn" type="button" data-feito="${esc(i.id)}">${ICONES.check}Marcar feito</button>` : `<button class="btn" type="button" data-item="${esc(i.id)}">Abrir campanha</button>`}
          </li>`;
        }).join("")}</ul>` : `<div class="vazio">Nada atrasado. Tudo em dia.</div>`}
      </div>`;

    $$("[data-mes]", secao).forEach(b => b.addEventListener("click", () => {
      const d = new Date(estadoCal.ano, estadoCal.mes + Number(b.dataset.mes), 1);
      estadoCal.ano = d.getFullYear(); estadoCal.mes = d.getMonth(); desenhaAba();
    }));
    $("[data-este-mes]", secao).addEventListener("click", () => { const d = new Date(); estadoCal.ano = d.getFullYear(); estadoCal.mes = d.getMonth(); desenhaAba(); });
    $$("[data-filtro]", secao).forEach(b => b.addEventListener("click", () => { estadoCal.filtro = b.dataset.filtro; desenhaAba(); }));
    $$("[data-add]", secao).forEach(b => b.addEventListener("click", (e) => { e.stopPropagation(); formCalendario(null, b.dataset.add); }));
    $$("[data-ver]", secao).forEach(b => b.addEventListener("click", (e) => { e.stopPropagation(); janelaDoDia(b.dataset.ver); }));
    $$("[data-item]", secao).forEach(b => b.addEventListener("click", (e) => { e.stopPropagation(); abreItem(b.dataset.item); }));
    $$("[data-feito]", secao).forEach(b => b.addEventListener("click", () => marcaFeito(b.dataset.feito, true)));
    $$(".cal-dia", secao).forEach(c => {
      /* no celular bem estreito os itens viram tracinhos: tocar no dia abre a lista do dia */
      const abre = () => (window.innerWidth <= 480 && (porDia[c.dataset.dia] || []).length) ? janelaDoDia(c.dataset.dia) : formCalendario(null, c.dataset.dia);
      c.addEventListener("click", abre);
      c.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target === c) abre(); });
    });
  }
};

function abreItem(id) {
  if (String(id).startsWith("camp-")) {
    const c = Painel.dados.campanhas.find(x => "camp-" + x.id === id);
    if (c) formCampanha(c);
    return;
  }
  const it = Painel.dados.calendario.find(x => x.id === id);
  if (it) formCalendario(it);
}

function janelaDoDia(iso) {
  const itens = itensDoCalendario().filter(i => i.dataISO === iso);
  const d = dataDeISO(iso);
  const j = abreJanela({
    titulo: `${d.getDate()} de ${MESES[d.getMonth()]}`,
    semPe: true,
    corpo: `<ul class="lista-dia">${itens.map(i => `<li>
        ${i.origem === "calendario" ? `<input type="checkbox" data-marca="${esc(i.id)}" ${i.status === "feito" ? "checked" : ""} aria-label="Feito" style="width:16px;height:16px;accent-color:var(--oliva)">` : `<span style="width:16px"></span>`}
        <span class="texto">${esc(i.titulo)}${etiquetaExemplo(i)}<small>${esc(TIPOS_CAL[i.tipo]?.nome || i.tipo)}${i.marca ? " · " + esc(i.marca) : ""}</small></span>
        <button class="icone-btn" type="button" data-abre="${esc(i.id)}" aria-label="Editar">${ICONES.editar}</button>
      </li>`).join("")}</ul>
      <div style="margin-top:12px"><button class="btn btn--principal" type="button" data-novo-dia>${ICONES.mais}Adicionar neste dia</button></div>`
  });
  $$("[data-marca]", j).forEach(c => c.addEventListener("change", () => marcaFeito(c.dataset.marca, c.checked, true)));
  $$("[data-abre]", j).forEach(b => b.addEventListener("click", () => abreItem(b.dataset.abre)));
  $("[data-novo-dia]", j).addEventListener("click", () => formCalendario(null, iso));
}

async function marcaFeito(id, feito, manterJanela) {
  const r = await salvarLinha("calendario", { status: feito ? "feito" : "a fazer" }, id);
  if (r.erro) { recado(r.erro, true); return; }
  atualizaLocal("calendario", r.linha);
  recado(feito ? "Marcado como feito." : "Voltou pra a fazer.");
  if (!manterJanela) fechaJanela();
  desenhaAba();
}

function formCalendario(it, dataPronta) {
  abreJanela({
    titulo: it ? "Editar item" : "Novo item no calendário",
    valores: it || { data: dataPronta || hojeISO(), tipo: "gravar", status: "a fazer" },
    campos: [
      { nome: "titulo", rotulo: "O que fazer", obrigatorio: true, inteiro: true, placeholder: "ex: Gravar vídeo do tênis" },
      { nome: "marca", rotulo: "Marca", lista: [...new Set([...Painel.dados.marcas.map(m => m.nome), ...Painel.dados.campanhas.map(c => c.cliente)].filter(Boolean))] },
      { nome: "data", rotulo: "Data", tipo: "date", obrigatorio: true },
      { nome: "tipo", rotulo: "Tipo", tipo: "select", opcoes: [["gravar", "Gravar"], ["editar", "Editar"], ["postar", "Postar"]] },
      { nome: "status", rotulo: "Status", tipo: "select", opcoes: [["a fazer", "A fazer"], ["feito", "Feito"]] }
    ],
    async aoSalvar(dados) {
      const r = await salvarLinha("calendario", dados, it?.id);
      if (r.erro) return r.erro;
      atualizaLocal("calendario", r.linha, it?.id);
      recado(it ? "Item atualizado." : "Item adicionado ao calendário.");
      desenhaAba();
    },
    aoApagar: it ? async () => {
      const r = await apagarLinha("calendario", it.id);
      if (r.erro) return r.erro;
      removeLocal("calendario", it.id);
      recado("Item apagado.");
      desenhaAba();
    } : null
  });
}

/* ---------------- CAMPANHAS ---------------- */
const estadoCamp = { filtro: "todas", busca: "", coluna: "prazo", sobe: true };

const COLUNAS_CAMP = [
  { chave: "favorita", rotulo: "★", valor: c => c.favorita ? 0 : 1 },
  { chave: "campanha", rotulo: "Campanha", valor: c => c.campanha },
  { chave: "cliente", rotulo: "Cliente", valor: c => c.cliente },
  { chave: "tipo", rotulo: "Tipo", valor: c => c.tipo },
  { chave: "status", rotulo: "Status", valor: c => { const i = STATUS_FUNIL.indexOf(c.status); return i < 0 ? 99 : i; } },
  { chave: "qtd", rotulo: "Qtd", classe: "num", valor: c => num(c.qtd) },
  { chave: "valor", rotulo: "Valor", classe: "num", valor: c => num(c.valor) },
  { chave: "prazo", rotulo: "Prazo", valor: c => c.prazo || "" },
  { chave: "pagamento", rotulo: "Pagamento", valor: c => c.pagamento === "pago" ? 1 : 0 }
];

function avisoPrazo(c) {
  if (!c.prazo || c.status === "Entregue") return "";
  const dias = diasEntre(hojeISO(), String(c.prazo).slice(0, 10));
  if (dias < 0) return `<span class="aviso-prazo aviso-prazo--atrasado">atrasada há ${plural(-dias, "dia", "dias")}</span>`;
  if (dias === 0) return `<span class="aviso-prazo aviso-prazo--perto">vence hoje</span>`;
  if (dias <= 3) return `<span class="aviso-prazo aviso-prazo--perto">vence em ${plural(dias, "dia", "dias")}</span>`;
  return "";
}

Painel.abas.campanhas = {
  titulo: "Campanhas",
  desenha(secao) {
    const todas = Painel.dados.campanhas;
    const ativas = todas.filter(c => c.ativa).length;
    const valorTotal = todas.reduce((s, c) => s + num(c.valor), 0);
    const totalVideos = todas.reduce((s, c) => s + num(c.qtd), 0);
    const ticket = totalVideos > 0 ? valorTotal / totalVideos : 0;
    const aReceber = todas.filter(c => c.pagamento !== "pago").reduce((s, c) => s + num(c.valor), 0);
    const recebido = todas.filter(c => c.pagamento === "pago").reduce((s, c) => s + num(c.valor), 0);

    secao.innerHTML = `
      <div class="faixa">
        <div><span>Campanhas</span><strong>${todas.length}</strong></div>
        <div><span>Ativas</span><strong>${ativas}</strong></div>
        <div><span>Valor total</span><strong>${dinheiro(valorTotal)}</strong><small>ticket médio por vídeo: ${dinheiro(ticket)}</small></div>
        <div><span>A receber</span><strong>${dinheiro(aReceber)}</strong><small>já recebido: ${dinheiro(recebido)}</small></div>
      </div>
      <div class="cartao">
        <div class="ferramentas">
          <div class="chips" role="group" aria-label="Filtrar campanhas">
            ${[["todas", "Todas"], ["ativas", "Ativas"], ["finalizadas", "Finalizadas"]].map(([k, t]) => `<button class="chip ${estadoCamp.filtro === k ? "ativo" : ""}" type="button" data-fc="${k}">${t}</button>`).join("")}
          </div>
          <label class="busca">${ICONES.busca}<input type="search" placeholder="Buscar campanha ou cliente" value="${esc(estadoCamp.busca)}" aria-label="Buscar campanhas"></label>
          <div style="margin-left:auto;display:flex;gap:8px">
            <button class="btn" type="button" data-csv>${ICONES.baixar}Baixar</button>
            <button class="btn btn--principal" type="button" data-nova>${ICONES.mais}Adicionar</button>
          </div>
        </div>
        <div class="rola" id="tabela-camp"></div>
      </div>`;
    $$("[data-fc]", secao).forEach(b => b.addEventListener("click", () => {
      estadoCamp.filtro = b.dataset.fc;
      $$("[data-fc]", secao).forEach(x => x.classList.toggle("ativo", x === b));
      desenhaTabelaCamp();
    }));
    const busca = $(".busca input", secao);
    busca.addEventListener("input", () => { estadoCamp.busca = busca.value; desenhaTabelaCamp(); });
    $("[data-nova]", secao).addEventListener("click", () => formCampanha());
    $("[data-csv]", secao).addEventListener("click", () => {
      baixaCSV(`campanhas-${hojeISO()}.csv`,
        ["Favorita", "Campanha", "Cliente", "Tipo", "Status", "Qtd", "Valor", "Prazo", "Pagamento", "Ativa"],
        campanhasFiltradas().map(c => [c.favorita ? "sim" : "", c.campanha, c.cliente, c.tipo, c.status, num(c.qtd), num(c.valor).toFixed(2).replace(".", ","), dataBR(c.prazo), c.pagamento === "pago" ? "Pago" : "Pendente", c.ativa ? "sim" : "não"]));
    });
    desenhaTabelaCamp();
  }
};

function campanhasFiltradas() {
  const t = estadoCamp.busca.trim().toLowerCase();
  const col = COLUNAS_CAMP.find(c => c.chave === estadoCamp.coluna) || COLUNAS_CAMP[7];
  return Painel.dados.campanhas
    .filter(c => estadoCamp.filtro === "todas" || (estadoCamp.filtro === "ativas" ? c.ativa : !c.ativa))
    .filter(c => !t || [c.campanha, c.cliente].some(x => String(x || "").toLowerCase().includes(t)))
    .sort(comparador(col.valor, estadoCamp.sobe));
}

function desenhaTabelaCamp() {
  const caixa = $("#tabela-camp");
  if (!caixa) return;
  if (!Painel.dados.campanhas.length) { caixa.innerHTML = `<div class="vazio">Nenhuma campanha ainda. Clique em "Adicionar" pra registrar a primeira.</div>`; return; }
  const lista = campanhasFiltradas();
  caixa.innerHTML = `<table>
    <thead><tr>${cabecalhoOrdenavel(COLUNAS_CAMP, estadoCamp)}</tr></thead>
    <tbody>${lista.length ? lista.map(c => `
      <tr class="clicavel${c.favorita ? " favorita" : ""}" data-id="${esc(c.id)}" tabindex="0">
        <td><button class="estrela${c.favorita ? " ligada" : ""}" type="button" data-estrela aria-label="${c.favorita ? "Tirar destaque" : "Destacar"}" aria-pressed="${!!c.favorita}">${ICONES.estrela}</button></td>
        <td>${esc(c.campanha)}${etiquetaExemplo(c)}${c.ativa ? "" : ' <span class="etiqueta-exemplo" style="border-style:solid">finalizada</span>'}</td>
        <td>${esc(c.cliente)}</td>
        <td>${c.tipo ? pilula(c.tipo, COR_TIPO_CAMP[c.tipo], true) : ""}</td>
        <td>${c.status ? pilula(c.status, COR_STATUS[c.status]) : ""}</td>
        <td class="num">${num(c.qtd)}</td>
        <td class="num" style="white-space:nowrap">${dinheiro(c.valor)}</td>
        <td><span class="prazo"><span style="white-space:nowrap">${dataBR(c.prazo)}</span>${avisoPrazo(c)}</span></td>
        <td>${c.pagamento === "pago" ? pilula("Pago", ["#4f5a2c", "#e3e8d2"]) : pilula("Pendente", ["#8a6a12", "#f7edcf"])}</td>
      </tr>`).join("") : `<tr><td colspan="9" class="vazio">Nenhuma campanha com esse filtro.</td></tr>`}</tbody></table>`;
  ligaOrdenacao(caixa, estadoCamp, desenhaTabelaCamp);
  $$("tr[data-id]", caixa).forEach(tr => {
    const c = Painel.dados.campanhas.find(x => x.id === tr.dataset.id);
    tr.addEventListener("click", (e) => { if (!e.target.closest("[data-estrela]")) formCampanha(c); });
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target === tr) formCampanha(c); });
    $("[data-estrela]", tr).addEventListener("click", async () => {
      const r = await salvarLinha("campanhas", { favorita: !c.favorita }, c.id);
      if (r.erro) { recado(r.erro, true); return; }
      atualizaLocal("campanhas", r.linha);
      desenhaTabelaCamp();
    });
  });
}

function formCampanha(c) {
  abreJanela({
    titulo: c ? "Editar campanha" : "Nova campanha",
    valores: c || { tipo: "Conteúdo", status: "Briefing", qtd: 1, valor: 0, pagamento: "pendente", ativa: true },
    campos: [
      { nome: "campanha", rotulo: "Campanha", obrigatorio: true, inteiro: true },
      { nome: "cliente", rotulo: "Cliente", lista: [...new Set(Painel.dados.marcas.map(m => m.nome).filter(Boolean))] },
      { nome: "tipo", rotulo: "Tipo", tipo: "select", opcoes: [["Conteúdo", "Conteúdo"], ["Publicidade", "Publicidade"]] },
      { nome: "status", rotulo: "Status", tipo: "select", opcoes: STATUS_FUNIL.map(s => [s, s]) },
      { nome: "prazo", rotulo: "Prazo", tipo: "date", dica: "Aparece sozinho no calendário." },
      { nome: "qtd", rotulo: "Quantidade de vídeos", tipo: "number" },
      { nome: "valor", rotulo: "Valor total (R$)", tipo: "number" },
      { nome: "pagamento", rotulo: "Pagamento", tipo: "select", opcoes: [["pendente", "Pendente"], ["pago", "Pago"]] },
      { nome: "ativa", rotulo: "Campanha ativa (desmarque quando finalizar)", tipo: "check" },
      { nome: "favorita", rotulo: "Destacar com estrela", tipo: "check" }
    ],
    async aoSalvar(dados) {
      dados.qtd = Math.max(0, Math.round(num(dados.qtd)));
      const r = await salvarLinha("campanhas", dados, c?.id);
      if (r.erro) return r.erro;
      if (c) atualizaLocal("campanhas", r.linha, c.id); else Painel.dados.campanhas.unshift(r.linha);
      recado(c ? "Campanha atualizada." : "Campanha adicionada.");
      desenhaAba();
    },
    aoApagar: c ? async () => {
      const r = await apagarLinha("campanhas", c.id);
      if (r.erro) return r.erro;
      removeLocal("campanhas", c.id);
      recado("Campanha apagada.");
      desenhaAba();
    } : null
  });
}
