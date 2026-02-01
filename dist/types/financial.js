export function getInvestmentBalance(account) {
    return typeof account === 'number' ? account : account.balance;
}
export function getInvestmentAllocation(account) {
    if (typeof account === 'number') {
        return { stocks: 100, bonds: 0, cash: 0 };
    }
    return account.allocation;
}
export function calculatePortfolioAllocation(investments) {
    const taxableBalance = getInvestmentBalance(investments.taxable);
    const rothBalance = getInvestmentBalance(investments.rothIRA);
    const trad401kBalance = getInvestmentBalance(investments.traditional401k);
    const totalBalance = taxableBalance + rothBalance + trad401kBalance;
    if (totalBalance === 0) {
        return { stocks: 0, bonds: 0, cash: 0 };
    }
    const taxableAlloc = getInvestmentAllocation(investments.taxable);
    const rothAlloc = getInvestmentAllocation(investments.rothIRA);
    const trad401kAlloc = getInvestmentAllocation(investments.traditional401k);
    const stocks = ((taxableBalance * taxableAlloc.stocks +
        rothBalance * rothAlloc.stocks +
        trad401kBalance * trad401kAlloc.stocks) / totalBalance);
    const bonds = ((taxableBalance * taxableAlloc.bonds +
        rothBalance * rothAlloc.bonds +
        trad401kBalance * trad401kAlloc.bonds) / totalBalance);
    const cash = ((taxableBalance * (taxableAlloc.cash || 0) +
        rothBalance * (rothAlloc.cash || 0) +
        trad401kBalance * (trad401kAlloc.cash || 0)) / totalBalance);
    const other = ((taxableBalance * (taxableAlloc.other || 0) +
        rothBalance * (rothAlloc.other || 0) +
        trad401kBalance * (trad401kAlloc.other || 0)) / totalBalance);
    return {
        stocks: Math.round(stocks * 10) / 10,
        bonds: Math.round(bonds * 10) / 10,
        cash: Math.round(cash * 10) / 10,
        other: other > 0 ? Math.round(other * 10) / 10 : undefined,
    };
}
//# sourceMappingURL=financial.js.map