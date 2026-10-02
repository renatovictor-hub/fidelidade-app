import { requireAdmin } from "./_admin-auth.js";
import { getRestaurantConfig } from "./_restaurant-config.js";
export default async function handler(req, res) {
    if (!requireAdmin(req,res)) return;

    try {

        const response = await fetch(
            `https://onesignal.com/api/v1/players?app_id=${encodeURIComponent(CFG.oneSignalAppId)}&limit=300`,
            {
                headers: {
                    Authorization: `Basic ${process.env.ONESIGNAL_REST_KEY}`
                }
            }
        );

        const data = await response.json();

        const ativos = data.players.filter(
            p => p.invalid_identifier === false &&
                 p.identifier
        );

        res.status(200).json({
            total: ativos.length
        });

    } catch (e) {

        res.status(500).json({
            error: e.message
        });

    }
}
