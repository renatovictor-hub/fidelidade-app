(() => {
    const API = '/api/recompensas';
    const REDEEM_API = '/api/recompensas?action=redeem';

    function criarEstilos() {
        if (document.getElementById('recompensasAdminStyles')) return;
        const style = document.createElement('style');
        style.id = 'recompensasAdminStyles';
        style.textContent = `
            .reward-item{border:1px solid #ece7f2;border-radius:10px;padding:14px;margin-bottom:10px;background:#fff;}
            .reward-item.inactive{opacity:.58;background:#f5f5f5;}
            .reward-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;}
            .reward-name{font-weight:800;color:#6a0dad;font-size:15px;}
            .reward-points{white-space:nowrap;background:#fff4bf;color:#6b5700;border-radius:999px;padding:5px 9px;font-weight:800;font-size:12px;}
            .reward-desc{color:#666;font-size:13px;margin-top:6px;line-height:1.4;}
            .reward-status{font-size:12px;margin-top:7px;color:#777;}
            .reward-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
            .reward-meta span{font-size:11px;padding:5px 7px;border-radius:999px;background:#f6f2f8;color:#66556f;font-weight:800}
            .reward-actions{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;}
            .reward-actions button{padding:9px 10px;font-size:12px;width:auto;flex:1;min-width:90px;}
            .reward-redeem{background:#25d366;color:#fff;}
        `;
        document.head.appendChild(style);
    }

    async function api(url = API, options = {}) {
        const res = await fetch(url, { cache: 'no-store', ...options });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
            window.parent.postMessage({ type: 'admin-session-expired' }, '*');
            throw new Error('Sesión expirada.');
        }
        if (!res.ok) throw new Error(data.error || data.details || 'Error en recompensas');
        return data;
    }

    function clienteActual() {
        try {
            return typeof clienteSelecionado !== 'undefined' ? clienteSelecionado : null;
        } catch (_) {
            return null;
        }
    }

    window.carregarRecompensas = async function carregarRecompensas() {
        criarEstilos();
        const lista = document.getElementById('listaRecompensas');
        if (!lista) return;
        lista.innerHTML = '<span style="color:#999;font-size:13px;">Cargando recompensas...</span>';

        try {
            const data = await api(`${API}?t=${Date.now()}`);
            const itens = Array.isArray(data.recompensas) ? data.recompensas : [];

            if (!itens.length) {
                lista.innerHTML = '<span style="color:#999;font-size:13px;">No hay recompensas creadas.</span>';
                return;
            }

            lista.innerHTML = '';
            itens.forEach(item => {
                const div = document.createElement('div');
                div.className = `reward-item${item.ativa === false ? ' inactive' : ''}`;
                div.dataset.canjes = String(Number(item.canjes || 0));

                const nome = String(item.nome || 'Sin nombre');
                const descricao = String(item.descricao || '');
                const pontos = Number(item.pontos || 0);
                const ativa = item.ativa !== false;

                div.innerHTML = `
                    <div class="reward-head">
                        <div class="reward-name"></div>
                        <div class="reward-points">${pontos} pts</div>
                    </div>
                    <div class="reward-desc"></div>
                    <div class="reward-status">${ativa ? '🟢 Activa' : '⚪ Inactiva'}</div>
                    <div class="reward-meta">
                        <span>${Number(item.canjes||0)} canje${Number(item.canjes||0)===1?'':'s'}</span>
                        ${item.ultimo_canje?'<span>Último: '+new Date(item.ultimo_canje).toLocaleDateString('es-MX')+'</span>':''}
                    </div>
                    <div class="reward-actions">
                        ${ativa ? '<button class="reward-redeem">🎁 CANJEAR</button>' : ''}
                        <button class="btn-secondary reward-edit">EDITAR</button>
                        <button class="btn-secondary reward-toggle">${ativa ? 'DESACTIVAR' : 'ACTIVAR'}</button>
                        <button class="btn-danger reward-delete">ELIMINAR</button>
                    </div>
                `;

                div.querySelector('.reward-name').textContent = nome;
                div.querySelector('.reward-desc').textContent = descricao || 'Sin descripción';

                const redeem = div.querySelector('.reward-redeem');
                if (redeem) redeem.addEventListener('click', () => window.resgatarRecompensa(item.id, nome, pontos, redeem));
                div.querySelector('.reward-edit').addEventListener('click', () => window.editarRecompensa(item));
                div.querySelector('.reward-toggle').addEventListener('click', () => window.alternarRecompensa(item.id, !ativa));
                div.querySelector('.reward-delete').addEventListener('click', () => window.eliminarRecompensa(item.id, nome));
                lista.appendChild(div);
            });
        } catch (e) {
            lista.innerHTML = `<span style="color:#c0392b;font-size:13px;">${e.message}</span>`;
        }
    };

    window.salvarRecompensa = async function salvarRecompensa() {
        const nomeInput = document.getElementById('recompensaNome');
        const pontosInput = document.getElementById('recompensaPontos');
        const descInput = document.getElementById('recompensaDesc');
        const nome = String(nomeInput?.value || '').trim();
        const pontos = Math.floor(Number(pontosInput?.value));
        const descricao = String(descInput?.value || '').trim();
        if (!nome) return alert('Ingresa el nombre de la recompensa.');
        if (nome.length > 80) return alert('El nombre puede tener máximo 80 caracteres.');
        if (descricao.length > 240) return alert('La descripción puede tener máximo 240 caracteres.');
        if (!Number.isFinite(pontos) || pontos <= 0) return alert('Ingresa una cantidad válida de puntos.');
        const botao = document.querySelector('button[onclick="salvarRecompensa()"]');
        const textoOriginal = botao?.textContent || 'CREAR RECOMPENSA';
        try {
            if (botao) { botao.disabled = true; botao.textContent = 'GUARDANDO...'; }
            await api(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome, pontos, descricao }) });
            if (nomeInput) nomeInput.value = '';
            if (pontosInput) pontosInput.value = '';
            if (descInput) descInput.value = '';
            await window.carregarRecompensas();
            alert('✅ Recompensa creada.');
        } catch (e) { alert(`No se pudo crear la recompensa.\n\n${e.message}`); }
        finally { if (botao) { botao.disabled = false; botao.textContent = textoOriginal; } }
    };

    window.editarRecompensa = async function editarRecompensa(item) {
        const nome = prompt('Nombre de la recompensa:', String(item?.nome || ''));
        if (nome === null) return;
        const limpio = nome.trim();
        if (!limpio) return alert('El nombre no puede quedar vacío.');
        if (limpio.length > 80) return alert('El nombre puede tener máximo 80 caracteres.');

        const puntosRaw = prompt('Puntos necesarios:', String(Number(item?.pontos || 0)));
        if (puntosRaw === null) return;
        const puntos = Math.floor(Number(puntosRaw));
        if (!Number.isFinite(puntos) || puntos <= 0) return alert('Ingresa una cantidad válida de puntos.');

        const descripcion = prompt('Descripción:', String(item?.descricao || ''));
        if (descripcion === null) return;
        const desc = descripcion.trim();
        if (desc.length > 240) return alert('La descripción puede tener máximo 240 caracteres.');

        try {
            await api(API, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, nome: limpio, pontos, descricao: desc })
            });
            await window.carregarRecompensas();
            alert('✅ Recompensa actualizada.');
        } catch (e) {
            alert(`No se pudo editar la recompensa.\n\n${e.message}`);
        }
    };

    window.resgatarRecompensa = async function resgatarRecompensa(id, nome, pontos, botao) {
        const cliente = clienteActual();
        if (!cliente?.uid) return alert('Primero busca o escanea al cliente que va a canjear la recompensa.');
        const saldo = Number(cliente.pontos || 0);
        if (saldo < pontos) return alert(`Puntos insuficientes.\n\nSaldo actual: ${saldo} pts\nNecesarios: ${pontos} pts`);
        const clienteNome = cliente.nome || 'Cliente';
        if (!confirm(`¿Confirmar canje?\n\n${clienteNome}\n${nome}\nCosto: ${pontos} puntos\nSaldo después: ${saldo - pontos} puntos`)) return;
        const textoOriginal = botao?.textContent || '🎁 CANJEAR';
        try {
            if (botao) { botao.disabled = true; botao.textContent = 'CANJEANDO...'; }
            const data = await api(REDEEM_API, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: cliente.uid, recompensaId: id, action:'redeem' })
            });
            cliente.pontos = Number(data.saldo_novo || 0);
            const saldoEl = document.getElementById('clientePontos');
            if (saldoEl) saldoEl.textContent = cliente.pontos;
            if (typeof carregarHistoricoCliente === 'function') await carregarHistoricoCliente(cliente.uid);
            alert(`✅ Recompensa canjeada.\n\n${nome}\n-${data.pontos_descontados} puntos\nNuevo saldo: ${data.saldo_novo} puntos`);
        } catch (e) { alert(`No se pudo realizar el canje.\n\n${e.message}`); }
        finally { if (botao) { botao.disabled = false; botao.textContent = textoOriginal; } }
    };

    window.alternarRecompensa = async function alternarRecompensa(id, ativa) {
        const accion = ativa ? 'activar' : 'desactivar';
        if (!confirm(`¿Seguro que quieres ${accion} esta recompensa?`)) return;
        try {
            await api(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ativa }) });
            await window.carregarRecompensas();
        } catch (e) { alert(`No se pudo actualizar la recompensa.\n\n${e.message}`); }
    };

    window.eliminarRecompensa = async function eliminarRecompensa(id, nome) {
        if (!confirm(`¿Eliminar la recompensa "${nome}"?`)) return;
        try {
            await api(`${API}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
            await window.carregarRecompensas();
        } catch (e) { alert(`No se pudo eliminar la recompensa.\n\n${e.message}`); }
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', window.carregarRecompensas, { once: true });
    else window.carregarRecompensas();
})();
