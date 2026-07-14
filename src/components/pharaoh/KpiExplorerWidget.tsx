import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { LegacyViewWrapper } from './LegacyViewWrapper';

interface KpiExplorerWidgetProps {
  legacy: any;
  clientName: string;
}

export function KpiExplorerWidget({ legacy, clientName }: KpiExplorerWidgetProps) {
  if (!legacy) return null;
  
  const args = React.useMemo(() => [clientName], [clientName]);
  
  return (
    <Card className="shadow-sm border-0 ring-1 ring-black/5 bg-white mb-8 overflow-hidden">
      <CardContent className="p-0">
        <LegacyViewWrapper legacy={legacy} viewFn="openClientKpix" args={args} />
      </CardContent>
    </Card>
  );
}
