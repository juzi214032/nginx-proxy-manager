const HOMARR_BASE = "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons";
const SELFHST_BASE = "https://cdn.jsdelivr.net/gh/selfhst/icons";

const ALIASES: Record<string, string> = {
	"wg-easy": "wireguard",
	npm: "nginx-proxy-manager",
	pgvecto: "postgres",
	"pgvecto-rs": "postgres",
	"plex-media-server": "plex",
	"jellyfin-server": "jellyfin",
	"home-assistant-core": "home-assistant",
	"code-server": "vscode",
	"actual-server": "actual",
	"paperless-ngx": "paperless",
	"overseerr-overseerr": "overseerr",
	"radarr-radarr": "radarr",
	"sonarr-sonarr": "sonarr",
	"prowlarr-prowlarr": "prowlarr",
	"bazarr-bazarr": "bazarr",
	"lidarr-lidarr": "lidarr",
	"readarr-readarr": "readarr",
	"sabnzbd-sabnzbd": "sabnzbd",
	"qbittorrent-qbittorrent": "qbittorrent",
	"transmission-transmission": "transmission",
	"deluge-deluge": "deluge",
};

export function parseKeywords(raw: string): string[] {
	if (!raw) {
		return [];
	}
	const seen = new Set<string>();
	const result: string[] = [];
	for (const part of raw.split(/[,，]/)) {
		const keyword = part.trim().toLowerCase();
		if (keyword && !seen.has(keyword)) {
			seen.add(keyword);
			result.push(keyword);
		}
	}
	return result;
}

export function domainPrefix(domainNames: string[]): string {
	return (domainNames?.[0]?.split(".")[0] || "").toLowerCase();
}

/**
 * Candidate names in match order: keywords first, then the first domain's prefix.
 */
export function buildCandidates(serviceKeywords: string, domainNames: string[]): string[] {
	const candidates = parseKeywords(serviceKeywords);
	const prefix = domainPrefix(domainNames);
	if (prefix && !candidates.includes(prefix)) {
		candidates.push(prefix);
	}
	return candidates;
}

function urlsForName(name: string, isDark: boolean): string[] {
	const encoded = encodeURIComponent(name);
	const themeSuffix = isDark ? "-light" : "-dark";
	return [
		`${HOMARR_BASE}/svg/${encoded}.svg`,
		`${HOMARR_BASE}/svg/${encoded}${themeSuffix}.svg`,
		`${SELFHST_BASE}/svg/${encoded}.svg`,
		`${SELFHST_BASE}/svg/${encoded}${themeSuffix}.svg`,
		`${HOMARR_BASE}/png/${encoded}.png`,
	];
}

/**
 * Full probe URL chain: each candidate expands to homarr svg, theme variant,
 * selfhst svg, theme variant, homarr png. Alias targets are appended after
 * their original name.
 */
export function buildIconUrlChain(serviceKeywords: string, domainNames: string[], isDark: boolean): string[] {
	const seen = new Set<string>();
	const urls: string[] = [];
	for (const candidate of buildCandidates(serviceKeywords, domainNames)) {
		for (const name of [candidate, ALIASES[candidate]]) {
			if (!name) {
				continue;
			}
			for (const url of urlsForName(name, isDark)) {
				if (!seen.has(url)) {
					seen.add(url);
					urls.push(url);
				}
			}
		}
	}
	return urls;
}
