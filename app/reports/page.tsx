"use client"

import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  MapPin,
  AlertTriangle,
  Users,
  DollarSign,
  Printer,
  Truck,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Activity,
  Filter,
  RefreshCw,
  Globe,
} from "lucide-react"
import Link from "next/link"
import {
  getDriverPerformanceReport,
  getAreasReport,
  getDelayedShipmentsReport,
  getTopCustomersReport,
  getRevenueExpensesChart,
} from "@/app/actions/reports"
import { AdminFooter } from "@/components/admin-footer"

type TabType = "overview" | "drivers" | "areas" | "delayed" | "customers" | "financial"

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("overview")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const [driversReport, setDriversReport] = useState<any[]>([])
  const [areasReport, setAreasReport] = useState<any[]>([])
  const [delayedReport, setDelayedReport] = useState<any[]>([])
  const [customersReport, setCustomersReport] = useState<any[]>([])
  const [chartData, setChartData] = useState<any[]>([])

  const [loading, setLoading] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [drivers, areas, delayed, customers, chart] = await Promise.all([
        getDriverPerformanceReport(startDate || undefined, endDate || undefined),
        getAreasReport(startDate || undefined, endDate || undefined),
        getDelayedShipmentsReport(),
        getTopCustomersReport(startDate || undefined, endDate || undefined),
        getRevenueExpensesChart(6),
      ])

      if (drivers.success) setDriversReport(drivers.data)
      if (areas.success) setAreasReport(areas.data)
      if (delayed.success) setDelayedReport(delayed.data)
      if (customers.success) setCustomersReport(customers.data)
      if (chart.success) setChartData(chart.data)
    } catch (error) {
      console.error("Error loading reports:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleFilter = () => {
    loadData()
  }

  // حساب الإحصائيات العامة
  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0)
  const totalExpenses = chartData.reduce((sum, d) => sum + d.expenses, 0)
  const totalProfit = totalRevenue - totalExpenses
  const totalDelivered = driversReport.reduce((sum, d) => sum + d.deliveredShipments, 0)
  const totalShipments = areasReport.reduce((sum, a) => sum + a.shipmentsCount, 0)

  // طباعة التقرير
  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const today = new Date().toLocaleDateString("en-GB", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })

    let reportContent = ""
    const reportTitle =
      activeTab === "overview"
        ? "نظرة عامة"
        : activeTab === "drivers"
          ? "أداء السائقين"
          : activeTab === "areas"
            ? "تقرير المناطق"
            : activeTab === "delayed"
              ? "الشحنات المتأخرة"
              : activeTab === "customers"
                ? "أفضل العملاء"
                : "التحليل المالي"

    // إنشاء محتوى التقرير حسب التبويب النشط
    if (activeTab === "overview") {
      reportContent = `
        <div class="summary-cards">
          <div class="stat-card green">
            <div class="stat-label">إجمالي الإيرادات</div>
            <div class="stat-value">${totalRevenue.toFixed(2)} د.أ</div>
          </div>
          <div class="stat-card red">
            <div class="stat-label">إجمالي المصروفات</div>
            <div class="stat-value">${totalExpenses.toFixed(2)} د.أ</div>
          </div>
          <div class="stat-card blue">
            <div class="stat-label">صافي الربح</div>
            <div class="stat-value">${totalProfit.toFixed(2)} د.أ</div>
          </div>
          <div class="stat-card purple">
            <div class="stat-label">الشحنات المسلمة</div>
            <div class="stat-value">${totalDelivered}</div>
          </div>
        </div>
      `
    } else if (activeTab === "drivers") {
      reportContent = `
        <table>
          <thead>
            <tr>
              <th>السائق</th>
              <th>الهاتف</th>
              <th>الشحنات المسلمة</th>
              <th>الأرباح</th>
              <th>الجلسات المعتمدة</th>
            </tr>
          </thead>
          <tbody>
            ${driversReport
              .map(
                (d) => `
              <tr>
                <td>${d.driverName}</td>
                <td>${d.driverPhone}</td>
                <td>${d.deliveredShipments}</td>
                <td>${Number(d.totalEarnings || 0).toFixed(2)} د.أ</td>
                <td>${d.approvedSessions}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
    } else if (activeTab === "areas") {
      reportContent = `
        <table>
          <thead>
            <tr>
              <th>المنطقة</th>
              <th>عدد الشحنات</th>
              <th>المبلغ الإجمالي</th>
              <th>نسبة التسليم</th>
            </tr>
          </thead>
          <tbody>
            ${areasReport
              .map(
                (a) => `
              <tr>
                <td>${a.area}</td>
                <td>${a.shipmentsCount}</td>
                <td>${Number(a.totalAmount || 0).toFixed(2)} د.أ</td>
                <td>${Number(a.deliveryRate || 0).toFixed(1)}%</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
    } else if (activeTab === "delayed") {
      reportContent = `
        <table>
          <thead>
            <tr>
              <th>رقم التتبع</th>
              <th>المرسل</th>
              <th>المستلم</th>
              <th>أيام التأخير</th>
            </tr>
          </thead>
          <tbody>
            ${delayedReport
              .map(
                (s) => `
              <tr class="delayed-row">
                <td>${s.trackingNumber}</td>
                <td>${s.senderName}</td>
                <td>${s.receiverName}</td>
                <td class="delay-days">${s.daysDelayed} يوم</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
    } else if (activeTab === "customers") {
      reportContent = `
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>العميل</th>
              <th>الهاتف</th>
              <th>عدد الشحنات</th>
              <th>المبلغ الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${customersReport
              .map(
                (c, i) => `
              <tr>
                <td><span class="rank rank-${i + 1}">${i + 1}</span></td>
                <td>${c.name}</td>
                <td>${c.phone}</td>
                <td>${c.shipmentsCount}</td>
                <td>${Number(c.totalAmount || 0).toFixed(2)} د.أ</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `
    } else if (activeTab === "financial") {
      reportContent = `
        <div class="financial-summary">
          ${chartData
            .map(
              (d) => `
            <div class="month-card">
              <div class="month-name">${d.month}</div>
              <div class="month-stats">
                <div class="stat">
                  <span class="label">الإيرادات:</span>
                  <span class="value green">${d.revenue.toFixed(2)} د.أ</span>
                </div>
                <div class="stat">
                  <span class="label">المصروفات:</span>
                  <span class="value red">${d.expenses.toFixed(2)} د.أ</span>
                </div>
                <div class="stat">
                  <span class="label">الربح:</span>
                  <span class="value ${d.profit >= 0 ? "blue" : "orange"}">${d.profit.toFixed(2)} د.أ</span>
                </div>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>
      `
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>تقرير - ${reportTitle}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Arial, sans-serif; 
            padding: 20px; 
            background: #fff;
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            padding-bottom: 20px;
            border-bottom: 3px solid #1e3a5f;
          }
          .header h1 { 
            color: #1e3a5f; 
            font-size: 28px; 
            margin-bottom: 10px;
          }
          .header .subtitle { 
            color: #666; 
            font-size: 14px;
          }
          .header .date { 
            color: #888; 
            font-size: 12px;
            margin-top: 5px;
          }
          .actions { 
            display: flex; 
            gap: 10px; 
            justify-content: center; 
            margin-bottom: 30px;
          }
          .actions button {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            transition: all 0.3s;
          }
          .btn-print { 
            background: linear-gradient(135deg, #1e3a5f, #2d5a87); 
            color: white;
          }
          .btn-print:hover { background: linear-gradient(135deg, #2d5a87, #1e3a5f); }
          .btn-close { 
            background: #f5f5f5; 
            color: #333;
            border: 1px solid #ddd;
          }
          .btn-close:hover { background: #eee; }
          
          /* Summary Cards */
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .stat-card {
            padding: 20px;
            border-radius: 12px;
            text-align: center;
          }
          .stat-card.green { background: linear-gradient(135deg, #d4edda, #c3e6cb); }
          .stat-card.red { background: linear-gradient(135deg, #f8d7da, #f5c6cb); }
          .stat-card.blue { background: linear-gradient(135deg, #d1ecf1, #bee5eb); }
          .stat-card.purple { background: linear-gradient(135deg, #e2d9f3, #d4c4e8); }
          .stat-label { font-size: 12px; color: #666; margin-bottom: 8px; }
          .stat-value { font-size: 24px; font-weight: bold; color: #333; }
          
          /* Tables */
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          th { 
            background: linear-gradient(135deg, #1e3a5f, #2d5a87); 
            color: white; 
            padding: 15px 12px;
            font-weight: 600;
            text-align: right;
          }
          td { 
            padding: 12px; 
            border-bottom: 1px solid #eee;
            text-align: right;
          }
          tr:nth-child(even) { background: #f8f9fa; }
          tr:hover { background: #f0f4f8; }
          .delayed-row { background: #fff5f5 !important; }
          .delay-days { color: #dc3545; font-weight: bold; }
          
          /* Rank badges */
          .rank {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            font-weight: bold;
            font-size: 12px;
          }
          .rank-1 { background: #ffd700; color: #000; }
          .rank-2 { background: #c0c0c0; color: #000; }
          .rank-3 { background: #cd7f32; color: #fff; }
          .rank { background: #e9ecef; color: #333; }
          
          /* Financial */
          .financial-summary {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }
          .month-card {
            border: 1px solid #e9ecef;
            border-radius: 12px;
            padding: 20px;
            background: #fff;
          }
          .month-name {
            font-size: 18px;
            font-weight: bold;
            color: #1e3a5f;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
          }
          .month-stats { display: flex; flex-direction: column; gap: 10px; }
          .stat { display: flex; justify-content: space-between; }
          .stat .label { color: #666; }
          .stat .value { font-weight: bold; }
          .stat .value.green { color: #28a745; }
          .stat .value.red { color: #dc3545; }
          .stat .value.blue { color: #007bff; }
          .stat .value.orange { color: #fd7e14; }
          
          .footer {
            margin-top: 40px;
            text-align: center;
            color: #888;
            font-size: 12px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
          
          @media print {
            .actions { display: none; }
            body { padding: 10px; }
            .summary-cards { grid-template-columns: repeat(2, 1fr); }
            .financial-summary { grid-template-columns: 1fr; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>تقارير وإحصائيات - ${reportTitle}</h1>
          <div class="subtitle">مؤسسة الريان واريان للشحن</div>
          <div class="date">تاريخ التقرير: ${today}</div>
        </div>
        
        <div class="actions">
          <button class="btn-print" onclick="window.print()">🖨️ طباعة</button>
          <button class="btn-close" onclick="window.close()">✕ إغلاق</button>
        </div>
        
        ${reportContent}
        
        <div class="footer">
          تم إنشاء هذا التقرير بواسطة نظام الريان للشحن - ${today}
        </div>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
  }

  const tabs = [
    { id: "overview" as TabType, label: "نظرة عامة", icon: PieChart, color: "from-blue-500 to-blue-600" },
    { id: "drivers" as TabType, label: "السائقين", icon: Truck, color: "from-teal-500 to-teal-600" },
    { id: "areas" as TabType, label: "المناطق", icon: MapPin, color: "from-purple-500 to-purple-600" },
    { id: "delayed" as TabType, label: "المتأخرة", icon: AlertTriangle, color: "from-red-500 to-red-600" },
    { id: "customers" as TabType, label: "العملاء", icon: Users, color: "from-amber-500 to-amber-600" },
    { id: "financial" as TabType, label: "المالية", icon: DollarSign, color: "from-emerald-500 to-emerald-600" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1e3a5f] via-[#2d5a87] to-[#1e3a5f] text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <BarChart3 className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">تقارير وإحصائيات</h1>
                <p className="text-blue-200 text-sm mt-1">تحليل شامل لأداء العمليات والمالية</p>
              </div>
            </div>
            <Button
              onClick={handlePrint}
              className="gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة التقرير</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6" ref={reportRef}>
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Filter className="w-5 h-5" />
                <span className="font-medium">تصفية حسب التاريخ</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">من</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white dark:bg-slate-700 w-full"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">إلى</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white dark:bg-slate-700 w-full"
                  />
                </div>
              </div>
              <Button
                onClick={handleFilter}
                disabled={loading}
                className="w-full gap-2 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a87] hover:from-[#2d5a87] hover:to-[#1e3a5f]"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                تحديث التقارير
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex flex-col items-center gap-2 p-3 md:p-4 rounded-xl transition-all duration-300
                ${
                  activeTab === tab.id
                    ? `bg-gradient-to-br ${tab.color} text-white shadow-lg scale-105`
                    : "bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-md"
                }
              `}
            >
              <tab.icon className={`w-5 h-5 md:w-6 md:h-6 ${activeTab === tab.id ? "" : "text-muted-foreground"}`} />
              <span className="text-xs md:text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Overview */}
          {activeTab === "overview" && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="w-8 h-8 opacity-80" />
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <p className="text-emerald-100 text-xs md:text-sm">إجمالي الإيرادات</p>
                    <p className="text-xl md:text-2xl font-bold mt-1">{totalRevenue.toFixed(2)} د.أ</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <ArrowDownRight className="w-8 h-8 opacity-80" />
                      <ArrowDownRight className="w-5 h-5" />
                    </div>
                    <p className="text-red-100 text-xs md:text-sm">إجمالي المصروفات</p>
                    <p className="text-xl md:text-2xl font-bold mt-1">{totalExpenses.toFixed(2)} د.أ</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Activity className="w-8 h-8 opacity-80" />
                      <ArrowUpRight className="w-5 h-5" />
                    </div>
                    <p className="text-blue-100 text-xs md:text-sm">صافي الربح</p>
                    <p className="text-xl md:text-2xl font-bold mt-1">{totalProfit.toFixed(2)} د.أ</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Package className="w-8 h-8 opacity-80" />
                      <span className="text-xl font-bold">{totalDelivered}</span>
                    </div>
                    <p className="text-purple-100 text-xs md:text-sm">الشحنات المسلمة</p>
                    <p className="text-xl md:text-2xl font-bold mt-1">{totalShipments} شحنة</p>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="w-5 h-5 text-primary" />
                      أفضل السائقين
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {driversReport.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">لا توجد بيانات</p>
                    ) : (
                      <div className="space-y-3">
                        {driversReport.slice(0, 5).map((driver, i) => (
                          <div
                            key={driver.driverId}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  i === 0
                                    ? "bg-yellow-400 text-yellow-900"
                                    : i === 1
                                      ? "bg-gray-300 text-gray-700"
                                      : i === 2
                                        ? "bg-amber-600 text-white"
                                        : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {i + 1}
                              </span>
                              <span className="font-medium">{driver.driverName}</span>
                            </div>
                            <Badge variant="secondary">{driver.deliveredShipments} شحنة</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      أكثر المناطق
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {areasReport.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">لا توجد بيانات</p>
                    ) : (
                      <div className="space-y-3">
                        {areasReport.slice(0, 5).map((area, i) => (
                          <div key={area.area} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                  i === 0
                                    ? "bg-purple-500 text-white"
                                    : i === 1
                                      ? "bg-purple-400 text-white"
                                      : i === 2
                                        ? "bg-purple-300 text-purple-900"
                                        : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {i + 1}
                              </span>
                              <span className="font-medium">{area.area}</span>
                            </div>
                            <Badge variant="secondary">{area.shipmentsCount} شحنة</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Drivers Tab */}
          {activeTab === "drivers" && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  تقرير أداء السائقين
                </CardTitle>
              </CardHeader>
              <CardContent>
                {driversReport.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">لا توجد بيانات للسائقين</p>
                ) : (
                  <div className="space-y-3">
                    {driversReport.map((driver, i) => (
                      <div
                        key={driver.driverId}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/50 rounded-lg gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                              i === 0
                                ? "bg-yellow-400 text-yellow-900"
                                : i === 1
                                  ? "bg-gray-300 text-gray-700"
                                  : i === 2
                                    ? "bg-amber-600 text-white"
                                    : "bg-muted-foreground/20 text-muted-foreground"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium">{driver.driverName}</p>
                            <p className="text-sm text-muted-foreground">{driver.driverPhone}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{driver.deliveredShipments} شحنة مسلمة</Badge>
                          <Badge variant="secondary">{Number(driver.totalEarnings || 0).toFixed(2)} د.أ أرباح</Badge>
                          <Badge>{driver.approvedSessions} جلسة معتمدة</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Areas Tab */}
          {activeTab === "areas" && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  تقرير المناطق
                </CardTitle>
              </CardHeader>
              <CardContent>
                {areasReport.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">لا توجد بيانات للمناطق</p>
                ) : (
                  <div className="space-y-3">
                    {areasReport.map((area) => (
                      <div
                        key={area.area}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/50 rounded-lg gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="font-medium">{area.area}</p>
                            <p className="text-sm text-muted-foreground">{area.shipmentsCount} شحنة</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{Number(area.totalAmount || 0).toFixed(2)} د.أ</Badge>
                          <Badge variant={Number(area.deliveryRate || 0) >= 80 ? "default" : "secondary"}>
                            {Number(area.deliveryRate || 0).toFixed(1)}% نسبة التسليم
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Delayed Tab */}
          {activeTab === "delayed" && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                  الشحنات المتأخرة
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  الشحنات قيد الانتظار لأكثر من 3 أيام، أو الشحنات التي استغرق تسليمها أكثر من 5 أيام
                </p>
              </CardHeader>
              <CardContent>
                {delayedReport.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">لا توجد شحنات متأخرة</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {delayedReport.map((shipment: any) => (
                      <div
                        key={shipment.trackingNumber}
                        className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-lg border gap-3 ${
                          shipment.status === "delivered"
                            ? "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900"
                            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900"
                        }`}
                      >
                        <div>
                          <p className="font-mono text-sm text-muted-foreground">{shipment.trackingNumber}</p>
                          <p className="font-medium">
                            {shipment.senderName} ← {shipment.receiverName}
                          </p>
                          <Badge
                            variant="outline"
                            className={`mt-1 ${
                              shipment.status === "delivered"
                                ? "border-orange-400 text-orange-600"
                                : "border-red-400 text-red-600"
                            }`}
                          >
                            {shipment.delayType ||
                              (shipment.status === "delivered" ? "تأخر في التسليم" : "قيد الانتظار")}
                          </Badge>
                        </div>
                        <Badge
                          variant={shipment.status === "delivered" ? "secondary" : "destructive"}
                          className="text-sm"
                        >
                          {shipment.status === "delivered"
                            ? `استغرق ${shipment.daysDelayed + 5} يوم للتسليم`
                            : `متأخرة ${shipment.daysDelayed + 3} يوم`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Customers Tab */}
          {activeTab === "customers" && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  أفضل العملاء
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customersReport.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">لا توجد بيانات للعملاء</p>
                ) : (
                  <div className="space-y-3">
                    {customersReport.map((customer, i) => (
                      <div
                        key={customer.phone}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/50 rounded-lg gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                              i === 0
                                ? "bg-yellow-400 text-yellow-900"
                                : i === 1
                                  ? "bg-gray-300 text-gray-700"
                                  : i === 2
                                    ? "bg-amber-600 text-white"
                                    : "bg-muted-foreground/20 text-muted-foreground"
                            }`}
                          >
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{customer.shipmentsCount} شحنة</Badge>
                          <Badge variant="secondary">{Number(customer.totalAmount || 0).toFixed(2)} د.أ</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Financial Tab */}
          {activeTab === "financial" && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  التحليل المالي الشهري
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">لا توجد بيانات مالية</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {chartData.map((month) => (
                      <div key={month.month} className="p-4 bg-muted/50 rounded-lg">
                        <h4 className="font-bold text-lg mb-3 pb-2 border-b">{month.month}</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">الإيرادات:</span>
                            <span className="font-bold text-emerald-600">{month.revenue.toFixed(2)} د.أ</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">المصروفات:</span>
                            <span className="font-bold text-red-600">{month.expenses.toFixed(2)} د.أ</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-muted-foreground">الربح:</span>
                            <span className={`font-bold ${month.profit >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                              {month.profit.toFixed(2)} د.أ
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AdminFooter />
    </div>
  )
}
