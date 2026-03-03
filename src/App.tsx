import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  ReceiptText, 
  PlusCircle, 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Download,
  Filter,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BookOpen,
  PieChart as PieChartIcon,
  Activity,
  User,
  LogOut
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
  Label
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Transaction, Category, TransactionType, PaymentType } from "./types";
import { DEFAULT_CATEGORIES } from "./constants";
import { Card, Button, Input, Select } from "./components/UI";
import { formatCurrency, formatDate, cn } from "./utils/utils";
import { exportToExcel, exportToPDF } from "./utils/export";
import { Login } from "./components/Login";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    const lastUser = localStorage.getItem("ezy_last_user");
    // We don't auto-login for security, but we could if we wanted "remember me"
    // For now, we just wait for the Login component
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const savedTransactions = localStorage.getItem(`ezy_transactions_${currentUser}`);
      const savedCategories = localStorage.getItem(`ezy_categories_${currentUser}`);
      
      if (savedTransactions) setTransactions(JSON.parse(savedTransactions));
      else setTransactions([]);

      if (savedCategories) setCategories(JSON.parse(savedCategories));
      else setCategories(DEFAULT_CATEGORIES);
    }
  }, [isAuthenticated, currentUser]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      localStorage.setItem(`ezy_transactions_${currentUser}`, JSON.stringify(transactions));
    }
  }, [transactions, isAuthenticated, currentUser]);

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      localStorage.setItem(`ezy_categories_${currentUser}`, JSON.stringify(categories));
    }
  }, [categories, isAuthenticated, currentUser]);

  const handleLogin = (username: string) => {
    setCurrentUser(username);
    setIsAuthenticated(true);
    localStorage.setItem("ezy_last_user", username);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setTransactions([]);
    setCategories(DEFAULT_CATEGORIES);
  };

  const [activeTab, setActiveTab] = useState<"dashboard" | "journal" | "categories" | "ledger">("dashboard");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Form State
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    type: "expense" as TransactionType,
    categoryId: DEFAULT_CATEGORIES[0].id,
    paymentType: "Cash" as PaymentType,
    date: new Date().toISOString().split("T")[0]
  });

  const [newCategory, setNewCategory] = useState({
    name: "",
    color: "#000000",
    budget: ""
  });

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const filteredTransactions = transactions.filter(t => {
    const category = categories.find(c => c.id === t.categoryId);
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = (
      t.description.toLowerCase().includes(searchLower) ||
      category?.name.toLowerCase().includes(searchLower) ||
      t.type.toLowerCase().includes(searchLower)
    );

    const matchesStartDate = !startDate || t.date >= startDate;
    const matchesEndDate = !endDate || t.date <= endDate;

    return matchesSearch && matchesStartDate && matchesEndDate;
  });

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate]);

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.description || !newTransaction.amount) return;

    const transaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      type: newTransaction.type,
      categoryId: newTransaction.categoryId,
      paymentType: newTransaction.paymentType,
      date: newTransaction.date
    };

    setTransactions([transaction, ...transactions]);
    setIsAddModalOpen(false);
    setNewTransaction({
      description: "",
      amount: "",
      type: "expense",
      categoryId: categories[0]?.id || DEFAULT_CATEGORIES[0].id,
      paymentType: "Cash",
      date: new Date().toISOString().split("T")[0]
    });
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name) return;

    if (editingCategory) {
      setCategories(categories.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, name: newCategory.name, color: newCategory.color, budget: newCategory.budget ? parseFloat(newCategory.budget) : undefined }
          : cat
      ));
      setEditingCategory(null);
    } else {
      const category: Category = {
        id: Math.random().toString(36).substr(2, 9),
        name: newCategory.name,
        icon: "Tag",
        color: newCategory.color,
        budget: newCategory.budget ? parseFloat(newCategory.budget) : undefined
      };
      setCategories([...categories, category]);
    }

    setIsCategoryModalOpen(false);
    setNewCategory({ name: "", color: "#000000", budget: "" });
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // Stats Calculations
  const totalIncome = transactions
    .filter(t => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
    
  const balance = totalIncome - totalExpenses;

  // Advanced Stats
  const topCategory = categories.map(cat => {
    const amount = transactions
      .filter(t => t.categoryId === cat.id && t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);
    return { name: cat.name, value: amount, color: cat.color };
  }).sort((a, b) => b.value - a.value)[0];

  const dailyAverage = totalExpenses / (transactions.length > 0 ? 30 : 1); // Mocking 30 days for average
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  const categoryData = categories.map(cat => {
    const amount = transactions
      .filter(t => t.categoryId === cat.id && t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);
    return { name: cat.name, value: amount, color: cat.color };
  }).filter(d => d.value > 0);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const income = transactions
      .filter(t => t.date === dateStr && t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions
      .filter(t => t.date === dateStr && t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      date: d.toLocaleDateString("en-US", { weekday: "short" }),
      income,
      expenses,
      fullDate: dateStr
    };
  }).reverse();

  const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const monthName = d.toLocaleDateString("en-US", { month: "short" });
    const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    const income = transactions
      .filter(t => t.date.startsWith(yearMonth) && t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = transactions
      .filter(t => t.date.startsWith(yearMonth) && t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);
      
    return { 
      month: monthName, 
      income, 
      expenses,
      net: income - expenses
    };
  }).reverse();

  // Balance History Calculation
  const balanceHistory = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    
    // Calculate balance up to this date
    const incomeToDate = transactions
      .filter(t => t.date <= dateStr && t.type === "income")
      .reduce((acc, t) => acc + t.amount, 0);
    const expensesToDate = transactions
      .filter(t => t.date <= dateStr && t.type === "expense")
      .reduce((acc, t) => acc + t.amount, 0);
      
    return {
      date: d.toLocaleDateString("en-US", { month: 'short', day: 'numeric' }),
      balance: incomeToDate - expensesToDate,
      fullDate: dateStr
    };
  }).reverse();

  return (
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        <Login key="login" onLogin={handleLogin} />
      ) : (
        <div key="app" className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] pb-20 md:pb-0">
          {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 p-6 flex-col gap-8 sticky top-0 h-screen">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <ReceiptText size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">EZY Tracker</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
              activeTab === "dashboard" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <LayoutDashboard size={20} />
            <span className="font-semibold">Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveTab("journal")}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
              activeTab === "journal" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <ReceiptText size={20} />
            <span className="font-semibold">Journal</span>
          </button>
          <button 
            onClick={() => setActiveTab("ledger")}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
              activeTab === "ledger" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <BookOpen size={20} />
            <span className="font-semibold">Ledger</span>
          </button>
          <button 
            onClick={() => setActiveTab("categories")}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left",
              activeTab === "categories" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/10" : "text-slate-500 hover:bg-slate-100"
            )}
          >
            <Settings size={20} />
            <span className="font-semibold">Categories</span>
          </button>
        </nav>

        <div className="mt-auto">
          <Button 
            variant="brand"
            onClick={() => setIsAddModalOpen(true)}
            className="w-full gap-2 py-6 text-lg shadow-xl shadow-blue-500/20"
          >
            <PlusCircle size={20} />
            Add Entry
          </Button>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left w-full text-red-500 hover:bg-red-50 mt-4"
          >
            <LogOut size={20} />
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 px-6 py-3 flex justify-between items-center z-40">
        <button 
          onClick={() => setActiveTab("dashboard")}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === "dashboard" ? "text-blue-600" : "text-slate-400"
          )}
        >
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab("journal")}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === "journal" ? "text-blue-600" : "text-slate-400"
          )}
        >
          <ReceiptText size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Journal</span>
        </button>
        
        <button 
          onClick={() => setActiveTab("ledger")}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === "ledger" ? "text-blue-600" : "text-slate-400"
          )}
        >
          <BookOpen size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Ledger</span>
        </button>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full flex items-center justify-center text-white -mt-12 shadow-xl shadow-blue-500/30 border-4 border-white"
        >
          <PlusCircle size={28} />
        </button>

        <button 
          onClick={() => setActiveTab("categories")}
          className={cn(
            "flex flex-col items-center gap-1 transition-all",
            activeTab === "categories" ? "text-blue-600" : "text-slate-400"
          )}
        >
          <Settings size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Setup</span>
        </button>
        <button 
          onClick={() => exportToPDF(transactions, categories)}
          className="flex flex-col items-center gap-1 text-slate-400"
        >
          <Download size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Export</span>
        </button>

        <button 
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-red-500"
        >
          <LogOut size={24} />
          <span className="text-[10px] font-bold uppercase tracking-wider">Logout</span>
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="mb-8 md:mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                <User size={activeTab === "dashboard" ? 32 : 24} />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                  {activeTab === "dashboard" ? `Hello, ${currentUser}!` : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>
                <p className="text-sm md:text-base text-slate-500 font-semibold">
                  {activeTab === "dashboard" 
                    ? `You've saved ${formatCurrency(balance)} so far. Keep it up!` 
                    : "Manage your finances on the go."}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-3">
                <Button variant="outline" onClick={() => exportToExcel(transactions, categories)} className="gap-2 border-slate-200 text-slate-600">
                  <Download size={18} />
                  Excel
                </Button>
                <Button variant="brand" onClick={() => exportToPDF(transactions, categories)} className="gap-2">
                  <Download size={18} />
                  PDF Statement
                </Button>
              </div>
              <div className="md:hidden w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <ReceiptText size={20} />
              </div>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <Card className="bg-white text-slate-900 border-slate-100 p-5 md:p-6 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center justify-between mb-2 md:mb-4">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-900">
                      <Wallet size={20} />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold">{formatCurrency(balance)}</h3>
                  <div className="mt-2 flex items-center gap-1 text-emerald-600 text-xs font-bold">
                    <ArrowUpRight size={14} />
                    <span>Healthy</span>
                  </div>
                </Card>
                
                <Card className="p-5 md:p-6 border-slate-100">
                  <div className="flex items-center justify-between mb-2 md:mb-4">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                      <TrendingUp size={20} />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Credit</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-emerald-600">{formatCurrency(totalIncome)}</h3>
                  <div className="mt-2 text-slate-400 text-[10px] font-bold uppercase">This Month</div>
                </Card>

                <Card className="p-5 md:p-6 border-slate-100">
                  <div className="flex items-center justify-between mb-2 md:mb-4">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <TrendingDown size={20} />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Debit</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-blue-600">{formatCurrency(totalExpenses)}</h3>
                  <div className="mt-2 text-slate-400 text-[10px] font-bold uppercase">This Month</div>
                </Card>

                <Card className="p-5 md:p-6 border-slate-100 bg-white text-slate-900 shadow-xl shadow-slate-200/50">
                  <div className="flex items-center justify-between mb-2 md:mb-4">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-900">
                      <Activity size={20} />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider">Savings Rate</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold">{savingsRate.toFixed(1)}%</h3>
                  <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(savingsRate, 100)}%` }} />
                  </div>
                </Card>
              </div>

              {/* Main Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                {/* Balance History Area Chart */}
                <Card title="Wealth Growth" subtitle="Your balance over the last 14 days" className="lg:col-span-2 p-4 md:p-6 border-slate-100">
                  <div className="h-[250px] md:h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={balanceHistory}>
                        <defs>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                        />
                        <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                {/* Quick Insights Bento */}
                <div className="flex flex-col gap-4 md:gap-6">
                  <Card className="flex-1 p-5 border-slate-100 flex flex-col justify-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <PieChartIcon size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Top Category</p>
                        <h4 className="text-lg font-bold text-slate-900">{topCategory?.name || "None"}</h4>
                        <p className="text-xs font-bold text-blue-600">{formatCurrency(topCategory?.value || 0)} spent</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="flex-1 p-5 border-slate-100 flex flex-col justify-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Calendar size={24} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Daily Average</p>
                        <h4 className="text-lg font-bold text-slate-900">{formatCurrency(dailyAverage)}</h4>
                        <p className="text-xs font-bold text-emerald-600">Avg. spending</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="flex-1 p-5 border-slate-100 bg-blue-600 text-white border-none flex flex-col justify-center items-center text-center">
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">Quick Action</p>
                    <Button 
                      variant="ghost" 
                      onClick={() => setIsAddModalOpen(true)}
                      className="text-white hover:bg-white/10 w-full py-4 border border-white/20"
                    >
                      Add New Entry
                    </Button>
                  </Card>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                <Card title="Monthly Trend" subtitle="Credit, Debit & Net Savings" className="p-4 md:p-6 border-slate-100">
                  <div className="h-[250px] md:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={monthlyTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} />
                        <Tooltip 
                          cursor={{ fill: '#f1f5f9' }}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                        />
                        <Bar dataKey="income" name="Credit" fill="#10b981" radius={[6, 6, 0, 0]} barSize={20} />
                        <Bar dataKey="expenses" name="Debit" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={20} />
                        <Line type="monotone" dataKey="net" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card title="Spending by Category" subtitle="Distribution of your debits" className="p-4 md:p-6 border-slate-100">
                  <div className="h-[250px] md:h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                          <Label 
                            value={formatCurrency(totalExpenses)} 
                            position="center" 
                            className="text-lg font-extrabold fill-slate-900"
                            style={{ fontSize: '16px', fontWeight: '800' }}
                          />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {categoryData.slice(0, 5).map((cat, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tight">{cat.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              <Card title="Category Breakdown" subtitle="Detailed spending per category" className="p-4 md:p-6 border-slate-100">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={categoryData.sort((a, b) => b.value - a.value)}
                      margin={{ left: 40, right: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                        width={100}
                      />
                      <Tooltip 
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20} label={{ position: 'right', fill: '#64748b', fontSize: 10, fontWeight: 700, formatter: (val: number) => formatCurrency(val) }}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {categories.some(c => c.budget) && (
                <Card title="Budget Alerts" subtitle="Categories nearing or exceeding budget" className="p-4 md:p-6 border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories
                      .filter(c => c.budget)
                      .map(cat => {
                        const spent = transactions
                          .filter(t => t.categoryId === cat.id && t.type === "expense")
                          .reduce((acc, t) => acc + t.amount, 0);
                        const progress = (spent / cat.budget!) * 100;
                        if (progress < 50) return null; // Only show if > 50%
                        
                        return (
                          <div key={cat.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                                <span className="font-bold text-slate-900 text-sm">{cat.name}</span>
                              </div>
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                                progress >= 100 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
                              )}>
                                {progress >= 100 ? "Over Budget" : "Nearing Limit"}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-500">
                                <span>{progress.toFixed(0)}% Used</span>
                                <span>{formatCurrency(spent)} / {formatCurrency(cat.budget!)}</span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full transition-all duration-500",
                                    progress >= 100 ? "bg-red-500" : "bg-amber-500"
                                  )} 
                                  style={{ width: `${Math.min(progress, 100)}%` }} 
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                      .filter(Boolean)
                    }
                    {categories.filter(c => c.budget).every(c => {
                      const spent = transactions
                        .filter(t => t.categoryId === c.id && t.type === "expense")
                        .reduce((acc, t) => acc + t.amount, 0);
                      return (spent / c.budget!) * 100 < 50;
                    }) && (
                      <div className="col-span-full py-6 text-center text-slate-400 text-sm font-medium">
                        All budgets are well within limits. Great job!
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Recent Transactions */}
              <Card title="Recent Transactions" subtitle="Your latest financial activity" className="p-4 md:p-6 border-slate-100">
                <div className="space-y-3 md:space-y-4">
                  {transactions.slice(0, 5).map((t) => {
                    const category = categories.find(c => c.id === t.categoryId);
                    return (
                      <div key={t.id} className="flex items-center justify-between p-3 md:p-4 rounded-2xl border border-slate-50 bg-white hover:bg-slate-50 transition-all hover:scale-[1.01] active:scale-[0.99]">
                        <div className="flex items-center gap-3 md:gap-4">
                          <div 
                            className="w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: category?.color || '#000' }}
                          >
                            <ReceiptText size={20} className="md:w-6 md:h-6" />
                          </div>
                          <div>
                            <p className="text-sm md:text-base font-bold text-slate-900 line-clamp-1">{t.description}</p>
                            <p className="text-[10px] md:text-xs text-slate-400 font-medium">
                              {category?.name} • {formatDate(t.date)} • {t.type === "income" ? "Credit" : "Debit"}
                              {t.paymentType && ` • ${t.paymentType}`}
                            </p>
                          </div>
                        </div>
                        <p className={cn(
                          "text-sm md:text-base font-extrabold whitespace-nowrap",
                          t.type === "income" ? "text-emerald-600" : "text-blue-600"
                        )}>
                          {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                        </p>
                      </div>
                    );
                  })}
                  {transactions.length === 0 && (
                    <div className="text-center py-10 text-zinc-400">
                      No transactions yet. Start by adding one!
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === "journal" && (
            <motion.div 
              key="journal"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="p-0 md:p-6 overflow-hidden border-slate-100">
                <div className="p-4 md:p-0">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div className="relative flex-1">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <Input 
                        className="pl-10 border-slate-200" 
                        placeholder="Search transactions..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From</span>
                        <Input 
                          type="date" 
                          className="w-auto border-slate-200 text-xs h-9" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To</span>
                        <Input 
                          type="date" 
                          className="w-auto border-slate-200 text-xs h-9" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                      {(searchQuery || startDate || endDate) && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setSearchQuery("");
                            setStartDate("");
                            setEndDate("");
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-[10px] uppercase tracking-tight h-9"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[10px] md:text-xs uppercase tracking-widest font-bold">
                        <th className="px-6 pb-4">Date</th>
                        <th className="px-6 pb-4">Description</th>
                        <th className="px-6 pb-4">Category</th>
                        <th className="px-6 pb-4">Payment</th>
                        <th className="px-6 pb-4">Type</th>
                        <th className="px-6 pb-4 text-right">Amount</th>
                        <th className="px-6 pb-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {paginatedTransactions.map((t) => {
                        const category = categories.find(c => c.id === t.categoryId);
                        return (
                          <tr key={t.id} className="group hover:bg-blue-50/30 transition-colors">
                            <td className="px-6 py-4 text-sm text-slate-500 font-medium">{formatDate(t.date)}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">{t.description}</td>
                            <td className="px-6 py-4">
                              <span 
                                className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-tight"
                                style={{ backgroundColor: category?.color || '#000' }}
                              >
                                {category?.name}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded-lg text-slate-600 uppercase tracking-tight">
                                {t.paymentType || "Cash"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-tight",
                                t.type === "income" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                              )}>
                                {t.type === "income" ? "Credit" : "Debit"}
                              </span>
                            </td>
                            <td className={cn(
                              "px-6 py-4 text-right font-extrabold",
                              t.type === "income" ? "text-emerald-600" : "text-blue-600"
                            )}>
                              {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button 
                                onClick={() => deleteTransaction(t.id)}
                                className="p-2 text-slate-300 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredTransactions.length === 0 && (
                    <div className="text-center py-20 text-slate-400 font-medium">
                      No entries found matching your search.
                    </div>
                  )}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="p-2 h-8 w-8"
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              "w-8 h-8 rounded-lg text-xs font-bold transition-all",
                              currentPage === page 
                                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                                : "text-slate-400 hover:bg-slate-100"
                            )}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        className="p-2 h-8 w-8"
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {activeTab === "ledger" && (
            <motion.div 
              key="ledger"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="p-6 border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <Wallet className="text-blue-600" size={20} />
                    Payment Type Summary
                  </h3>
                  <div className="space-y-4">
                    {["Cash", "Card", "UPI", "Bank Transfer"].map(type => {
                      const income = transactions
                        .filter(t => t.paymentType === type && t.type === "income")
                        .reduce((acc, t) => acc + t.amount, 0);
                      const expense = transactions
                        .filter(t => t.paymentType === type && t.type === "expense")
                        .reduce((acc, t) => acc + t.amount, 0);
                      const net = income - expense;

                      if (income === 0 && expense === 0) return null;

                      return (
                        <div key={type} className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-slate-900">{type}</span>
                            <span className={cn(
                              "text-sm font-extrabold",
                              net >= 0 ? "text-emerald-600" : "text-blue-600"
                            )}>
                              {formatCurrency(net)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <span>Credit: <span className="text-emerald-600">{formatCurrency(income)}</span></span>
                            <span>Debit: <span className="text-blue-600">{formatCurrency(expense)}</span></span>
                          </div>
                        </div>
                      );
                    })}
                    {transactions.every(t => !t.paymentType) && (
                      <div className="text-center py-10 text-slate-400 text-sm italic">
                        No payment type data available for existing entries.
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="p-6 border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <PieChartIcon className="text-indigo-600" size={20} />
                    Category Ledger
                  </h3>
                  <div className="space-y-4">
                    {categories.map(cat => {
                      const income = transactions
                        .filter(t => t.categoryId === cat.id && t.type === "income")
                        .reduce((acc, t) => acc + t.amount, 0);
                      const expense = transactions
                        .filter(t => t.categoryId === cat.id && t.type === "expense")
                        .reduce((acc, t) => acc + t.amount, 0);
                      const net = income - expense;

                      if (income === 0 && expense === 0) return null;

                      return (
                        <div key={cat.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-8 rounded-full" style={{ backgroundColor: cat.color }} />
                            <div>
                              <p className="font-bold text-slate-900">{cat.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Net Balance</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "font-extrabold",
                              net >= 0 ? "text-emerald-600" : "text-blue-600"
                            )}>
                              {formatCurrency(net)}
                            </p>
                            <div className="flex gap-2 text-[9px] font-bold uppercase text-slate-400">
                              <span>C: {formatCurrency(income)}</span>
                              <span>D: {formatCurrency(expense)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              <Card className="p-6 border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Ledger Activity</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4">Date</th>
                        <th className="pb-4">Description</th>
                        <th className="pb-4">Account/Type</th>
                        <th className="pb-4 text-right">Credit</th>
                        <th className="pb-4 text-right">Debit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.slice(0, 10).map(t => (
                        <tr key={t.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="py-4 text-xs font-medium text-slate-500">{formatDate(t.date)}</td>
                          <td className="py-4 font-bold text-slate-900">{t.description}</td>
                          <td className="py-4">
                            <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded-lg text-slate-600 uppercase">
                              {t.paymentType || "Unspecified"}
                            </span>
                          </td>
                          <td className="py-4 text-right font-bold text-emerald-600">
                            {t.type === "income" ? formatCurrency(t.amount) : "-"}
                          </td>
                          <td className="py-4 text-right font-bold text-blue-600">
                            {t.type === "expense" ? formatCurrency(t.amount) : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === "categories" && (
            <motion.div 
              key="categories"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {categories.map((cat) => {
                const spent = transactions
                  .filter(t => t.categoryId === cat.id && t.type === "expense")
                  .reduce((acc, t) => acc + t.amount, 0);
                const progress = cat.budget ? (spent / cat.budget) * 100 : 0;
                
                return (
                  <Card key={cat.id} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
                          style={{ backgroundColor: cat.color }}
                        >
                          <ReceiptText size={24} />
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-900">{cat.name}</h4>
                          <p className="text-xs text-zinc-500">
                            {transactions.filter(t => t.categoryId === cat.id).length} transactions
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setEditingCategory(cat);
                          setNewCategory({
                            name: cat.name,
                            color: cat.color,
                            budget: cat.budget?.toString() || ""
                          });
                          setIsCategoryModalOpen(true);
                        }}
                        className="text-blue-600 hover:bg-blue-50 font-bold uppercase tracking-tighter text-[10px]"
                      >
                        Edit
                      </Button>
                    </div>

                    {cat.budget && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                          <span className="text-slate-400">Budget Progress</span>
                          <span className={cn(spent > cat.budget ? "text-red-500" : "text-emerald-600")}>
                            {formatCurrency(spent)} / {formatCurrency(cat.budget)}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              spent > cat.budget ? "bg-red-500" : "bg-emerald-500"
                            )} 
                            style={{ width: `${Math.min(progress, 100)}%` }} 
                          />
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50/50 transition-all gap-2 group"
              >
                <PlusCircle size={32} className="group-hover:scale-110 transition-transform" />
                <span className="font-bold uppercase tracking-tight text-xs">Add New Category</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl p-8 shadow-2xl gradient-surface border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Add New Entry</h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-6">
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setNewTransaction({ ...newTransaction, type: "expense" })}
                    className={cn(
                      "flex-1 py-2 text-sm font-bold rounded-lg transition-all uppercase tracking-tight",
                      newTransaction.type === "expense" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    Debit
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewTransaction({ ...newTransaction, type: "income" })}
                    className={cn(
                      "flex-1 py-2 text-sm font-bold rounded-lg transition-all uppercase tracking-tight",
                      newTransaction.type === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
                    )}
                  >
                    Credit
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Description</label>
                  <Input 
                    required
                    placeholder="e.g. Weekly Groceries" 
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Amount</label>
                    <Input 
                      required
                      type="number" 
                      step="0.01"
                      placeholder="0.00" 
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Date</label>
                    <Input 
                      required
                      type="date" 
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Category</label>
                    <Select 
                      value={newTransaction.categoryId}
                      onChange={(e) => setNewTransaction({ ...newTransaction, categoryId: e.target.value })}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Payment Type</label>
                    <Select 
                      value={newTransaction.paymentType}
                      onChange={(e) => setNewTransaction({ ...newTransaction, paymentType: e.target.value as PaymentType })}
                    >
                      <option value="Cash">Cash</option>
                      <option value="Card">Card</option>
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </Select>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" variant="brand" className="w-full py-6 text-lg shadow-xl shadow-blue-500/20">
                    Save Transaction
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Add Category Modal */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl gradient-surface border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {editingCategory ? "Edit Category" : "New Category"}
                </h3>
                <button 
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategory(null);
                    setNewCategory({ name: "", color: "#000000", budget: "" });
                  }}
                  className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Category Name</label>
                  <Input 
                    required
                    placeholder="e.g. Subscriptions" 
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Monthly Budget (Optional)</label>
                  <Input 
                    type="number"
                    placeholder="e.g. 5000" 
                    value={newCategory.budget}
                    onChange={(e) => setNewCategory({ ...newCategory, budget: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Color</label>
                  <div className="flex gap-3 flex-wrap">
                    {["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#6366f1", "#06b6d4", "#ec4899", "#141414"].map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCategory({ ...newCategory, color })}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-all",
                          newCategory.color === color ? "border-zinc-900 scale-110" : "border-transparent"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" variant="brand" className="w-full py-6 text-lg shadow-xl shadow-blue-500/20">
                    Create Category
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )}
</AnimatePresence>
  );
}
