import cn from "classnames";
import { T } from "src/locale";

interface Props {
	value: boolean;
	trueLabel?: string;
	trueColor?: string;
	falseLabel?: string;
	falseColor?: string;
	animated?: boolean;
}
export function TrueFalseFormatter({
	value,
	trueLabel = "enabled",
	trueColor = "lime",
	falseLabel = "disabled",
	falseColor = "red",
	animated = true,
}: Props) {
	return (
		<span className={cn("status", `status-${value ? trueColor : falseColor}`)}>
			<span className={cn("status-dot", animated ? "status-dot-animated" : null)} />
			<T id={value ? trueLabel : falseLabel} />
		</span>
	);
}
