const RESTAURANT = { latitude: 21.119855, longitude: -86.87269 };

export function calculateDeliveryFee(distanceKm) {
    const km = Math.max(0, Number(distanceKm) || 0);
    if (km <= 2.5) return { baseFee: 40, extraKm: 0, distanceFee: 40 };
    if (km <= 4) return { baseFee: 50, extraKm: 0, distanceFee: 50 };
    if (km <= 5.5) return { baseFee: 60, extraKm: 0, distanceFee: 60 };
    if (km <= 7) return { baseFee: 70, extraKm: 0, distanceFee: 70 };
    if (km <= 10) return { baseFee: 80, extraKm: 0, distanceFee: 80 };

    const extraKm = Math.ceil(km - 10);
    return { baseFee: 80, extraKm, distanceFee: 80 + extraKm * 10 };
}

function isOutsideServiceHours(deliveryAt) {
    if (typeof deliveryAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(deliveryAt)) {
        const hour = Number(deliveryAt.slice(11, 13));
        return hour < 8 || hour >= 23;
    }

    const hour = Number(new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Cancun",
        hour: "2-digit",
        hour12: false
    }).format(new Date()));
    return hour < 8 || hour >= 23;
}

function destinationWaypoint(destination) {
    const latitude = Number(destination?.latitude);
    const longitude = Number(destination?.longitude);
    if (Number.isFinite(latitude) && latitude >= -90 && latitude <= 90 && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180) {
        return { location: { latLng: { latitude, longitude } } };
    }

    const address = String(destination?.address || "").trim().slice(0, 240);
    if (address.length < 8) return null;
    return { address: /canc[uú]n|quintana roo|m[eé]xico/i.test(address) ? address : `${address}, Cancún, Quintana Roo, México` };
}

export default async function handler(req, res) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") return res.status(204).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    const apiKey = String(process.env.GOOGLE_MAPS_API_KEY || "").trim();
    if (!apiKey) {
        return res.status(503).json({
            error: "El cálculo automático todavía no está habilitado.",
            code: "GOOGLE_MAPS_NOT_CONFIGURED"
        });
    }

    const destination = destinationWaypoint(req.body?.destination);
    if (!destination) return res.status(400).json({ error: "Indica una ubicación o dirección válida." });

    try {
        const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": "routes.distanceMeters,routes.duration"
            },
            body: JSON.stringify({
                origin: { location: { latLng: RESTAURANT } },
                destination,
                travelMode: "DRIVE",
                routingPreference: "TRAFFIC_AWARE",
                languageCode: "es-MX",
                units: "METRIC"
            })
        });

        const data = await response.json();
        if (!response.ok) {
            console.error("Google Routes error:", response.status, data?.error?.status || "unknown");
            return res.status(502).json({ error: "No pudimos calcular la ruta. Revisa la dirección e inténtalo de nuevo." });
        }

        const route = data?.routes?.[0];
        const distanceMeters = Number(route?.distanceMeters);
        if (!Number.isFinite(distanceMeters) || distanceMeters <= 0) {
            return res.status(422).json({ error: "No encontramos una ruta para esta dirección." });
        }

        const distanceKm = Math.round(distanceMeters / 100) / 10;
        const tariff = calculateDeliveryFee(distanceMeters / 1000);
        const address = String(req.body?.destination?.address || "").trim();
        const bonfilSurcharge = /(^|\b)(alfredo v\.? bonfil|bonfil)(\b|$)/i.test(address) ? 20 : 0;
        const plazaSurcharge = req.body?.insidePlaza === true ? 20 : 0;
        const outsideHoursSurcharge = isOutsideServiceHours(req.body?.deliveryAt) ? 20 : 0;
        const rainSurcharge = String(process.env.DELIVERY_RAIN_ACTIVE || "").toLowerCase() === "true" ? 10 : 0;
        const fee = tariff.distanceFee + bonfilSurcharge + plazaSurcharge + outsideHoursSurcharge + rainSurcharge;
        const durationSeconds = Math.max(0, Number.parseInt(String(route.duration || "0s"), 10) || 0);

        return res.status(200).json({
            distanceKm,
            durationMinutes: Math.max(1, Math.ceil(durationSeconds / 60)),
            fee,
            breakdown: {
                distance: tariff.distanceFee,
                base: tariff.baseFee,
                extraKm: tariff.extraKm,
                bonfil: bonfilSurcharge,
                plaza: plazaSurcharge,
                outsideHours: outsideHoursSurcharge,
                rain: rainSurcharge
            }
        });
    } catch (error) {
        console.error("Delivery quote error:", error?.message || error);
        return res.status(500).json({ error: "No pudimos calcular el envío en este momento." });
    }
}
