import type { UserProfile } from '../types/financial.js';
declare class UserStateStore {
    private store;
    get(userId: string): UserProfile | undefined;
    set(userId: string, user: UserProfile): void;
    getOrCreate(userId: string, defaultUser: UserProfile): UserProfile;
    has(userId: string): boolean;
    delete(userId: string): boolean;
}
export declare const userStateStore: UserStateStore;
export {};
//# sourceMappingURL=user-state-store.d.ts.map