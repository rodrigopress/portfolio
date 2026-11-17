/* ============================================================
   MEU SITE: abas Portfólio e Marcas
   ============================================================ */

/* As quatro categorias do portfólio (iguais às do site) */
const NICHOS = [["moda", "Moda"], ["financas", "Finanças, apps e tecnologia"], ["fitness", "Fitness"], ["casal", "Casal"], ["gastronomia", "Gastronomia e casa"]];
const APELIDOS_NICHO = { negocios: "financas", lifestyle: "gastronomia" }; /* nomes antigos */
const nomeNicho = (n) => (NICHOS.find(x => x[0] === (APELIDOS_NICHO[n] || n)) || [n, n || "Sem nicho"])[1];

/* ---------------- PORTFÓLIO ---------------- */
Painel.abas.portfolio = {
  titulo: "Portfólio",
  desenha(secao) {
    const { videos, visitas } = Painel.dados;
    const hoje = hojeISO();

    /* visitas por dia nos últimos 14 dias */
    const dias = [];
    for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); dias.push(isoDe(d)); }
    const porDia = Object.fromEntries(dias.map(d => [d, 0]));
    const porOrigem = {};
    visitas.forEach(v => {
      const dia = v.data ? isoDe(new Date(v.data)) : "";
      if (dia in porDia) porDia[dia]++;
      const o = v.origem || "Direto";
      porOrigem[o] = (porOrigem[o] || 0) + 1;
    });
    const total14 = dias.reduce((s, d) => s + porDia[d], 0);
    const totalHoje = porDia[hoje] || 0;
    const origens = Object.entries(porOrigem).sort((a, b) => b[1] - a[1]);

    /* vídeos no ar e nicho mais forte (o que tem mais vídeos visíveis) */
    const noAr = videos.filter(v => v.visivel && !v.exemplo);
    const contaNicho = {};
    noAr.forEach(v => { contaNicho[v.nicho] = (contaNicho[v.nicho] || 0) + 1; });
    const forte = Object.entries(contaNicho).sort((a, b) => b[1] - a[1])[0];

    const maxDia = Math.max(0, ...dias.map(d => porDia[d]));
    const grafico = total14 === 0
      ? `<div class="frase-vazia">Quando as pessoas começarem a visitar o seu portfólio, aqui aparece uma barra pra cada um dos últimos 14 dias, mostrando quantas visitas chegaram em cada dia.</div>`
      : `<span class="grafico-max">máximo: ${maxDia}</span>
         <div class="barras" role="img" aria-label="Visitas por dia nos últimos 14 dias">
           ${dias.map(d => {
             const n = porDia[d], altura = maxDia ? Math.round((n / maxDia) * 100) : 0;
             return `<div class="barra${d === hoje ? " hoje" : ""}"><i style="height:${n ? Math.max(altura, 2) : 0}%"></i><span class="dica-barra">${dataCurta(d)}: ${plural(n, "visita", "visitas")}</span></div>`;
           }).join("")}
         </div>
         <div class="eixo">${dias.map((d, i) => `<span>${i % 2 === 1 || i === 13 ? dataCurta(d) : ""}</span>`).join("")}</div>`;

    const listaOrigens = total14 === 0
      ? `<div class="vazio">Aqui vai aparecer de onde as pessoas chegam: Instagram, Google, WhatsApp ou direto pelo endereço.</div>`
      : `<ul class="origens">${origens.map(([o, n]) => {
          const pct = Math.round((n / total14) * 100);
          return `<li><span>${esc(o)}</span><em>${n} · ${pct}%</em><span class="trilho"><i style="width:${pct}%"></i></span></li>`;
        }).join("")}</ul>`;

    secao.innerHTML = `
      <div class="faixa">
        <div><span>Visitas em 14 dias</span><strong>${total14}</strong></div>
        <div><span>Visitas hoje</span><strong>${totalHoje}</strong></div>
        <div><span>Vídeos no ar</span><strong>${noAr.length}</strong></div>
        <div><span>Nicho mais forte</span><strong>${forte ? esc(nomeNicho(forte[0])) : "Nenhum ainda"}</strong>${forte ? `<small>${plural(forte[1], "vídeo", "vídeos")}</small>` : ""}</div>
        <div><span>De onde mais vêm</span><strong>${origens[0] ? esc(origens[0][0]) : "Nenhuma visita ainda"}</strong>${origens[0] ? `<small>${Math.round(origens[0][1] / total14 * 100)}% das visitas</small>` : ""}</div>
      </div>
      <div class="grade-2">
        <div class="cartao"><div class="cartao-cabeca"><h2>Visitas nos últimos 14 dias</h2></div><div class="grafico">${grafico}</div></div>
        <div class="cartao"><div class="cartao-cabeca"><h2>Por onde chegaram</h2><span class="dica">últimos 14 dias</span></div>${listaOrigens}</div>
      </div>
      <div class="cartao">
        <div class="cartao-cabeca">
          <h2>Meus vídeos</h2>
          <span class="dica">Arraste pela alça pra mudar a ordem. Os visíveis entram no fim da linha do nicho, depois dos vídeos que já estão no site.</span>
          <div class="acoes"><button class="btn btn--principal" type="button" data-novo-video>${ICONES.mais}Adicionar vídeo</button></div>
        </div>
        <div class="rola">${tabelaVideos(videos)}</div>
      </div>`;

    $("[data-novo-video]", secao).addEventListener("click", () => formVideo());
    $$("tbody tr[data-id]", secao).forEach(tr => {
      const v = videos.find(x => x.id === tr.dataset.id);
      $("[data-editar]", tr).addEventListener("click", () => formVideo(v));
      $("[data-olho]", tr).addEventListener("click", () => alternaVisivel(v));
      ligaArrasto($(".alca", tr), tr);
    });
  }
};

function tabelaVideos(videos) {
  if (!videos.length) return `<div class="vazio">Nenhum vídeo ainda. Clique em "Adicionar vídeo" pra colocar o primeiro no site.</div>`;
  return `<table>
    <thead><tr><th style="width:34px"></th><th>Título</th><th>Nicho</th><th>Formato</th><th>Marca</th><th>Destaque</th><th style="width:112px"></th></tr></thead>
    <tbody>${videos.map(v => `
      <tr data-id="${esc(v.id)}" class="${v.visivel ? "" : "escondido"}">
        <td><button class="alca" type="button" aria-label="Arrastar pra mudar a ordem">${ICONES.alca}</button></td>
        <td>${esc(v.titulo) || '<span style="color:var(--apagado)">Sem título</span>'}${etiquetaExemplo(v)}</td>
        <td>${esc(nomeNicho(v.nicho))}</td>
        <td>${esc(v.formato)}</td>
        <td>${esc(v.marca)}</td>
        <td>${esc(v.destaque)}</td>
        <td style="white-space:nowrap;text-align:right">
          ${v.link ? `<a class="icone-btn" href="${esc(v.link)}" target="_blank" rel="noopener" aria-label="Abrir o link do vídeo" title="Abrir o link">${ICONES.link}</a>` : ""}
          <button class="icone-btn olho ${v.visivel ? "" : "desligado"}" type="button" data-olho aria-label="${v.visivel ? "Esconder do site" : "Mostrar no site"}" title="${v.visivel ? "Aparece no site. Clique pra esconder" : "Escondido do site. Clique pra mostrar"}">${v.visivel ? ICONES.olho : ICONES.olhoFechado}</button>
          <button class="icone-btn" type="button" data-editar aria-label="Editar" title="Editar">${ICONES.editar}</button>
        </td>
      </tr>`).join("")}</tbody></table>`;
}

function formVideo(v) {
  abreJanela({
    titulo: v ? "Editar vídeo" : "Novo vídeo",
    valores: v || { visivel: true, nicho: "moda" },
    campos: [
      { nome: "titulo", rotulo: "Título", obrigatorio: true, inteiro: true },
      { nome: "link", rotulo: "Link do vídeo", tipo: "url", inteiro: true, placeholder: "https://youtube.com/shorts/...", dica: "Link do YouTube Shorts ou de um arquivo .mp4. É ele que toca no site." },
      { nome: "nicho", rotulo: "Nicho", tipo: "select", opcoes: NICHOS },
      { nome: "formato", rotulo: "Formato", lista: ["UGC", "Anúncio", "Unboxing", "Review", "Tutorial", "Depoimento", "Bastidores"] },
      { nome: "marca", rotulo: "Marca" },
      { nome: "destaque", rotulo: "Destaque", placeholder: "ex: 2,4M views", dica: "Aparece embaixo do nome da marca no site." },
      { nome: "visivel", rotulo: "Aparece no site", tipo: "check" }
    ],
    async aoSalvar(dados) {
      if (!v) dados.ordem = Painel.dados.videos.reduce((m, x) => Math.max(m, num(x.ordem)), -1) + 1;
      const r = await salvarLinha("videos", dados, v?.id);
      if (r.erro) return r.erro;
      atualizaLocal("videos", r.linha, v?.id);
      recado(v ? "Vídeo atualizado. O site já mostra a mudança." : "Vídeo adicionado.");
      desenhaAba();
    },
    aoApagar: v ? async () => {
      const r = await apagarLinha("videos", v.id);
      if (r.erro) return r.erro;
      removeLocal("videos", v.id);
      recado("Vídeo apagado.");
      desenhaAba();
    } : null
  });
}

async function alternaVisivel(v) {
  const r = await salvarLinha("videos", { visivel: !v.visivel }, v.id);
  if (r.erro) { recado(r.erro, true); return; }
  atualizaLocal("videos", r.linha);
  recado(r.linha.visivel ? "Agora aparece no site." : "Escondido do site.");
  desenhaAba();
}

/* arrastar pela alça: funciona com mouse e com o dedo */
function ligaArrasto(alca, tr) {
  alca.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const corpo = tr.parentNode;
    const ordemAntes = $$("tr", corpo).map(l => l.dataset.id).join();
    tr.classList.add("arrastando");
    alca.setPointerCapture(e.pointerId);
    const move = (ev) => {
      const alvo = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("tr[data-id]");
      if (!alvo || alvo === tr || alvo.parentNode !== corpo) return;
      const r = alvo.getBoundingClientRect();
      corpo.insertBefore(tr, ev.clientY < r.top + r.height / 2 ? alvo : alvo.nextSibling);
    };
    const solta = async () => {
      alca.removeEventListener("pointermove", move);
      alca.removeEventListener("pointerup", solta);
      alca.removeEventListener("pointercancel", solta);
      tr.classList.remove("arrastando");
      const ids = $$("tr", corpo).map(l => l.dataset.id);
      if (ids.join() === ordemAntes) return;
      await salvaOrdem(ids);
    };
    alca.addEventListener("pointermove", move);
    alca.addEventListener("pointerup", solta);
    alca.addEventListener("pointercancel", solta);
  });
}
async function salvaOrdem(ids) {
  const lista = Painel.dados.videos;
  const mudou = ids.map((id, i) => ({ id, i })).filter(({ id, i }) => num(lista.find(v => v.id === id)?.ordem) !== i);
  const resultados = await Promise.all(mudou.map(({ id, i }) => salvarLinha("videos", { ordem: i }, id)));
  const erro = resultados.find(r => r.erro);
  resultados.forEach(r => r.linha && atualizaLocal("videos", r.linha));
  Painel.dados.videos.sort((a, b) => num(a.ordem) - num(b.ordem));
  if (erro) recado(erro.erro, true); else recado("Ordem salva. O site já segue a nova ordem.");
  desenhaAba();
}

/* ---------------- MARCAS ---------------- */
const SITUACOES = [
  ["lead", "Lead", "#3f6683", "#e3ecf2"],
  ["conversando", "Conversando", "#8a6a12", "#f7edcf"],
  ["cliente", "Cliente", "#4f5a2c", "#e3e8d2"],
  ["parada", "Parada", "#6b6f6a", "#ebebe7"]
];
const pilulaSituacao = (s) => {
  const x = SITUACOES.find(y => y[0] === s) || [s, s || "Sem situação", "#6b6f6a", "#ebebe7"];
  return `<span class="pilula" style="color:${x[2]};background:${x[3]}">${esc(x[1])}</span>`;
};
const arrobaLimpo = (ig) => String(ig || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/.*$/, "");
const linkWhats = (tel) => {
  let d = String(tel || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length <= 11) d = "55" + d.replace(/^0/, "");
  return "https://wa.me/" + d;
};

const estadoMarcas = { busca: "", situacao: "" };

Painel.abas.marcas = {
  titulo: "Marcas",
  desenha(secao) {
    const todas = Painel.dados.marcas;
    const conta = (s) => todas.filter(m => m.situacao === s).length;
    secao.innerHTML = `
      <div class="cartao">
        <div class="ferramentas">
          <label class="busca">${ICONES.busca}<input type="search" placeholder="Buscar por nome, @ ou e-mail" value="${esc(estadoMarcas.busca)}" aria-label="Buscar marcas"></label>
          <div class="chips" role="group" aria-label="Filtrar por situação">
            <button class="chip ${estadoMarcas.situacao ? "" : "ativo"}" type="button" data-sit="">Todas<small>${todas.length}</small></button>
            ${SITUACOES.map(s => `<button class="chip ${estadoMarcas.situacao === s[0] ? "ativo" : ""}" type="button" data-sit="${s[0]}">${s[1]}<small>${conta(s[0])}</small></button>`).join("")}
          </div>
          <div style="margin-left:auto;display:flex;gap:8px">
            <button class="btn" type="button" data-csv>${ICONES.baixar}Baixar CSV</button>
            <button class="btn btn--principal" type="button" data-nova>${ICONES.mais}Adicionar</button>
          </div>
        </div>
        <div class="rola" id="tabela-marcas"></div>
      </div>`;
    const busca = $(".busca input", secao);
    busca.addEventListener("input", () => { estadoMarcas.busca = busca.value; desenhaTabelaMarcas(); });
    $$("[data-sit]", secao).forEach(b => b.addEventListener("click", () => {
      estadoMarcas.situacao = b.dataset.sit;
      $$("[data-sit]", secao).forEach(x => x.classList.toggle("ativo", x === b));
      desenhaTabelaMarcas();
    }));
    $("[data-nova]", secao).addEventListener("click", () => formMarca());
    $("[data-csv]", secao).addEventListener("click", () => {
      const lista = marcasFiltradas();
      baixaCSV(`marcas-${hojeISO()}.csv`,
        ["Marca", "Instagram", "E-mail", "Telefone", "Situação", "Observação", "Último contato", "Entrou em"],
        lista.map(m => [m.nome, m.instagram, m.email, m.telefone, (SITUACOES.find(s => s[0] === m.situacao) || [, m.situacao])[1], m.obs, dataBR(m.ultimo_contato), m.criado_em ? dataBR(isoDe(new Date(m.criado_em))) : ""]));
    });
    desenhaTabelaMarcas();
  }
};

function marcasFiltradas() {
  const t = estadoMarcas.busca.trim().toLowerCase().replace(/^@/, "");
  return Painel.dados.marcas.filter(m =>
    (!estadoMarcas.situacao || m.situacao === estadoMarcas.situacao) &&
    (!t || [m.nome, m.instagram, m.email].some(c => String(c || "").toLowerCase().replace(/^@/, "").includes(t))));
}

function desenhaTabelaMarcas() {
  const caixa = $("#tabela-marcas");
  if (!caixa) return;
  const lista = marcasFiltradas();
  if (!Painel.dados.marcas.length) { caixa.innerHTML = `<div class="vazio">Sua base está vazia. Quando uma marca mandar mensagem pelo formulário do site, ela aparece aqui como Lead.</div>`; return; }
  if (!lista.length) { caixa.innerHTML = `<div class="vazio">Nenhuma marca encontrada com esse filtro.</div>`; return; }
  caixa.innerHTML = `<table>
    <thead><tr><th>Marca</th><th>Instagram</th><th>E-mail</th><th>Telefone</th><th>Situação</th><th>Observação</th><th>Último contato</th></tr></thead>
    <tbody>${lista.map(m => {
      const ig = arrobaLimpo(m.instagram), zap = linkWhats(m.telefone);
      return `<tr class="clicavel" data-id="${esc(m.id)}" tabindex="0">
        <td>${esc(m.nome)}${etiquetaExemplo(m)}</td>
        <td>${ig ? `<a class="arroba" href="https://instagram.com/${encodeURIComponent(ig)}" target="_blank" rel="noopener">@${esc(ig)}</a>` : ""}</td>
        <td>${m.email ? `<a class="arroba" href="mailto:${esc(m.email)}">${esc(m.email)}</a>` : ""}</td>
        <td style="white-space:nowrap">${esc(m.telefone)}${zap ? `<a class="zap" href="${zap}" target="_blank" rel="noopener" aria-label="Abrir conversa no WhatsApp">${ICONES.zap}WhatsApp</a>` : ""}</td>
        <td>${pilulaSituacao(m.situacao)}</td>
        <td class="curto apagado" title="${esc(m.obs)}">${esc(m.obs)}</td>
        <td class="apagado" style="white-space:nowrap">${dataBR(m.ultimo_contato)}</td>
      </tr>`;
    }).join("")}</tbody></table>`;
  $$("tr[data-id]", caixa).forEach(tr => {
    const m = Painel.dados.marcas.find(x => x.id === tr.dataset.id);
    tr.addEventListener("click", (e) => { if (!e.target.closest("a")) formMarca(m); });
    tr.addEventListener("keydown", (e) => { if (e.key === "Enter") formMarca(m); });
  });
}

function formMarca(m) {
  abreJanela({
    titulo: m ? "Editar marca" : "Nova marca",
    valores: m || { situacao: "lead", ultimo_contato: hojeISO() },
    campos: [
      { nome: "nome", rotulo: "Marca", obrigatorio: true, inteiro: true },
      { nome: "instagram", rotulo: "Instagram", placeholder: "@marca" },
      { nome: "email", rotulo: "E-mail", tipo: "email" },
      { nome: "telefone", rotulo: "Telefone", tipo: "tel", placeholder: "(51) 99999-9999" },
      { nome: "situacao", rotulo: "Situação", tipo: "select", opcoes: SITUACOES.map(s => [s[0], s[1]]) },
      { nome: "ultimo_contato", rotulo: "Último contato", tipo: "date" },
      { nome: "obs", rotulo: "Observação", tipo: "textarea" }
    ],
    async aoSalvar(dados) {
      const r = await salvarLinha("marcas", dados, m?.id);
      if (r.erro) return r.erro;
      if (m) atualizaLocal("marcas", r.linha, m.id); else Painel.dados.marcas.unshift(r.linha);
      recado(m ? "Marca atualizada." : "Marca adicionada.");
      desenhaAba();
    },
    aoApagar: m ? async () => {
      const r = await apagarLinha("marcas", m.id);
      if (r.erro) return r.erro;
      removeLocal("marcas", m.id);
      recado("Marca apagada.");
      desenhaAba();
    } : null
  });
}
