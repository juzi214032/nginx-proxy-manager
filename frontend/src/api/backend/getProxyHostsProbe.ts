import * as api from "./base";

export async function getProxyHostsProbe(): Promise<Record<number, boolean>> {
	return await api.get({
		url: "/nginx/proxy-hosts/probe",
	});
}
