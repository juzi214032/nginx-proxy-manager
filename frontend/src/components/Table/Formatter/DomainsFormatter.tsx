import { IconCopy } from "@tabler/icons-react";
import cn from "classnames";
import type { ReactNode } from "react";
import { useLocaleState } from "src/context";
import { formatDateTime, intl, T } from "src/locale";
import { showSuccess } from "src/notifications";

interface Props {
	domains: string[];
	createdOn?: string;
	niceName?: string;
	provider?: string;
	color?: string;
	port?: number;
	copyable?: boolean;
}

const copyToClipboard = async (text: string) => {
	// navigator.clipboard is unavailable in insecure contexts (plain http)
	if (navigator.clipboard) {
		await navigator.clipboard.writeText(text);
		return;
	}
	const el = document.createElement("textarea");
	el.value = text;
	el.style.position = "fixed";
	el.style.opacity = "0";
	document.body.appendChild(el);
	el.select();
	document.execCommand("copy");
	document.body.removeChild(el);
};

const DomainLink = ({
	domain,
	color,
	port,
	copyable,
}: {
	domain?: string;
	color?: string;
	port?: number;
	copyable?: boolean;
}) => {
	// when domain contains a wildcard, make the link go nowhere.
	// Apparently the domain can be null or undefined sometimes.
	// This try is just a safeguard to prevent the whole formatter from breaking.
	if (!domain) return null;
	try {
		let onClick: ((e: React.MouseEvent) => void) | undefined;
		if (domain.includes("*")) {
			onClick = (e: React.MouseEvent) => e.preventDefault();
		}
		const display = port ? `${domain}:${port}` : domain;
		const url = `http://${display}`;
		const handleCopy = async (e: React.MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			try {
				await copyToClipboard(url);
				showSuccess(intl.formatMessage({ id: "url-copied" }));
			} catch {
				// ignore copy failures
			}
		};
		return (
			<span key={domain} className="me-2 text-nowrap">
				<a
					href={url}
					target="_blank"
					rel="noopener"
					onClick={onClick}
					className={cn("badge", color ? `bg-${color}-lt` : null, "domain-name")}
				>
					{display}
				</a>
				{copyable ? (
					<a
						href="#"
						onClick={handleCopy}
						className="ms-1 text-secondary"
						title={intl.formatMessage({ id: "action.copy-url" })}
					>
						<IconCopy size={14} />
					</a>
				) : null}
			</span>
		);
	} catch {
		return null;
	}
};

export function DomainsFormatter({ domains, createdOn, niceName, provider, color, port, copyable }: Props) {
	const { locale } = useLocaleState();
	const elms: ReactNode[] = [];

	if ((!domains || domains.length === 0) && !niceName) {
		elms.push(
			<span key="nice-name" className="badge bg-danger-lt me-2">
				Unknown
			</span>,
		);
	}
	if (!domains || (niceName && provider !== "letsencrypt")) {
		elms.push(
			<span key="nice-name" className="badge bg-info-lt me-2">
				{niceName}
			</span>,
		);
	}

	if (domains) {
		domains.map((domain: string) =>
			elms.push(<DomainLink key={domain} domain={domain} color={color} port={port} copyable={copyable} />),
		);
	}

	return (
		<div className="flex-fill">
			<div className="font-weight-medium">{...elms}</div>
			{createdOn ? (
				<div className="text-secondary mt-1">
					<T id="created-on" data={{ date: formatDateTime(createdOn, locale) }} />
				</div>
			) : null}
		</div>
	);
}
