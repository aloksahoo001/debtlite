'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

type Payable = {
  title: string;
  extra_pay: number;
  interest_per_month: number;
  remaining_amount: number;
};

export default function Insights() {
  const supabase = createClient();
  const [payables, setPayables] = useState<Payable[]>([]);

  useEffect(() => {
    const fetchPayables = async () => {
      const { data, error } = await supabase
        .from('monthly_payables')
        .select('title, extra_pay, interest_per_month, remaining_amount')
        .eq('is_closed', false);

      if (error) {
        console.error('Error fetching payables:', error);
        return;
      }

      setPayables(data || []);
    };

    fetchPayables();
  }, []);

  const topExtraPayables = [...payables]
    .filter(p => p.extra_pay > 0)
    .sort((a, b) => b.extra_pay - a.extra_pay)
    .slice(0, 10);

  const topInterestPayables = [...payables]
    .filter(p => p.interest_per_month > 0)
    .sort((a, b) => b.interest_per_month - a.interest_per_month)
    .slice(0, 10);

  const totalExtra = topExtraPayables.reduce((sum, p) => sum + p.extra_pay, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
      {/* Card 1: Extra Paying Payables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            Top 10 Extra Paying Payables
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topExtraPayables.length > 0 ? (
            topExtraPayables.map((p, idx) => (
              <div key={idx} className="flex justify-between border-b pb-1">
                <div>
                  <div className="font-medium">{idx+1}. {p.title}</div>
                  <div className="text-sm text-muted-foreground">
                    Remaining: ₹{p.remaining_amount.toLocaleString()}
                  </div>
                </div>
                <div className="text-right font-semibold text-orange-600">
                  +₹{p.extra_pay.toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No extra payments found.</div>
          )}
        </CardContent>
        {topExtraPayables.length > 0 && (
          <CardFooter className="text-right font-semibold text-orange-700">
            Total Extra Paying: ₹{totalExtra.toLocaleString()}
          </CardFooter>
        )}
      </Card>

      {/* Card 2: Highest Interest Payables */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base md:text-lg">
            Top 10 Highest Interest Paid Payables
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {topInterestPayables.length > 0 ? (
            topInterestPayables.map((p, idx) => (
              <div key={idx} className="flex justify-between border-b pb-1">
                <div>
                  <div className="font-medium">{idx+1}. {p.title}</div>
                  <div className="text-sm text-muted-foreground">
                    Remaining: ₹{p.remaining_amount.toLocaleString()}
                  </div>
                </div>
                <div className="text-right font-semibold text-red-600">
                  {(p.interest_per_month * 12).toFixed(2)}%/yr
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No high interest payables found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}