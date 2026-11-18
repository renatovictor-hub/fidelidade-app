const idPattern = /^[a-zA-Z0-9_-]{1,80}$/;
const title = (value, limit = 80) => String(value ?? "").trim().slice(0, limit);
export const modifierKey = (groupId, optionId) => `group:${groupId}:${optionId}`;

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
        if (!idPattern.test(id) || groupIds.has(id) || !name || !Number.isInteger(min) ||
            !Number.isInteger(max) || min < 0 || max < Math.max(1, min) ||
            !Array.isArray(group?.options) || max > group.options.length || group.options.length > 20 ||
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
        groups.push({ id, name, min, max, options });
    }
    return { categories, groups };
}

export function listedModifierGroups(ids, groups) {
    return (ids || []).flatMap(id => {
        const group = groups.find(item => item.id === id);
        if (!group) return [];
        return [{
            ...group,
            options: group.options.filter(option => option.active).map(option => ({
                ...option, id: modifierKey(group.id, option.id)
            }))
        }];
    });
}

export function checkModifierGroups(groups, modifiers, qty) {
    return (groups || []).every(group => {
        const ids = new Set(group.options.map(option => option.id));
        const total = modifiers.reduce((sum, option) => sum + (ids.has(option.id) ? option.qty : 0), 0);
        return total >= group.min * qty && total <= group.max * qty;
    });
}
