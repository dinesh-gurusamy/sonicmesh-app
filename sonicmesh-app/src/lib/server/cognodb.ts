import neo4j, { type Driver } from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.COGNODB_URI || 'bolt+s://db-8d0153a1.bravo.databases.cognodb.com';
const user = process.env.COGNODB_USER || 'cognodb';
const password = process.env.COGNODB_PASSWORD || '';

export const driver: Driver = neo4j.driver(
	uri,
	neo4j.auth.basic(user, password),
	{
		maxConnectionPoolSize: 10,
		connectionTimeout: 5000
	}
);

export async function verifyCognoDBConnection(): Promise<boolean> {
	if (!password || !password.trim()) {
		return false;
	}
	try {
		await driver.verifyConnectivity();
		return true;
	} catch (error) {
		const msg = (error as Error).message || '';
		console.warn(`[CognoDB Status] Connection warning (${msg.split('\n')[0]})`);
		return false;
	}
}

export async function runReadQuery<T = any>(query: string, params: Record<string, any> = {}): Promise<T[]> {
	if (!password || !password.trim()) {
		return [];
	}
	let session;
	try {
		session = driver.session();
		const result = await session.executeRead(async (tx) => {
			const res = await tx.run(query, params);
			return res.records.map((record) => {
				const obj: Record<string, any> = {};
				record.keys.forEach((key) => {
					const fieldKey = typeof key === 'string' ? key : String(key);
					const val = record.get(key);
					if (val && typeof val === 'object' && 'toNumber' in val && typeof val.toNumber === 'function') {
						obj[fieldKey] = val.toNumber();
					} else {
						obj[fieldKey] = val;
					}
				});
				return obj as T;
			});
		});
		return result;
	} catch (error) {
		const msg = (error as Error).message || '';
		console.warn(`[CognoDB Read Error] ${msg.split('\n')[0]}`);
		return [];
	} finally {
		if (session) {
			try { await session.close(); } catch (_) {}
		}
	}
}

export async function runWriteQuery<T = any>(query: string, params: Record<string, any> = {}): Promise<T[]> {
	if (!password || !password.trim()) {
		return [];
	}
	let session;
	try {
		session = driver.session();
		const result = await session.executeWrite(async (tx) => {
			const res = await tx.run(query, params);
			return res.records.map((record) => {
				const obj: Record<string, any> = {};
				record.keys.forEach((key) => {
					const fieldKey = typeof key === 'string' ? key : String(key);
					const val = record.get(key);
					if (val && typeof val === 'object' && 'toNumber' in val && typeof val.toNumber === 'function') {
						obj[fieldKey] = val.toNumber();
					} else {
						obj[fieldKey] = val;
					}
				});
				return obj as T;
			});
		});
		return result;
	} catch (error) {
		const msg = (error as Error).message || '';
		console.warn(`[CognoDB Write Error] ${msg.split('\n')[0]}`);
		return [];
	} finally {
		if (session) {
			try { await session.close(); } catch (_) {}
		}
	}
}
