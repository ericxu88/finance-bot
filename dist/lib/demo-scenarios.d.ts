import type { UserProfile, FinancialAction } from '../types/financial.js';
export interface SuggestedAction {
    id: string;
    description: string;
    action: FinancialAction;
    expectedOutcome: string;
}
export interface DemoScenario {
    id: string;
    name: string;
    persona: string;
    description: string;
    highlights: string[];
    user: UserProfile;
    suggestedActions: SuggestedAction[];
}
export declare const demoScenarios: DemoScenario[];
export declare function getScenarioById(id: string): DemoScenario | null;
export declare function getScenarioSummaries(): Array<Omit<DemoScenario, 'user'> & {
    userId: string;
}>;
//# sourceMappingURL=demo-scenarios.d.ts.map