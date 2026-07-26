import * as api from "./base";
import type { ProxyHost } from "./models";

export async function setProxyHostAuthelia(id: number, autheliaEnabled: boolean): Promise<ProxyHost> {
	return await api.put({
		url: `/nginx/proxy-hosts/${id}`,
		data: { autheliaEnabled },
	});
}
