const money = value => {
    const amount = Number(value);
    return String(value ?? "").trim() && Number.isFinite(amount) && amount >= 0 && amount <= 100000
        ? Math.round(amount * 100) / 100 : null;
};
const coordinate = (value, limit) => String(value ?? "").trim() && Number.isFinite(Number(value)) &&
    Math.abs(Number(value)) <= limit ? Number(value) : null;
const time = value => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
const words = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

export function initialDeliverySettings(legacy, config) {
    return {
        origin: legacy ? config.location : { latitude: "", longitude: "" },
        addressSuffix: legacy ? config.addressSuffix : "",
        tiers: legacy ? [[2.5,40],[4,50],[5.5,60],[7,70],[10,80]].map(([km,fee])=>({km,fee})) : [],
        extend: legacy,
        extraPerKm: legacy ? 10 : 0,
        zones: legacy ? [{ name: "Bonfil", keywords: "bonfil", fee: 20 }] : [],
        plazaFee: legacy ? 20 : 0,
        residentialFee: 0,
        rain: { active: legacy && String(process.env.DELIVERY_RAIN_ACTIVE || "").toLowerCase() === "true", fee: legacy ? 10 : 0 },
        schedule: { from: "08:00", until: "23:00", fee: legacy ? 20 : 0 }
    };
}

export function normalizeDeliverySettings(raw) {
    if (!raw || !Array.isArray(raw.tiers) || !raw.tiers.length || raw.tiers.length > 25 ||
        (raw.zones != null && (!Array.isArray(raw.zones) || raw.zones.length > 15))) return null;
    const latitude = coordinate(raw.origin?.latitude, 90);
    const longitude = coordinate(raw.origin?.longitude, 180);
    const addressSuffix = String(raw.addressSuffix ?? "").trim().slice(0, 140);
    const extraPerKm = money(raw.extraPerKm), plazaFee = money(raw.plazaFee), residentialFee = money(raw.residentialFee);
    const rain = { active: raw.rain?.active === true, fee: money(raw.rain?.fee) };
    const schedule = { from: raw.schedule?.from, until: raw.schedule?.until, fee: money(raw.schedule?.fee) };
    if ([latitude, longitude, extraPerKm, plazaFee, residentialFee, rain.fee, schedule.fee].includes(null) ||
        !time(schedule.from) || !time(schedule.until) || (schedule.fee > 0 && schedule.from === schedule.until)) return null;

    let previousKm = 0;
    const tiers = [];
    for (const row of raw.tiers) {
        if (!row) return null;
        const km = Math.round(Number(row.km) * 1000) / 1000, fee = money(row.fee);
        if (!Number.isFinite(km) || km <= previousKm || km > 1000 || fee === null) return null;
        tiers.push({ km, fee });
        previousKm = km;
    }

    const zones = [];
    for (const row of raw.zones ?? []) {
        if (!row) return null;
        const name = String(row.name ?? "").trim().slice(0, 70);
        const keywords = String(row.keywords ?? "").trim().slice(0, 240);
        const fee = money(row.fee);
        if (!name || !keywords.split(",").some(words) || fee === null) return null;
        zones.push({ name, keywords, fee });
    }
    return { origin: { latitude, longitude }, addressSuffix, tiers, extend: raw.extend === true,
        extraPerKm, zones, plazaFee, residentialFee, rain, schedule };
}

export function deliveryPrice(settings, distanceMeters, { address, insidePlaza, residential, deliveryAt, timezone, now = new Date() }) {
    const tier = settings.tiers.find(row => distanceMeters <= Math.round(row.km * 1000));
    const last = settings.tiers.at(-1);
    if (!tier && !settings.extend) return null;
    const base = (tier || last).fee;
    const extraKm = tier ? 0 : Math.ceil((distanceMeters - Math.round(last.km * 1000)) / 1000);
    const distance = base + extraKm * settings.extraPerKm;
    const target = ` ${words(address)} `;
    const zone = settings.zones.find(row => row.keywords.split(",").map(words).some(key => key && target.includes(` ${key} `)));
    const { from, until, fee } = settings.schedule;
    const local = /^\d{4}-\d{2}-\d{2}T((?:[01]\d|2[0-3]):[0-5]\d)$/.exec(deliveryAt || "")?.[1] ||
        new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
    const insideHours = from <= until ? local >= from && local < until : local >= from || local < until;
    const surcharges = { zone: zone?.fee || 0, plaza: insidePlaza ? settings.plazaFee : 0,
        residential: residential ? settings.residentialFee : 0, outsideHours: insideHours ? 0 : fee,
        rain: settings.rain.active ? settings.rain.fee : 0 };
    const total = distance + Object.values(surcharges).reduce((sum, amount) => sum + amount, 0);
    return { fee: Math.round(total * 100) / 100,
        breakdown: { distance: Math.round(distance * 100) / 100, base, extraKm, zoneName: zone?.name || "", ...surcharges } };
}
