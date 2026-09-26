import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
    PROPERTY_STATUS_OPTIONS,
    normalizePropertyStatus,
    propertyStatusTriggerBorder,
    type PropertyStatusValue,
} from "@/lib/property-status";

export { PROPERTY_STATUS_OPTIONS, normalizePropertyStatus, type PropertyStatusValue } from "@/lib/property-status";

type Props = {
    id?: string;
    value: string;
    onChange: (value: PropertyStatusValue) => void;
    disabled?: boolean;
    className?: string;
};

export const PropertyStatusSelect = ({ id, value, onChange, disabled, className }: Props) => {
    const v = normalizePropertyStatus(value);

    return (
        <div className={cn("space-y-2", className)}>
            {id ? (
                <Label htmlFor={id}>Status</Label>
            ) : (
                <Label>Status</Label>
            )}
            <Select value={v} onValueChange={(next) => onChange(normalizePropertyStatus(next))} disabled={disabled}>
                <SelectTrigger
                    id={id}
                    size="default"
                    className={cn(
                        "h-11 w-full min-w-0 border-l-4 bg-transparent shadow-xs pl-3",
                        propertyStatusTriggerBorder(v),
                    )}
                >
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent position="popper">
                    {PROPERTY_STATUS_OPTIONS.map((opt) => (
                        <SelectItem
                            key={opt.value}
                            value={opt.value}
                            textValue={opt.label}
                            className="py-2.5"
                        >
                            <span className="flex items-center gap-2">
                                <span
                                    className={cn(
                                        "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold capitalize",
                                        opt.badgeClass,
                                    )}
                                >
                                    {opt.label}
                                </span>
                            </span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};
