const validId = /^[a-zA-Z0-9_-]{1,80}$/;

export function normalizeComboGroups(groups) {
    if (!Array.isArray(groups) || !groups.length || groups.length > 10) return null;
    const ids = new Set();
    const result = [];
    for (const group of groups) {
        const id = String(group?.id || "");
        const name = String(group?.name || "").trim().slice(0, 80);
        const quantity = Number(group?.quantity);
        const fixed = group?.fixed === true;
        const options = group?.options;
        if (!validId.test(id) || ids.has(id) || !name || !Number.isInteger(quantity) ||
            quantity < 1 || quantity > 20 || !Array.isArray(options) || !options.length ||
            options.length > 30 || (fixed && options.length !== 1)) return null;

        const productIds = new Set();
        const normalizedOptions = [];
        for (const option of options) {
            const productId = String(option?.productId || "");
            const surcharge = Number(option?.surcharge ?? 0);
            if (!validId.test(productId) || productIds.has(productId) ||
                !Number.isFinite(surcharge) || surcharge < 0 || surcharge > 100000) return null;
            productIds.add(productId);
            normalizedOptions.push({ productId, surcharge: fixed ? 0 : Math.round(surcharge * 100) / 100 });
        }
        ids.add(id);
        result.push({ id, name, quantity, fixed, options: normalizedOptions });
    }
    return result;
}

export function availableComboGroups(groups, catalog) {
    if (!groups?.length) return null;
    const available = groups.map(group => ({
        ...group,
        options: group.options.flatMap(option => {
            const product = Object.hasOwn(catalog, option.productId) && catalog[option.productId];
            return product && product.active !== false && product.type !== "combo"
                ? [{ ...option, name: product.name }]
                : [];
        })
    }));
    return available.every(group => group.options.length) ? available : null;
}

export function priceCombo(groups, selections, quantity) {
    if (!Array.isArray(selections) || selections.length > 300) return null;
    const byGroup = new Map();
    for (const entry of selections) {
        const group = groups.find(candidate => candidate.id === entry?.groupId);
        const option = group?.options.find(candidate => candidate.productId === entry?.productId);
        const qty = Number(entry?.qty);
        if (!option || group.fixed || !Number.isInteger(qty) || qty < 1 || qty > group.quantity * quantity) return null;
        if (!byGroup.has(group.id)) byGroup.set(group.id, new Map());
        const choices = byGroup.get(group.id);
        if (choices.has(option.productId)) return null;
        choices.set(option.productId, qty);
    }

    const components = [];
    let surchargeCents = 0;
    for (const group of groups) {
        const choices = byGroup.get(group.id) || new Map();
        const required = group.quantity * quantity;
        if (group.fixed) choices.set(group.options[0].productId, required);
        if ([...choices.values()].reduce((sum, qty) => sum + qty, 0) !== required) return null;
        for (const option of group.options) {
            const qty = choices.get(option.productId);
            if (!qty) continue;
            surchargeCents += Math.round(option.surcharge * 100) * qty;
            components.push({ groupId: group.id, groupName: group.name, productId: option.productId, name: option.name, qty });
        }
    }
    return { components, surcharge: surchargeCents / 100 };
}
