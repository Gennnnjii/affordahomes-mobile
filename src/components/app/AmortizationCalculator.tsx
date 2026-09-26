import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CalculatorIcon } from "lucide-react";

const PHP = new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
});

const TERMS = [5, 10, 15, 20, 25, 30] as const;

interface AmortizationCalculatorProps {
    initialPrice?: number;
    compact?: boolean;
}

function monthlyPayment(principal: number, annualRatePercent: number, termYears: number): number {
    if (principal <= 0 || annualRatePercent <= 0 || termYears <= 0) return 0;
    const r = annualRatePercent / 100 / 12;
    const n = termYears * 12;
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export const AmortizationCalculator = ({ initialPrice = 0, compact = false }: AmortizationCalculatorProps) => {
    const [price, setPrice] = useState(initialPrice > 0 ? String(initialPrice) : "");
    const [downPct, setDownPct] = useState("20");
    const [rate, setRate] = useState("6.5");
    const [term, setTerm] = useState<number>(20);

    const priceNum = parseFloat(price.replace(/,/g, "")) || 0;
    const downPctNum = Math.min(100, Math.max(0, parseFloat(downPct) || 0));
    const rateNum = parseFloat(rate) || 0;

    const downAmount = priceNum * (downPctNum / 100);
    const loanAmount = priceNum - downAmount;

    const monthly = useMemo(
        () => monthlyPayment(loanAmount, rateNum, term),
        [loanAmount, rateNum, term],
    );

    const totalPayment = monthly * term * 12;
    const totalInterest = totalPayment - loanAmount;

    const bracketRequired = priceNum > 0 ? priceNum * 0.016 : null;

    return (
        <Card className={compact ? "border-border/80 shadow-sm" : "border-border/80 shadow-sm"}>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <CalculatorIcon className="text-primary size-4" />
                    Amortization calculator
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="calc-price">Property price (₱)</Label>
                        <Input
                            id="calc-price"
                            type="number"
                            min={0}
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="e.g. 1500000"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="calc-down">Down payment (%)</Label>
                        <Input
                            id="calc-down"
                            type="number"
                            min={0}
                            max={100}
                            step={5}
                            value={downPct}
                            onChange={(e) => setDownPct(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="calc-rate">Interest rate (% per year)</Label>
                        <Input
                            id="calc-rate"
                            type="number"
                            min={0}
                            step={0.125}
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                        />
                        <p className="text-muted-foreground text-xs">
                            Pag-IBIG: ~5.375% – 6.5%. Bank loans: ~7% – 9%.
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <Label>Loan term (years)</Label>
                        <div className="flex flex-wrap gap-2">
                            {TERMS.map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTerm(t)}
                                    className={`rounded-md border px-3 py-1 text-sm font-medium transition-colors ${
                                        term === t
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border bg-background hover:bg-muted"
                                    }`}
                                >
                                    {t}y
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {priceNum > 0 && loanAmount > 0 && monthly > 0 && (
                    <>
                        <Separator />
                        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Down payment</p>
                                <p className="font-semibold">{PHP.format(downAmount)}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Loan amount</p>
                                <p className="font-semibold">{PHP.format(loanAmount)}</p>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <p className="text-base font-medium">Monthly payment</p>
                                <p className="text-primary text-xl font-bold">{PHP.format(monthly)}</p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Total payment ({term} years)</span>
                                <span>{PHP.format(totalPayment)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Total interest paid</span>
                                <span>{PHP.format(totalInterest)}</span>
                            </div>
                        </div>

                        {bracketRequired != null && (
                            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 dark:border-blue-800/40 dark:bg-blue-900/20">
                                <p className="text-xs text-blue-800 dark:text-blue-300">
                                    <span className="font-semibold">Salary bracket required:</span>{" "}
                                    {PHP.format(bracketRequired)} / month — buyer's gross income should meet or exceed this.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};
