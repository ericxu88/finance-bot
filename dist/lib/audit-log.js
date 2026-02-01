const historyByUser = new Map();
let idCounter = 0;
function nextId() {
    idCounter += 1;
    return `exec_${Date.now()}_${idCounter}`;
}
export function appendExecutedAction(userId, record) {
    const entry = {
        ...record,
        id: nextId(),
        userId,
    };
    const list = historyByUser.get(userId) ?? [];
    list.push(entry);
    historyByUser.set(userId, list);
    return entry;
}
export function getHistory(userId, limit = 50) {
    const list = historyByUser.get(userId) ?? [];
    return [...list].reverse().slice(0, limit);
}
export function getRecordById(userId, recordId) {
    const list = historyByUser.get(userId) ?? [];
    return list.find((r) => r.id === recordId);
}
export function getLastRecord(userId) {
    const list = historyByUser.get(userId) ?? [];
    return list[list.length - 1];
}
export function removeLastRecord(userId) {
    const list = historyByUser.get(userId) ?? [];
    if (list.length === 0)
        return false;
    list.pop();
    if (list.length === 0)
        historyByUser.delete(userId);
    else
        historyByUser.set(userId, list);
    return true;
}
//# sourceMappingURL=audit-log.js.map