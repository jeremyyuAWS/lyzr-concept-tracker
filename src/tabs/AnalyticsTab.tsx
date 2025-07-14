import { Demo } from '@/types/demo';
import { AnalyticsPanel } from '@/components/AnalyticsPanel';

interface AnalyticsTabProps {
  demos: Demo[];
}

export function AnalyticsTab({ demos }: AnalyticsTabProps) {
  return <AnalyticsPanel demos={demos} />;
}