import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Entry } from '../backend';
import { aggregateByMonth, aggregateByYear, getAvailableYears } from '../utils/analytics';
import { BarChart3 } from 'lucide-react';

interface AnalyticsSectionProps {
  entries: Entry[];
}

type ViewMode = 'monthly' | 'yearly';

export function AnalyticsSection({ entries }: AnalyticsSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  
  const availableYears = useMemo(() => getAvailableYears(entries), [entries]);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(
    availableYears.includes(currentYear) ? currentYear : availableYears[0] || currentYear
  );

  const monthlyData = useMemo(
    () => aggregateByMonth(entries, selectedYear),
    [entries, selectedYear]
  );

  const yearlyData = useMemo(
    () => aggregateByYear(entries),
    [entries]
  );

  const hasData = entries.length > 0;

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Analytics
            </CardTitle>
            <CardDescription>
              View transaction trends by month or year
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={viewMode === 'yearly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('yearly')}
            >
              Yearly
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              No data available yet. Create entries to see analytics.
            </p>
          </div>
        ) : (
          <>
            {viewMode === 'monthly' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Year:</label>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value, 10))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="month"
                        className="text-xs"
                        tick={{ fill: 'oklch(var(--muted-foreground))' }}
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fill: 'oklch(var(--muted-foreground))' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'oklch(var(--card))',
                          border: '1px solid oklch(var(--border))',
                          borderRadius: '0.5rem',
                        }}
                        labelStyle={{ color: 'oklch(var(--foreground))' }}
                      />
                      <Legend />
                      <Bar
                        dataKey="totalAmount"
                        name="Total Amount (Rs.)"
                        fill="oklch(var(--chart-1))"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="count"
                        name="Entry Count"
                        fill="oklch(var(--chart-2))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {viewMode === 'yearly' && (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="year"
                      className="text-xs"
                      tick={{ fill: 'oklch(var(--muted-foreground))' }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'oklch(var(--muted-foreground))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'oklch(var(--card))',
                        border: '1px solid oklch(var(--border))',
                        borderRadius: '0.5rem',
                      }}
                      labelStyle={{ color: 'oklch(var(--foreground))' }}
                    />
                    <Legend />
                    <Bar
                      dataKey="totalAmount"
                      name="Total Amount (Rs.)"
                      fill="oklch(var(--chart-1))"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="count"
                      name="Entry Count"
                      fill="oklch(var(--chart-2))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
