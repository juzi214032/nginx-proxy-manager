import * as api from "./base";
import type { ProxyHost } from "./models";

export async function setProxyHostKeywords(id: number, serviceKeywords: string): Promise<ProxyHost> {
	return await api.put({
		url: `/nginx/proxy-hosts/${id}`,
		data: { serviceKeywords },
	});
}
