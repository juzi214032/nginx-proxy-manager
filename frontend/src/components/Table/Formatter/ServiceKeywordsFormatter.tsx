import { useRef, useState } from "react";

interface Props {
	value: string;
	onCommit: (next: string) => void;
}

export function ServiceKeywordsFormatter({ value, onCommit }: Props) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value);
	const doneRef = useRef(false);

	const startEdit = () => {
		setDraft(value);
		doneRef.current = false;
		setEditing(true);
	};

	const commit = () => {
		if (doneRef.current) {
			return;
		}
		doneRef.current = true;
		setEditing(false);
		const next = draft.trim();
		if (next !== value) {
			onCommit(next);
		}
	};

	const cancel = () => {
		doneRef.current = true;
		setEditing(false);
	};

	if (!editing) {
		return (
			<span className="cursor-pointer" onClick={startEdit}>
				{value || <span className="text-secondary">-</span>}
			</span>
		);
	}

	return (
		<input
			className="form-control form-control-sm"
			autoFocus
			value={draft}
			onChange={(e: any) => setDraft(e.target.value)}
			onFocus={(e: any) => e.target.select()}
			onBlur={commit}
			onKeyDown={(e: any) => {
				if (e.key === "Enter") {
					commit();
				} else if (e.key === "Escape") {
					cancel();
				}
			}}
		/>
	);
}
