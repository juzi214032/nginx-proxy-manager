import { useQuery } from "@tanstack/react-query";
import { getProxyHostsProbe } from "src/api/backend";

const useProxyHostsProbe = (options = {}) => {
	return useQuery<Record<number, boolean>, Error>({
		queryKey: ["proxy-hosts", "probe"],
		queryFn: () => getProxyHostsProbe(),
		refetchInterval: 30 * 1000,
		...options,
	});
};

export { useProxyHostsProbe };
