/* ============================================================
   CHECKLIST PORTFÓLIO
   Todo o conteúdo vem de js/biblioteca.js (window.Biblioteca),
   do jeito que está escrito lá. Aqui só organizamos na tela.
   O que você marca fica salvo na tabela "marcados".
   ============================================================ */

const CORES_CAPA = { coral: "#e9c3b4", rosa: "#ecd0d6", mostarda: "#ecdba8", terra: "#d9bfa6", oliva: "#cdd3b0", areia: "#e6e0d3" };
const SUB_ABAS = [["checklist", "Checklist do portfólio"], ["referencias", "Referências de vídeo"], ["roteiros", "Roteiros"], ["nichos", "Ideias por nicho"], ["revisar", "Revisar meu roteiro"]];
const estadoCheck = { sub: "checklist", abertas: new Set() };

/* os textos dos roteiros vêm com <b> e <em> prontos; o resto é texto simples */
const B = () => window.Biblioteca || {};
const lista = (x) => Array.isArray(x) ? x : [];

Painel.abas.checklist = {
  titulo: "Checklist",
  desenha(secao) {
    if (!window.Biblioteca) {
      secao.innerHTML = `<div class="alerta alerta--erro">O arquivo js/biblioteca.js não carregou, então o conteúdo do checklist não está disponível. As outras abas seguem funcionando.</div>`;
      return;
    }
    secao.innerHTML = `
      <div class="sub-abas" role="tablist">${SUB_ABAS.map(([k, t]) => `<button class="sub-aba ${estadoCheck.sub === k ? "ativo" : ""}" type="button" role="tab" aria-selected="${estadoCheck.sub === k}" data-sub="${k}">${t}</button>`).join("")}</div>
      <div id="sub-conteudo"></div>`;
    $$("[data-sub]", secao).forEach(b => b.addEventListener("click", () => { estadoCheck.sub = b.dataset.sub; desenhaAba(); }));
    const alvo = $("#sub-conteudo", secao);
    ({ checklist: subChecklist, referencias: subReferencias, roteiros: subRoteiros, nichos: subNichos, revisar: subRevisar })[estadoCheck.sub](alvo);
  }
};

/* marca ou desmarca um item e salva no banco */
async function alternaMarcado(chave, marcado) {
  const m = Painel.dados.marcados;
  if (marcado) m.add(chave); else m.delete(chave);
  try {
    const { error } = marcado
      ? await window.banco.from("marcados").upsert({ chave })
      : await window.banco.from("marcados").delete().eq("chave", chave);
    if (error) throw error;
  } catch (erro) {
    if (marcado) m.delete(chave); else m.add(chave);
    recado(traduzErro(erro, "marcados"), true);
    desenhaAba();
  }
}

/* ---------- 1. Checklist do portfólio ---------- */
function subChecklist(alvo) {
  const secoes = lista(B().CHECKLIST);
  const marc = Painel.dados.marcados;
  const chave = (s, i) => `checklist:${s.id}:${i}`;
  const totalItens = secoes.reduce((t, s) => t + lista(s.itens).length, 0);
  const feitos = secoes.reduce((t, s) => t + lista(s.itens).filter((_, i) => marc.has(chave(s, i))).length, 0);
  const pct = (a, b) => b > 0 ? Math.round((a / b) * 100) : 0;
  alvo.innerHTML = `
    <div class="cartao geral"><strong>Seu portfólio está ${pct(feitos, totalItens)}% pronto</strong><div class="progresso" aria-hidden="true"><i style="width:${pct(feitos, totalItens)}%"></i></div><span style="font-size:12px;color:var(--apagado);white-space:nowrap">${feitos} de ${totalItens}</span></div>
    ${secoes.map(s => {
      const itens = lista(s.itens);
      const f = itens.filter((_, i) => marc.has(chave(s, i))).length;
      return `<details class="cartao secao" data-secao="${esc(s.id)}" ${estadoCheck.abertas.has(s.id) ? "open" : ""}>
        <summary>
          <span class="emoji" aria-hidden="true">${esc(s.emoji)}</span>
          <span class="nome"><b>${esc(s.nome)}</b><small>${esc(s.resumo)}</small></span>
          <span class="lado"><span>${f}/${itens.length}</span><span class="progresso"><i style="width:${pct(f, itens.length)}%"></i></span></span>
          ${ICONES.gira}
        </summary>
        <div class="secao-corpo">
          <p class="porque"><b>Por que importa:</b> ${esc(s.porque)}</p>
          <ul class="itens">${itens.map((it, i) => `<li><label><input type="checkbox" data-chave="${esc(chave(s, i))}" ${marc.has(chave(s, i)) ? "checked" : ""}><span><span class="t">${esc(it.t)}</span><span class="d">${esc(it.d)}</span></span></label></li>`).join("")}</ul>
        </div>
      </details>`;
    }).join("")}`;
  $$("details[data-secao]", alvo).forEach(d => d.addEventListener("toggle", () => {
    if (d.open) estadoCheck.abertas.add(d.dataset.secao); else estadoCheck.abertas.delete(d.dataset.secao);
  }));
  $$("input[data-chave]", alvo).forEach(c => c.addEventListener("change", async () => {
    await alternaMarcado(c.dataset.chave, c.checked);
    subChecklist(alvo);
  }));
}

/* ---------- 2. Referências de vídeo ---------- */
function subReferencias(alvo) {
  const refs = lista(B().REFERENCIAS);
  alvo.innerHTML = `<div class="refs">${refs.map((r, i) => `
    <button class="ref" type="button" data-ref="${i}">
      <span class="ref-capa" style="--capa:${CORES_CAPA[r.cor] || "#cdd0c2"}"><span aria-hidden="true">${esc(r.emoji)}</span><span class="dur">${esc(r.duracao)}</span></span>
      <span class="ref-info"><b>${esc(r.titulo)}</b><small>${esc(r.estilo)} · ${esc(r.marca)}</small></span>
    </button>`).join("")}</div>`;
  $$("[data-ref]", alvo).forEach(b => b.addEventListener("click", () => fichaReferencia(refs[Number(b.dataset.ref)])));
}
function fichaReferencia(r) {
  const audiencia = lista(B().AUDIENCIAS).find(a => a.v === r.audiencia);
  abreJanela({
    titulo: `${r.emoji || ""} ${r.titulo}`.trim(),
    larga: true,
    semPe: true,
    corpo: `<div class="ficha">
      <p style="margin-bottom:12px;color:var(--apagado);font-size:12px">${esc(r.estilo)} · ${esc(r.duracao)} · ${esc(r.marca)}${audiencia ? " · " + esc(audiencia.t) : ""}</p>
      <h4>Gancho</h4><p class="gancho">${esc(r.gancho)}</p>
      <h4>Por que funciona</h4><p>${esc(r.porque)}</p>
      <h4>O diferencial</h4><p>${esc(r.diferencial)}</p>
      <h4>Erro comum</h4><p>${esc(r.erro)}</p>
      <h4>Roteiro em blocos de tempo</h4>
      <ul class="blocos">${lista(r.roteiro).map(b => `<li><span class="tempo">${esc(b.t)}</span><span>${b.o || ""}</span></li>`).join("")}</ul>
      ${r.youtube ? `<div style="margin-top:16px"><a class="btn btn--principal" href="${esc(r.youtube)}" target="_blank" rel="noopener">Assistir</a></div>` : ""}
    </div>`
  });
}

/* ---------- 3. Roteiros ---------- */
function subRoteiros(alvo) {
  alvo.innerHTML = lista(B().TIPOS).map(t => `
    <details class="cartao secao">
      <summary>
        <span class="emoji" aria-hidden="true">${esc(t.emoji)}</span>
        <span class="nome"><b>${esc(t.nome)}</b><small>${esc(t.duracao)}</small></span>
        ${ICONES.gira}
      </summary>
      <div class="secao-corpo ficha">
        <h4>Quando usar</h4><p>${esc(t.porque)}</p>
        <h4>Blocos de tempo</h4>
        <ul class="blocos">${lista(t.beats).map(b => `<li><span class="tempo">${esc(b.t)}</span><span>${b.o || ""}</span></li>`).join("")}</ul>
        ${lista(t.erros).length ? `<h4>Erros comuns</h4><ul class="erros">${t.erros.map(e => `<li>${esc(e)}</li>`).join("")}</ul>` : ""}
      </div>
    </details>`).join("");
}

/* ---------- 4. Ideias por nicho ---------- */
function subNichos(alvo) {
  const comoUsar = lista(B().COMO_USAR);
  alvo.innerHTML = `
    ${comoUsar.length ? `<div class="cartao como-usar"><h3>Como usar os ganchos</h3><ul>${comoUsar.map(c => `<li>${esc(c)}</li>`).join("")}</ul></div>` : ""}
    ${lista(B().NICHOS).map(n => `
    <details class="cartao secao">
      <summary>
        <span class="emoji" aria-hidden="true">${esc(n.emoji)}</span>
        <span class="nome"><b>${esc(n.nome)}</b><small>${plural(lista(n.ideias).length, "ideia", "ideias")}</small></span>
        ${ICONES.gira}
      </summary>
      <div class="secao-corpo">
        <ul class="ideias">${lista(n.ideias).map(i => `<li><b>${esc(i.t)}</b><q>${esc(i.gancho)}</q></li>`).join("")}</ul>
      </div>
    </details>`).join("")}`;
}

/* ---------- 5. Revisar meu roteiro ---------- */
function subRevisar(alvo) {
  const blocos = lista(B().REVISAO);
  const marc = Painel.dados.marcados;
  const chave = (bi, i) => `revisao:${bi}:${i}`;
  let texto = "";
  try { texto = localStorage.getItem("roteiroEmRevisao") || ""; } catch (e) {}
  alvo.innerHTML = `
    <div class="revisar">
      <div class="cartao" style="padding:14px">
        <label class="campo" style="gap:8px">Cole o seu roteiro aqui
          <textarea id="roteiro-revisao" placeholder="Cole aqui o roteiro que você quer conferir.">${esc(texto)}</textarea>
          <small>Fica guardado só neste navegador, pra você não perder enquanto confere.</small>
        </label>
        <div style="margin-top:10px"><button class="btn" type="button" data-limpar>Começar uma revisão nova</button></div>
      </div>
      <div>${blocos.map((b, bi) => `
        <div class="cartao secao" style="padding:12px 16px">
          <p style="margin:0 0 6px;font-size:13.5px"><span aria-hidden="true">${esc(b.emoji)}</span> ${esc(b.bloco)}</p>
          <ul class="itens">${lista(b.itens).map((it, i) => `<li><label><input type="checkbox" data-chave="${chave(bi, i)}" ${marc.has(chave(bi, i)) ? "checked" : ""}><span><span class="t">${esc(it.t)}</span><span class="d">${esc(it.d)}</span></span></label></li>`).join("")}</ul>
        </div>`).join("")}</div>
    </div>`;
  const area = $("#roteiro-revisao", alvo);
  area.addEventListener("input", () => { try { localStorage.setItem("roteiroEmRevisao", area.value); } catch (e) {} });
  $$("input[data-chave]", alvo).forEach(c => c.addEventListener("change", () => alternaMarcado(c.dataset.chave, c.checked)));
  $("[data-limpar]", alvo).addEventListener("click", async () => {
    try { localStorage.removeItem("roteiroEmRevisao"); } catch (e) {}
    const chaves = [...marc].filter(k => k.startsWith("revisao:"));
    chaves.forEach(k => marc.delete(k));
    if (chaves.length) {
      try { const { error } = await window.banco.from("marcados").delete().in("chave", chaves); if (error) throw error; }
      catch (erro) { recado(traduzErro(erro, "marcados"), true); }
    }
    subRevisar(alvo);
  });
}
