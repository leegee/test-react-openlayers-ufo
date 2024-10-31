import { searchRoute } from '@ufo-monorepo/api-functions';
export default async function handler(req, res) {
    try {
        await searchRoute(req, res);
    }
    catch (error) {
        console.error('Error in search function:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
//# sourceMappingURL=search.js.map