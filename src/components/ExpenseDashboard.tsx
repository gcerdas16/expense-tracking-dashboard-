'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingDown, CreditCard, TrendingUp, X } from 'lucide-react';
import Papa from 'papaparse';

interface ExpenseData {
    comercio: string;
    fecha: string;
    fechaDate: Date;
    monto: number;
    categoria: string;
    banco: string;
}

interface IncomeData {
    fuente: string;
    fecha: string;
    fechaDate: Date;
    monto: number;
}

interface ChartData {
    name: string;
    value: number;
}

interface BillingCycle {
    banco: string;
    diaCorte: number;
}

interface FixedExpense {
    nombre: string;
    monto: number;
}

const BILLING_CYCLES: BillingCycle[] = [
    { banco: 'CREDIX', diaCorte: 18 },
    { banco: 'PROMERICA', diaCorte: 24 },
    { banco: 'BAC', diaCorte: 24 },
    { banco: 'BCR', diaCorte: 24 },
    { banco: 'SINPE MOVIL BCR', diaCorte: 24 },
    { banco: 'T.C EFECTIVEX', diaCorte: 24 }
];

const FIXED_EXPENSES: FixedExpense[] = [
    { nombre: 'Alquiler de Vivienda', monto: 260000 },
    { nombre: 'Claro', monto: 11000 },
    { nombre: 'ESPH', monto: 25000 },
    { nombre: 'Cuota de Refrigeradora', monto: 19000 },
    { nombre: 'Cuota de Televisor', monto: 32000 },
    { nombre: 'Isayara', monto: 60000 },
    { nombre: 'EPA Belen', monto: 8800 },
    { nombre: 'YT Premium', monto: 4800 },
    { nombre: 'Microsoft', monto: 4000 },
    { nombre: 'Railway', monto: 3000 },
];

const MONTHS = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SETIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
const YEARS = ['2025', '2026', '2027', '2028', '2029', '2030'];

const ExpenseDashboard = () => {
    const [expenses, setExpenses] = useState<ExpenseData[]>([]);
    const [incomes, setIncomes] = useState<IncomeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [selectedYears, setSelectedYears] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const EXPENSES_CSV_URL = '/api/data?type=expenses';
    const INCOMES_CSV_URL = '/api/data?type=incomes';

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const expensesResponse = await fetch(EXPENSES_CSV_URL);
            if (!expensesResponse.ok) throw new Error(`Error: ${expensesResponse.status}`);
            const expensesText = await expensesResponse.text();

            const incomesResponse = await fetch(INCOMES_CSV_URL);
            if (!incomesResponse.ok) throw new Error(`Error: ${incomesResponse.status}`);
            const incomesText = await incomesResponse.text();

            Papa.parse<Record<string, string>>(expensesText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const expensesParsed = results.data.map((row) => {
                        const montoStr = (row.Monto || row.monto || '0').replace(/₡/g, '').replace(/\./g, '').replace(/,/g, '.').trim();
                        const monto = parseFloat(montoStr) || 0;
                        const fechaStr = row.Fecha || row.fecha || '';
                        const [dia, mes, año] = fechaStr.split('/');
                        const fechaDate = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));

                        return {
                            comercio: row.Comercio || row.comercio || 'Sin comercio',
                            fecha: fechaStr,
                            fechaDate: fechaDate,
                            monto: monto,
                            categoria: row.Categoría || row.Categoria || row.categoria || 'Sin categoría',
                            banco: (row.Banco || row.banco || 'Sin banco').toUpperCase()
                        };
                    }).filter((item: ExpenseData) => item.monto > 0).sort((a, b) => b.fechaDate.getTime() - a.fechaDate.getTime());
                    setExpenses(expensesParsed);
                }
            });

            Papa.parse<Record<string, string>>(incomesText, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    const incomesParsed = results.data.map((row) => {
                        const montoStr = (row.Monto || row.monto || '0').replace(/₡/g, '').replace(/\./g, '').replace(/,/g, '.').trim();
                        const monto = parseFloat(montoStr) || 0;
                        const fechaStr = row['Fecha de Ingreso'] || row['Fecha de ingreso'] || row.Fecha || row.fecha || '';

                        let fechaDate: Date;
                        if (fechaStr.includes('/')) {
                            const [dia, mes, año] = fechaStr.split('/');
                            fechaDate = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
                        } else {
                            fechaDate = new Date(fechaStr);
                        }

                        return {
                            fuente: row['Fuente del Ingreso'] || row.Fuente || row.fuente || 'Sin fuente',
                            fecha: fechaStr,
                            fechaDate: fechaDate,
                            monto: monto
                        };
                    }).filter((item: IncomeData) => item.monto > 0);
                    setIncomes(incomesParsed);
                    setLoading(false);
                }
            });
        } catch (err) {
            setError(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center"><div className="text-white text-2xl">Cargando datos...</div></div>;
    if (error) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center"><div className="text-red-400 text-2xl">{error}</div></div>;

    const getDateRange = (banco: string, monthIndex: number, year: number) => {
        const cycle = BILLING_CYCLES.find(c => c.banco === banco);
        if (!cycle) return null;
        const diaCorte = cycle.diaCorte;
        const mesInicio = monthIndex === 0 ? 11 : monthIndex - 1;
        const añoInicio = monthIndex === 0 ? year - 1 : year;
        const fechaInicio = new Date(añoInicio, mesInicio, diaCorte, 0, 0, 0);
        const fechaFin = new Date(year, monthIndex, diaCorte - 1, 23, 59, 59);
        return { fechaInicio, fechaFin };
    };

    const isInBillingPeriod = (fecha: Date, banco: string, monthIndex: number, year: number): boolean => {
        const range = getDateRange(banco, monthIndex, year);
        if (!range) return false;
        const itemTime = fecha.getTime();
        return itemTime >= range.fechaInicio.getTime() && itemTime <= range.fechaFin.getTime();
    };

    let filteredExpenses = expenses;
    let filteredIncomes = incomes;

    if (selectedBanks.length > 0) filteredExpenses = filteredExpenses.filter(item => selectedBanks.includes(item.banco));

    if (selectedMonths.length > 0 && selectedYears.length > 0) {
        filteredExpenses = filteredExpenses.filter(item => selectedMonths.some(month => {
            const monthIndex = MONTHS.indexOf(month);
            return selectedYears.some(yearStr => isInBillingPeriod(item.fechaDate, item.banco, monthIndex, parseInt(yearStr)));
        }));
        filteredIncomes = filteredIncomes.filter(item => selectedMonths.some(month => {
            const monthIndex = MONTHS.indexOf(month);
            return selectedYears.some(yearStr => {
                const year = parseInt(yearStr);
                if (selectedBanks.length > 0) return selectedBanks.some(banco => isInBillingPeriod(item.fechaDate, banco, monthIndex, year));
                return BILLING_CYCLES.some(cycle => isInBillingPeriod(item.fechaDate, cycle.banco, monthIndex, year));
            });
        }));
    }

    const displayExpenses = selectedCategory ? filteredExpenses.filter(item => item.categoria === selectedCategory) : filteredExpenses;
    const totalGastos = filteredExpenses.reduce((sum, item) => sum + item.monto, 0);
    const totalGastosFijos = FIXED_EXPENSES.reduce((sum, item) => sum + item.monto, 0);

    const categorias = [...new Set(filteredExpenses.map(d => d.categoria))];
    const COLORS = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4', '#f97316'];
    const gastosPorCategoria: ChartData[] = categorias.map(cat => ({
        name: cat,
        value: filteredExpenses.filter(d => d.categoria === cat).reduce((sum, d) => sum + d.monto, 0)
    })).sort((a, b) => b.value - a.value);
    const uniqueBanks = [...new Set(expenses.map(item => item.banco))].sort();

    const getDisplayRange = () => {
        if (selectedMonths.length > 0 && selectedYears.length > 0) {
            if (selectedMonths.length === 1 && selectedYears.length === 1) {
                const monthIndex = MONTHS.indexOf(selectedMonths[0]);
                const year = parseInt(selectedYears[0]);
                if (selectedBanks.length === 1) {
                    const range = getDateRange(selectedBanks[0], monthIndex, year);
                    if (range) return `${range.fechaInicio.getDate()} ${MONTHS[range.fechaInicio.getMonth()]} ${range.fechaInicio.getFullYear()} al ${range.fechaFin.getDate()} ${MONTHS[range.fechaFin.getMonth()]} ${range.fechaFin.getFullYear()}`;
                } else if (selectedBanks.length > 1) return `Periodo de corte de cada tarjeta seleccionada para ${selectedMonths[0]} ${selectedYears[0]}`;
                else return `Periodo de corte de todas las tarjetas para ${selectedMonths[0]} ${selectedYears[0]}`;
            } else {
                const monthsText = selectedMonths.length > 3 ? `${selectedMonths.length} meses` : selectedMonths.join(', ');
                return `Periodos seleccionados: ${monthsText} de ${selectedYears.join(', ')}`;
            }
        }
        return null;
    };

    const displayRange = getDisplayRange();

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
                    <DollarSign className="text-purple-400" size={40} />
                    Dashboard de Gastos
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div>
                        <label className="text-white text-sm mb-2 block font-semibold">Tarjetas: ({selectedBanks.length > 0 ? selectedBanks.length : 'Todas'})</label>
                        <div className="bg-slate-800 border border-purple-500 rounded-lg p-4 max-h-48 overflow-y-auto">
                            <div className="space-y-2">
                                {uniqueBanks.map(banco => (
                                    <label key={banco} className="flex items-center gap-3 cursor-pointer hover:bg-slate-700/50 p-2 rounded">
                                        <input type="checkbox" checked={selectedBanks.includes(banco)} onChange={(e) => { if (e.target.checked) setSelectedBanks([...selectedBanks, banco]); else setSelectedBanks(selectedBanks.filter(b => b !== banco)); setSelectedCategory(null); }} className="w-4 h-4 text-purple-500 border-purple-400 rounded focus:ring-purple-500" />
                                        <span className="text-white text-sm">{banco}</span>
                                    </label>
                                ))}
                            </div>
                            {selectedBanks.length > 0 && <button onClick={() => { setSelectedBanks([]); setSelectedCategory(null); }} className="mt-3 w-full text-purple-400 hover:text-purple-300 text-sm font-medium">Limpiar selección</button>}
                        </div>
                    </div>

                    <div>
                        <label className="text-white text-sm mb-2 block font-semibold">Meses de Cierre: ({selectedMonths.length > 0 ? selectedMonths.length : 'Todos'})</label>
                        <div className="bg-slate-800 border border-purple-500 rounded-lg p-4 max-h-48 overflow-y-auto">
                            <div className="space-y-2">
                                {MONTHS.map(month => (
                                    <label key={month} className="flex items-center gap-3 cursor-pointer hover:bg-slate-700/50 p-2 rounded">
                                        <input type="checkbox" checked={selectedMonths.includes(month)} onChange={(e) => { if (e.target.checked) setSelectedMonths([...selectedMonths, month]); else setSelectedMonths(selectedMonths.filter(m => m !== month)); setSelectedCategory(null); }} className="w-4 h-4 text-purple-500 border-purple-400 rounded focus:ring-purple-500" />
                                        <span className="text-white text-sm">{month}</span>
                                    </label>
                                ))}
                            </div>
                            {selectedMonths.length > 0 && <button onClick={() => { setSelectedMonths([]); setSelectedCategory(null); }} className="mt-3 w-full text-purple-400 hover:text-purple-300 text-sm font-medium">Limpiar selección</button>}
                        </div>
                    </div>

                    <div>
                        <label className="text-white text-sm mb-2 block font-semibold">Años: ({selectedYears.length > 0 ? selectedYears.length : 'Todos'})</label>
                        <div className="bg-slate-800 border border-purple-500 rounded-lg p-4 max-h-48 overflow-y-auto">
                            <div className="space-y-2">
                                {YEARS.map(year => (
                                    <label key={year} className="flex items-center gap-3 cursor-pointer hover:bg-slate-700/50 p-2 rounded">
                                        <input type="checkbox" checked={selectedYears.includes(year)} onChange={(e) => { if (e.target.checked) setSelectedYears([...selectedYears, year]); else setSelectedYears(selectedYears.filter(y => y !== year)); setSelectedCategory(null); }} className="w-4 h-4 text-purple-500 border-purple-400 rounded focus:ring-purple-500" />
                                        <span className="text-white text-sm">{year}</span>
                                    </label>
                                ))}
                            </div>
                            {selectedYears.length > 0 && <button onClick={() => { setSelectedYears([]); setSelectedCategory(null); }} className="mt-3 w-full text-purple-400 hover:text-purple-300 text-sm font-medium">Limpiar selección</button>}
                        </div>
                    </div>
                </div>

                {displayRange && (
                    <div className="mb-8 bg-purple-900/30 border border-purple-500/50 rounded-lg p-4">
                        <p className="text-white text-center"><span className="font-semibold text-purple-300">Periodo seleccionado:</span> {displayRange}</p>
                    </div>
                )}

                {selectedCategory && (
                    <div className="mb-6 bg-pink-900/30 border border-pink-500/50 rounded-lg p-4 flex items-center justify-between">
                        <p className="text-white"><span className="font-semibold text-pink-300">Mostrando categoría:</span> {selectedCategory}</p>
                        <button onClick={() => setSelectedCategory(null)} className="text-pink-400 hover:text-pink-300 flex items-center gap-2"><X size={20} />Limpiar filtro</button>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 shadow-2xl transform hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm mb-1">Total Gastado</p>
                                <p className="text-white text-3xl font-bold">₡{totalGastos.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                            </div>
                            <DollarSign className="text-purple-200" size={48} />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 shadow-2xl transform hover:scale-105 transition-transform">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm mb-1">Total Transacciones</p>
                                <p className="text-white text-3xl font-bold">{displayExpenses.length}</p>
                            </div>
                            <CreditCard className="text-blue-200" size={48} />
                        </div>
                    </div>
                </div>

                {selectedMonths.length === 1 && selectedYears.length === 1 && (() => {
                    const monthIndex = MONTHS.indexOf(selectedMonths[0]);
                    const year = parseInt(selectedYears[0]);

                    const inicioIngresos = new Date(year, monthIndex, 24, 0, 0, 0);
                    const añoFin = monthIndex === 11 ? year + 1 : year;
                    const mesFin = monthIndex === 11 ? 0 : monthIndex + 1;
                    const finIngresos = new Date(añoFin, mesFin, 23, 23, 59, 59);

                    const ingresosDelMes = incomes.filter(income => {
                        const incomeTime = income.fechaDate.getTime();
                        return incomeTime >= inicioIngresos.getTime() && incomeTime <= finIngresos.getTime();
                    });
                    const totalIngresosDelMes = ingresosDelMes.reduce((sum, item) => sum + item.monto, 0);

                    const gastosCredixPromerica = expenses.filter(expense => {
                        const banco = expense.banco.toUpperCase();
                        if (banco !== 'CREDIX' && banco !== 'PROMERICA' && banco !== 'T.C EFECTIVEX') return false;
                        return isInBillingPeriod(expense.fechaDate, banco, monthIndex, year);
                    });
                    const totalGastosCredixPromerica = gastosCredixPromerica.reduce((sum, item) => sum + item.monto, 0);
                    const disponibleProximoMes = totalIngresosDelMes - totalGastosCredixPromerica - totalGastosFijos;
                    const siguienteMes = MONTHS[(monthIndex + 1) % 12];

                    return (
                        <div className="mb-8 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-8 shadow-2xl border-4 border-emerald-400">
                            <div className="text-center">
                                <p className="text-emerald-100 text-lg mb-2 font-semibold">Disponible para {siguienteMes}</p>
                                <p className={`text-white text-5xl font-bold mb-4 ${disponibleProximoMes < 0 ? 'text-red-300' : ''}`}>₡{disponibleProximoMes.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm">
                                    <div className="bg-white/10 rounded-lg p-3"><p className="text-emerald-200 mb-1">Ingresos de {selectedMonths[0]}</p><p className="text-white font-bold">₡{totalIngresosDelMes.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                                    <div className="bg-white/10 rounded-lg p-3"><p className="text-emerald-200 mb-1">Gastos CREDIX + PROMERICA + EFECTIVEX</p><p className="text-white font-bold">₡{totalGastosCredixPromerica.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                                    <div className="bg-white/10 rounded-lg p-3"><p className="text-emerald-200 mb-1">Gastos Fijos</p><p className="text-white font-bold">₡{totalGastosFijos.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                                </div>
                            </div>
                        </div>
                    );
                })()}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-4">Gastos por Categoría</h2>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                            {gastosPorCategoria.length > 0 ? gastosPorCategoria.map((cat, index) => (
                                <div key={index} onClick={() => setSelectedCategory(cat.name)} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-white font-medium">{cat.name}</span>
                                    </div>
                                    <span className="text-purple-400 font-bold">₡{cat.value.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            )) : <div className="h-[200px] flex items-center justify-center text-gray-400">No hay datos</div>}
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-4">Gastos Fijos Mensuales</h2>
                        <div className="space-y-3 max-h-[250px] overflow-y-auto mb-4">
                            {FIXED_EXPENSES.map((expense, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-lg">
                                    <span className="text-white font-medium">{expense.nombre}</span>
                                    <span className="text-orange-400 font-bold">₡{expense.monto.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-t border-slate-600 pt-3">
                            <div className="flex justify-between items-center p-3 bg-orange-900/30 rounded-lg">
                                <span className="text-orange-200 font-bold">Total Gastos Fijos</span>
                                <span className="text-white text-xl font-bold">₡{totalGastosFijos.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 shadow-2xl lg:col-span-2">
                        <h2 className="text-2xl font-bold text-white mb-4">Transacciones ({displayExpenses.length}){selectedCategory && <span className="text-pink-400"> - {selectedCategory}</span>}</h2>
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            {displayExpenses.length > 0 ? (
                                <table className="w-full text-left">
                                    <thead className="sticky top-0 bg-slate-800 z-10">
                                        <tr className="border-b border-slate-700">
                                            <th className="text-purple-400 pb-3 pr-4 pt-3">Comercio</th>
                                            <th className="text-purple-400 pb-3 pr-4 pt-3">Fecha</th>
                                            <th className="text-purple-400 pb-3 pr-4 pt-3">Categoría</th>
                                            <th className="text-purple-400 pb-3 pr-4 pt-3">Banco</th>
                                            <th className="text-purple-400 pb-3 text-right pt-3">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayExpenses.map((item, idx) => (
                                            <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                                                <td className="py-3 pr-4 text-white">{item.comercio}</td>
                                                <td className="py-3 pr-4 text-gray-300">{item.fecha}</td>
                                                <td className="py-3 pr-4 text-gray-300">{item.categoria}</td>
                                                <td className="py-3 pr-4 text-gray-300">{item.banco}</td>
                                                <td className="py-3 text-right">
                                                    <span className="text-pink-400 font-bold">₡{item.monto.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <div className="h-[200px] flex items-center justify-center text-gray-400">No hay transacciones para mostrar</div>}
                        </div>
                    </div>
                </div>

                <p className="text-gray-400 text-sm text-center mt-8">
                    Última actualización: {new Date().toLocaleString()} • Se actualiza automáticamente cada 30 segundos
                </p>
            </div>
        </div>
    );
};

export default ExpenseDashboard;