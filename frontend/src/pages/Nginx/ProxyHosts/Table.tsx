import { IconDotsVertical, IconEdit, IconPower, IconTrash } from "@tabler/icons-react";
import {
	createColumnHelper,
	getCoreRowModel,
	getSortedRowModel,
	type SortingState,
	useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import type { ProxyHost } from "src/api/backend";
import {
	AccessListFormatter,
	CertificateFormatter,
	DomainsFormatter,
	EmptyData,
	GravatarFormatter,
	HasPermission,
	TrueFalseFormatter,
} from "src/components";
import { TableLayout } from "src/components/Table/TableLayout";
import { intl, T } from "src/locale";
import { MANAGE, PROXY_HOSTS } from "src/modules/Permissions";

interface Props {
	data: ProxyHost[];
	isFiltered?: boolean;
	isFetching?: boolean;
	publicPort?: number;
	probeResults?: Record<number, boolean>;
	onEdit?: (id: number) => void;
	onDelete?: (id: number) => void;
	onDisableToggle?: (id: number, enabled: boolean) => void;
	onAutheliaToggle?: (id: number, autheliaEnabled: boolean) => void;
	onNew?: () => void;
}
export default function Table({
	data,
	isFetching,
	onEdit,
	onDelete,
	onDisableToggle,
	onAutheliaToggle,
	onNew,
	isFiltered,
	publicPort,
	probeResults,
}: Props) {
	const columnHelper = createColumnHelper<ProxyHost>();
	const columns = useMemo(
		() => [
			columnHelper.accessor((row: any) => row.owner, {
				id: "owner",
				enableSorting: false,
				cell: (info: any) => {
					const value = info.getValue();
					return <GravatarFormatter url={value ? value.avatar : ""} name={value ? value.name : ""} />;
				},
				meta: {
					className: "w-1",
				},
			}),
			columnHelper.accessor((row: any) => row.meta?.niceName, {
				id: "niceName",
				header: intl.formatMessage({ id: "column.name" }),
				sortingFn: (a, b) => {
					const aVal = a.original.meta?.niceName ?? "";
					const bVal = b.original.meta?.niceName ?? "";
					return aVal.localeCompare(bVal);
				},
				cell: (info: any) => info.getValue() || "-",
			}),
			columnHelper.accessor((row: any) => row, {
				id: "domainNames",
				header: intl.formatMessage({ id: "column.source" }),
				sortingFn: (a, b) => {
					const aVal = a.original.domainNames?.[0] ?? "";
					const bVal = b.original.domainNames?.[0] ?? "";
					return aVal.localeCompare(bVal);
				},
				cell: (info: any) => {
					const value = info.getValue();
					return (
						<DomainsFormatter
							domains={value.domainNames}
							createdOn={value.createdOn}
							port={publicPort}
							scheme={value.certificateId ? "https" : "http"}
							copyable
						/>
					);
				},
			}),
			columnHelper.accessor((row: any) => row, {
				id: "forwardHost",
				header: intl.formatMessage({ id: "column.destination" }),
				sortingFn: (a, b) => {
					const aVal = `${a.original.forwardHost}:${a.original.forwardPort}`;
					const bVal = `${b.original.forwardHost}:${b.original.forwardPort}`;
					return aVal.localeCompare(bVal);
				},
				cell: (info: any) => {
					const value = info.getValue();
					const url = `${value.forwardScheme}://${value.forwardHost}:${value.forwardPort}`;
					return (
						<a href={url} target="_blank" rel="noopener">
							{url}
						</a>
					);
				},
			}),
			columnHelper.display({
				id: "service",
				header: intl.formatMessage({ id: "column.service" }),
				cell: (info: any) => {
					// read probeResults directly: accessor values are cached per-row
					// and would go stale when probe data arrives after first render
					const value = probeResults?.[info.row.original.id];
					if (typeof value === "undefined") {
						return <span className="text-secondary">-</span>;
					}
					return <TrueFalseFormatter value={value} trueLabel="online" falseLabel="offline" animated={false} />;
				},
			}),
			columnHelper.accessor((row: any) => row.certificate, {
				id: "certificate",
				enableSorting: false,
				header: intl.formatMessage({ id: "column.ssl" }),
				cell: (info: any) => {
					return <CertificateFormatter certificate={info.getValue()} />;
				},
			}),
			columnHelper.accessor((row: any) => row.autheliaEnabled, {
				id: "autheliaEnabled",
				enableSorting: false,
				header: intl.formatMessage({ id: "column.auth" }),
				cell: (info: any) => {
					return (
						<label className="form-check form-check-single form-switch mb-0 ps-0">
							<input
								className="form-check-input ms-0"
								type="checkbox"
								checked={!!info.getValue()}
								onChange={() =>
									onAutheliaToggle?.(info.row.original.id, !info.row.original.autheliaEnabled)
								}
							/>
						</label>
					);
				},
			}),
			columnHelper.accessor((row: any) => row.accessList, {
				id: "accessList",
				enableSorting: false,
				header: intl.formatMessage({ id: "column.access" }),
				cell: (info: any) => {
					return <AccessListFormatter access={info.getValue()} />;
				},
			}),
			columnHelper.accessor((row: any) => row.enabled, {
				id: "enabled",
				header: intl.formatMessage({ id: "column.status" }),
				cell: (info: any) => {
					return <TrueFalseFormatter value={info.getValue()} animated={false} />;
				},
			}),
			columnHelper.display({
				id: "id",
				cell: (info: any) => {
					return (
						<span className="dropdown">
							<button
								type="button"
								className="btn dropdown-toggle btn-action btn-sm px-1"
								data-bs-boundary="viewport"
								data-bs-toggle="dropdown"
							>
								<IconDotsVertical />
							</button>
							<div className="dropdown-menu dropdown-menu-end">
								<span className="dropdown-header">
									<T
										id="object.actions-title"
										tData={{ object: "proxy-host" }}
										data={{ id: info.row.original.id }}
									/>
								</span>
								<a
									className="dropdown-item"
									href="#"
									onClick={(e) => {
										e.preventDefault();
										onEdit?.(info.row.original.id);
									}}
								>
									<IconEdit size={16} />
									<T id="action.edit" />
								</a>
								<HasPermission section={PROXY_HOSTS} permission={MANAGE} hideError>
									<a
										className="dropdown-item"
										href="#"
										onClick={(e) => {
											e.preventDefault();
											onDisableToggle?.(info.row.original.id, !info.row.original.enabled);
										}}
									>
										<IconPower size={16} />
										<T id={info.row.original.enabled ? "action.disable" : "action.enable"} />
									</a>
									<div className="dropdown-divider" />
									<a
										className="dropdown-item"
										href="#"
										onClick={(e) => {
											e.preventDefault();
											onDelete?.(info.row.original.id);
										}}
									>
										<IconTrash size={16} />
										<T id="action.delete" />
									</a>
								</HasPermission>
							</div>
						</span>
					);
				},
				meta: {
					className: "text-end w-1",
				},
			}),
		],
		[columnHelper, onEdit, onDisableToggle, onAutheliaToggle, onDelete, publicPort, probeResults],
	);

	const [sorting, setSorting] = useState<SortingState>([]);

	const tableInstance = useReactTable<ProxyHost>({
		columns,
		data,
		state: { sorting },
		onSortingChange: setSorting,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		rowCount: data.length,
		meta: {
			isFetching,
		},
		enableSortingRemoval: false,
	});

	return (
		<TableLayout
			tableInstance={tableInstance}
			emptyState={
				<EmptyData
					object="proxy-host"
					objects="proxy-hosts"
					tableInstance={tableInstance}
					onNew={onNew}
					isFiltered={isFiltered}
					color="lime"
					permissionSection={PROXY_HOSTS}
				/>
			}
		/>
	);
}
