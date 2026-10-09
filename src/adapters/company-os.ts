type OnlineResult = {status: 'online'; data: unknown};
type OfflineResult = {status: 'offline'};
export type CompanyOsResult = OnlineResult | OfflineResult;

const loopbackHosts = new Set(['127.0.0.1', 'localhost', '[::1]']);

export const createCompanyOsClient = (baseUrl: string, timeoutMs = 2_000) => {
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== 'http:' || !loopbackHosts.has(parsed.hostname)) {
    throw new Error('Company OS URL must be local HTTP');
  }

  const get = async (pathname: '/healthz' | '/api/truth'): Promise<CompanyOsResult> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(new URL(pathname, parsed), {
        method: 'GET',
        signal: controller.signal,
        headers: {accept: 'application/json'},
      });
      if (!response.ok) return {status: 'offline'};
      return {status: 'online', data: await response.json()};
    } catch {
      return {status: 'offline'};
    } finally {
      clearTimeout(timer);
    }
  };

  return {
    getHealth: () => get('/healthz'),
    getTruth: () => get('/api/truth'),
  };
};

export const companyOsClient = createCompanyOsClient(
  process.env.COMPANY_OS_URL || 'http://127.0.0.1:4877',
);
