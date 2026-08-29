import type { LayoutServerLoad } from './$types';
import { verifyCognoDBConnection } from '$lib/server/cognodb';

export const load: LayoutServerLoad = async () => {
	const isConnected = await verifyCognoDBConnection();
	return {
		dbConnected: isConnected
	};
};
