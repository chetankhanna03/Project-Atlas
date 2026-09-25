import React from 'react';
import { ActiveTab } from '../../types';
import { OceanWorkspace } from './OceanWorkspace';
export const DashboardView: React.FC<{ setActiveTab: (tab: ActiveTab) => void; onGenerateReport: () => void }> = () => <OceanWorkspace mode='dashboard' />;
