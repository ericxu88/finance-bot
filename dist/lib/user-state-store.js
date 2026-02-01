class UserStateStore {
    store = new Map();
    get(userId) {
        return this.store.get(userId);
    }
    set(userId, user) {
        this.store.set(userId, user);
    }
    getOrCreate(userId, defaultUser) {
        const existing = this.store.get(userId);
        if (existing)
            return existing;
        const clone = { ...defaultUser, id: userId, updatedAt: new Date() };
        this.store.set(userId, clone);
        return clone;
    }
    has(userId) {
        return this.store.has(userId);
    }
    delete(userId) {
        return this.store.delete(userId);
    }
}
export const userStateStore = new UserStateStore();
//# sourceMappingURL=user-state-store.js.map