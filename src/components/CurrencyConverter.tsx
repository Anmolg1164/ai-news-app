
"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeftRight, Coins, Loader2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CURRENCIES = [
  { code: "USD", name: "US Dollar", flag: "🇺🇸" },
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳" },
  { code: "EUR", name: "Euro", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", flag: "🇯🇵" },
  { code: "AUD", name: "Australian Dollar", flag: "🇦🇺" },
  { code: "AED", name: "UAE Dirham", flag: "🇦🇪" },
];

export function CurrencyConverter() {
  const [amount, setAmount] = useState<string>("1");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("INR");
  const [result, setResult] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConvert = async () => {
    setLoading(true);
    try {
      // For MVP, we use a public conversion rate API or our defined tool logic
      const response = await fetch(`https://v6.exchangerate-api.com/v6/68e22858b76c810d79c6d4be/pair/${from}/${to}`);
      const data = await response.json();
      
      if (data.result === 'success') {
        const rate = data.conversion_rate;
        setResult(parseFloat(amount) * rate);
      } else {
        throw new Error("Rate unavailable");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Conversion Error",
        description: "Currency service temporarily unavailable.",
      });
    } finally {
      setLoading(false);
    }
  };

  const swap = () => {
    setFrom(to);
    setTo(from);
    setResult(null);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="p-2 rounded-xl hover:bg-white/60 transition-all text-muted-foreground hover:text-primary">
          <Coins size={22} />
        </button>
      </SheetTrigger>
      <SheetContent className="glass-dark border-primary/20 text-white w-full sm:max-w-md">
        <SheetHeader className="mb-8">
          <SheetTitle className="text-2xl font-headline font-bold text-secondary flex items-center gap-2">
            <TrendingUp /> Forex Intelligence
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Amount</label>
            <Input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              className="bg-white/5 border-white/10 text-white rounded-xl h-12 focus:ring-secondary/50"
            />
          </div>

          <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">From</label>
              <Select value={from} onValueChange={setFrom}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-dark border-white/10 text-white">
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code} className="hover:bg-white/10 cursor-pointer">
                      {c.flag} {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button variant="ghost" size="icon" onClick={swap} className="mt-6 rounded-full hover:bg-white/10">
              <ArrowLeftRight size={18} className="text-secondary" />
            </Button>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">To</label>
              <Select value={to} onValueChange={setTo}>
                <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-dark border-white/10 text-white">
                  {CURRENCIES.map(c => (
                    <SelectItem key={c.code} value={c.code} className="hover:bg-white/10 cursor-pointer">
                      {c.flag} {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleConvert} 
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-secondary text-primary font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)]"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Calculate Exchange"}
          </Button>

          {result !== null && (
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 animate-in fade-in slide-in-from-top-4">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] mb-2">Result</p>
              <h3 className="text-3xl font-headline font-bold text-secondary">
                {result.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {to}
              </h3>
              <p className="text-[10px] text-white/20 mt-2 italic">Real-time market rate applied.</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
