const idPattern = /^[a-zA-Z0-9_-]{1,80}$/;
const title = (value, limit = 80) => String(value ?? "").trim().slice(0, limit);
export const modifierKey = (groupId, optionId) => `group:${groupId}:${optionId}`;

function validLimits(min, max) {
    return Number.isInteger(min) && Number.isInteger(max) && min >= 0 && max >= Math.max(1, min) && max <= 20;
}

export function normalizeMenuSettings(value) {
    const categories = [];
    const groups = [];
    const categoryIds = new Set();
    const labels = new Set();
    for (const category of Array.isArray(value?.categories) ? value.categories : []) {
        const key = title(category?.key);
        const label = title(category?.label);
        const lookup = label.toLocaleLowerCase("es-MX");
        if (!key || !label || categoryIds.has(key) || labels.has(lookup) || categories.length >= 80) return null;
        categoryIds.add(key);
        labels.add(lookup);
        categories.push({ key, label });
    }
    const groupIds = new Set();
    for (const group of Array.isArray(value?.groups) ? value.groups : []) {
        const id = title(group?.id);
        const name = title(group?.name);
        const min = Number(group?.min);
        const max = Number(group?.max);
        const legacyLimits = validLimits(min, max) ? { min, max } : {};
        if (!idPattern.test(id) || groupIds.has(id) || !name ||
            !Array.isArray(group?.options) || group.options.length < 1 || group.options.length > 20 ||
            groups.length >= 60) return null;
        const options = [];
        const ids = new Set();
        for (const option of group.options) {
            const optionId = title(option?.id);
            const optionName = title(option?.name, 100);
            const price = Number(option?.price);
            if (!idPattern.test(optionId) || ids.has(optionId) || !optionName ||
                !Number.isFinite(price) || price < 0 || price > 100000) return null;
            ids.add(optionId);
            options.push({ id: optionId, name: optionName, price: Math.round(price * 100) / 100, active: option.active !== false });
        }
        groupIds.add(id);
        groups.push({ id, name, ...legacyLimits, options });
    }
    const generalRules = normalizeModifierRules(value?.generalRules ?? [], groups);
    return generalRules ? { categories, groups, generalRules } : null;
}

export function normalizeModifierRules(rules, groups) {
    if (!Array.isArray(rules) || rules.length > 10) return null;
    const ids = new Set();
    const result = [];
    for (const rule of rules) {
        const { id, repeat } = rule || {};
        const min = Number(rule?.min);
        const max = Number(rule?.max);
        if (!validLimits(min, max) || ids.has(id) || !groups.some(group => group.id === id)) return null;
        ids.add(id);
        result.push({ id, min, max, ...(repeat === false ? { repeat: false } : {}) });
    }
    return result;
}

export function listedModifierGroups(rules, groups, legacyIds) {
    const links = rules ?? (legacyIds || []).map(id => {
        const group = groups.find(item => item.id === id);
        return { id, min: group?.min ?? 0, max: group?.max ?? 1, repeat: false };
    });
    return links.flatMap(rule => {
        const group = groups.find(item => item.id === rule.id);
        if (!group) return [];
        return [{
            ...rule, name: group.name,
            options: group.options.filter(option => option.active).map(option => ({
                ...option, id: modifierKey(group.id, option.id)
            }))
        }];
    });
}

export function generalModifierGroups(settings) {
    return listedModifierGroups(settings.generalRules, settings.groups)
        .filter(group => group.options.length && (group.repeat !== false || group.options.length >= group.min));
}

export function checkModifierGroups(groups, modifiers, qty) {
    const selected = new Map(modifiers.map(option => [option.id, option.qty]));
    return (groups || []).every(group => {
        const counts = group.options.map(option => selected.get(option.id) || 0);
        const total = counts.reduce((sum, count) => sum + count, 0);
        return total >= group.min * qty && total <= group.max * qty &&
            (group.repeat !== false || counts.every(count => count <= qty));
    });
}
