import { searchRoute } from '@ufo-monorepo/api-functions';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    console.log('hello from search')
    try {
        await searchRoute(req, res);
    } catch (error) {
        console.error('Error in search function:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
