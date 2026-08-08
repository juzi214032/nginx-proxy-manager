import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { ProxyHost } from "src/api/backend/models";
import { Dark, useTheme } from "src/context/ThemeContext";
import { buildCandidates, buildIconUrlChain, domainPrefix } from "src/lib/serviceIcons";

const urlIndexCache = new Map<string, number>();

const RESOLVED_LS_KEY = "npm.serviceIconResolved.v1";
const RESOLVED_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface ResolvedEntry {
	url: string | null;
	t: number;
}

function readResolvedCache(): Record<string, ResolvedEntry> {
	try {
		const raw = localStorage.getItem(RESOLVED_LS_KEY);
		if (!raw) {
			return {};
		}
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
}

function writeResolvedCache(map: Record<string, ResolvedEntry>) {
	try {
		localStorage.setItem(RESOLVED_LS_KEY, JSON.stringify(map));
	} catch {
		// storage full or unavailable, memory cache still works
	}
}

function getResolved(key: string): ResolvedEntry | undefined {
	const map = readResolvedCache();
	const entry = map[key];
	if (!entry) {
		return undefined;
	}
	if (typeof entry.t !== "number" || Date.now() - entry.t > RESOLVED_TTL_MS) {
		delete map[key];
		writeResolvedCache(map);
		return undefined;
	}
	return entry;
}

function setResolved(key: string, url: string | null) {
	const map = readResolvedCache();
	map[key] = { url, t: Date.now() };
	writeResolvedCache(map);
}

interface Props {
	host: ProxyHost;
}

function ServiceIconFormatterComponent({ host }: Props) {
	const { theme } = useTheme();
	const isDark = theme === Dark;

	const candidatesKey = useMemo(
		() => buildCandidates(host.serviceKeywords || "", host.domainNames || []).join(","),
		[host.serviceKeywords, host.domainNames],
	);
	const cacheKey = `${candidatesKey}:${isDark ? "dark" : "light"}`;
	const prefix = domainPrefix(host.domainNames || []);
	const initial = Array.from(prefix)[0]?.toUpperCase() || "?";

	const persistedRef = useRef<ResolvedEntry | null | undefined>(undefined);
	if (persistedRef.current === undefined) {
		persistedRef.current = getResolved(cacheKey) || null;
	}
	const persisted = persistedRef.current;

	const [urlIndex, setUrlIndex] = useState(() => {
		if (persisted && persisted.url === null) {
			return -1;
		}
		return urlIndexCache.get(cacheKey) ?? 0;
	});
	const [isLoaded, setIsLoaded] = useState(false);

	const urls = useMemo(() => {
		if (persisted && persisted.url) {
			return [persisted.url];
		}
		return buildIconUrlChain(host.serviceKeywords || "", host.domainNames || [], isDark);
	}, [host.serviceKeywords, host.domainNames, isDark, persisted]);

	useEffect(() => {
		persistedRef.current = getResolved(cacheKey) || null;
		const fresh = persistedRef.current;
		if (fresh && fresh.url === null) {
			setUrlIndex(-1);
		} else {
			setUrlIndex(urlIndexCache.get(cacheKey) ?? 0);
		}
		setIsLoaded(false);
	}, [cacheKey]);

	const handleError = () => {
		if (urlIndex + 1 < urls.length) {
			setUrlIndex(urlIndex + 1);
			setIsLoaded(false);
		} else {
			setResolved(cacheKey, null);
			setUrlIndex(-1);
		}
	};

	const handleLoad = () => {
		urlIndexCache.set(cacheKey, urlIndex);
		setResolved(cacheKey, urls[urlIndex]);
		setIsLoaded(true);
	};

	const fallback = (
		<span className="avatar avatar-2 avatar-rounded" title={prefix}>
			{initial}
		</span>
	);

	if (!urls.length || urlIndex < 0) {
		return <div className="d-flex py-1 align-items-center">{fallback}</div>;
	}

	return (
		<div className="d-flex py-1 align-items-center">
			{!isLoaded && <span className="avatar avatar-2 bg-secondary-lt" />}
			<img
				src={urls[urlIndex]}
				alt=""
				title={prefix}
				className="avatar avatar-2"
				style={{
					objectFit: "contain",
					border: "none",
					backgroundColor: "transparent",
					boxShadow: "none",
					display: isLoaded ? undefined : "none",
				}}
				onError={handleError}
				onLoad={handleLoad}
			/>
		</div>
	);
}

export const ServiceIconFormatter = memo(ServiceIconFormatterComponent);
