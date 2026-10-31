"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowRight, Globe, Users, Eye, Calendar, Monitor, Smartphone, 
  Chrome, MapPin, TrendingUp, Shield, Trash2, Plus, Loader2,
  BarChart3, Clock, RefreshCw
} from "lucide-react"
import Link from "next/link"
import { getVisitorStats, getVisitorsList, getExcludedIPs, addExcludedIP, removeExcludedIP, resetVisitorStats } from "@/app/actions/visitors"
import { AdminFooter } from "@/components/admin-footer"
import { useToast } from "@/hooks/use-toast"

export default function WebsiteStatsPage() {
  const [stats, setStats] = useState<any>(null)
  const [visitors, setVisitors] = useState<any[]>([])
  const [excludedIPs, setExcludedIPs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newIP, setNewIP] = useState("")
  const [newIPDescription, setNewIPDescription] = useState("")
  const [addingIP, setAddingIP] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsData, visitorsData, excludedData] = await Promise.all([
        getVisitorStats(),
        getVisitorsList(currentPage),
        getExcludedIPs()
      ])
      setStats(statsData)
      setVisitors(visitorsData.visitors)
      setTotalPages(visitorsData.totalPages)
      setExcludedIPs(excludedData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [currentPage])

  const handleAddExcludedIP = async () => {
    if (!newIP.trim()) return
    setAddingIP(true)
    try {
      const result = await addExcludedIP(newIP.trim(), newIPDescription.trim())
      if (result.success) {
        toast({ title: "تم إضافة IP بنجاح", description: `تم استثناء ${newIP} من التتبع` })
        setNewIP("")
        setNewIPDescription("")
        fetchData()
      }
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في إضافة IP", variant: "destructive" })
    } finally {
      setAddingIP(false)
    }
  }

  const handleRemoveExcludedIP = async (id: number) => {
    try {
      const result = await removeExcludedIP(id)
      if (result.success) {
        toast({ title: "تم الحذف", description: "تم إزالة IP من قائمة الاستثناء" })
        fetchData()
      }
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في حذف IP", variant: "destructive" })
    }
  }

  const handleResetStats = async () => {
    if (!confirm("هل أنت متأكد من تصفير جميع إحصائيات الزوار؟ هذا الإجراء لا يمكن التراجع عنه.")) return
    
    setResetting(true)
    try {
      const result = await resetVisitorStats()
      if (result.success) {
        toast({ title: "تم التصفير", description: "تم حذف جميع إحصائيات الزوار بنجاح" })
        fetchData()
      } else {
        toast({ title: "خطأ", description: result.error, variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في تصفير الإحصائيات", variant: "destructive" })
    } finally {
      setResetting(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">جاري تحميل الإحصائيات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-4 sm:p-6">
        <div className="container mx-auto">
          <Link 
            href="/admin"
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للإدارة
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                <BarChart3 className="w-8 h-8" />
                إحصائيات الموقع
              </h1>
              <p className="text-white/80 mt-1">تتبع وتحليل زوار الموقع</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchData}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <RefreshCw className={`w-4 h-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
                تحديث
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetStats}
                disabled={resetting}
                className="bg-red-500/20 border-red-300/30 text-white hover:bg-red-500/40"
              >
                {resetting ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Trash2 className="w-4 h-4 ml-2" />}
                تصفير
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
            <CardContent className="p-4 text-center">
              <Eye className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats?.totalVisits || 0}</p>
              <p className="text-sm opacity-80">إجمالي الزيارات</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-0">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats?.uniqueVisitors || 0}</p>
              <p className="text-sm opacity-80">زوار فريدون</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats?.todayVisits || 0}</p>
              <p className="text-sm opacity-80">زيارات اليوم</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-0">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats?.weekVisits || 0}</p>
              <p className="text-sm opacity-80">هذا الأسبوع</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500 to-red-500 text-white border-0">
            <CardContent className="p-4 text-center">
              <Globe className="w-8 h-8 mx-auto mb-2 opacity-80" />
              <p className="text-3xl font-bold">{stats?.monthVisits || 0}</p>
              <p className="text-sm opacity-80">هذا الشهر</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-lg mx-auto">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="visitors">الزوار</TabsTrigger>
            <TabsTrigger value="ips">عناوين IP</TabsTrigger>
            <TabsTrigger value="exclude">استثناءات</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* By Country */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-500" />
                    الزيارات حسب الدولة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats?.byCountry?.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="font-medium">{item.country || "غير معروف"}</span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                    {(!stats?.byCountry || stats.byCountry.length === 0) && (
                      <p className="text-center text-gray-500 py-4">لا توجد بيانات</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* By Device */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-emerald-500" />
                    الزيارات حسب الجهاز
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats?.byDevice?.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {item.device_type === "Mobile" ? (
                            <Smartphone className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Monitor className="w-4 h-4 text-gray-500" />
                          )}
                          <span className="font-medium">{item.device_type || "غير معروف"}</span>
                        </div>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                    {(!stats?.byDevice || stats.byDevice.length === 0) && (
                      <p className="text-center text-gray-500 py-4">لا توجد بيانات</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* By Browser */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Chrome className="w-5 h-5 text-amber-500" />
                    الزيارات حسب المتصفح
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats?.byBrowser?.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="font-medium">{item.browser || "غير معروف"}</span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                    {(!stats?.byBrowser || stats.byBrowser.length === 0) && (
                      <p className="text-center text-gray-500 py-4">لا توجد بيانات</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* By Page */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-500" />
                    الصفحات الأكثر زيارة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {stats?.byPage?.map((item: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="font-medium text-sm truncate max-w-[200px]">{item.page_visited || "/"}</span>
                        <Badge variant="secondary">{item.count}</Badge>
                      </div>
                    ))}
                    {(!stats?.byPage || stats.byPage.length === 0) && (
                      <p className="text-center text-gray-500 py-4">لا توجد بيانات</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Visitors Tab */}
          <TabsContent value="visitors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  سجل الزوار
                </CardTitle>
                <CardDescription>قائمة بجميع زيارات الموقع</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-right">التاريخ</th>
                        <th className="p-2 text-right">الدولة/المدينة</th>
                        <th className="p-2 text-right">الجهاز</th>
                        <th className="p-2 text-right">المتصفح</th>
                        <th className="p-2 text-right">الصفحة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.map((visitor: any) => (
                        <tr key={visitor.id} className="border-b hover:bg-gray-50">
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              <span className="text-xs">{formatDate(visitor.visit_timestamp)}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <div>
                              <span className="font-medium">{visitor.country}</span>
                              {visitor.city !== "Unknown" && (
                                <span className="text-gray-500 text-xs block">{visitor.city}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant={visitor.device_type === "Mobile" ? "default" : "secondary"}>
                              {visitor.device_type}
                            </Badge>
                          </td>
                          <td className="p-2">{visitor.browser}</td>
                          <td className="p-2">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-[100px] block">
                              {visitor.page_visited}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      السابق
                    </Button>
                    <span className="px-4 py-2 text-sm">
                      صفحة {currentPage} من {totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      التالي
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* IP Addresses Tab */}
          <TabsContent value="ips">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  عناوين IP الزوار
                </CardTitle>
                <CardDescription>قائمة بعناوين IP لجميع الزوار</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="p-2 text-right">عنوان IP</th>
                        <th className="p-2 text-right">الدولة</th>
                        <th className="p-2 text-right">المدينة</th>
                        <th className="p-2 text-right">آخر زيارة</th>
                        <th className="p-2 text-right">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.map((visitor: any) => (
                        <tr key={visitor.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-mono text-xs">{visitor.ip_address}</td>
                          <td className="p-2">{visitor.country}</td>
                          <td className="p-2">{visitor.city}</td>
                          <td className="p-2 text-xs">{formatDate(visitor.visit_timestamp)}</td>
                          <td className="p-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNewIP(visitor.ip_address)
                                setNewIPDescription(`استثناء من ${visitor.country}`)
                              }}
                              className="text-xs"
                            >
                              <Shield className="w-3 h-3 ml-1" />
                              استثناء
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exclude Tab */}
          <TabsContent value="exclude">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-500" />
                  عناوين IP المستثناة
                </CardTitle>
                <CardDescription>هذه العناوين لن يتم تتبعها (مثل جهازك الشخصي)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add new IP form */}
                <div className="flex flex-col sm:flex-row gap-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <Input
                    placeholder="أدخل عنوان IP (مثال: 192.168.1.1)"
                    value={newIP}
                    onChange={(e) => setNewIP(e.target.value)}
                    className="flex-1"
                  />
                  <Input
                    placeholder="الوصف (اختياري)"
                    value={newIPDescription}
                    onChange={(e) => setNewIPDescription(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAddExcludedIP}
                    disabled={addingIP || !newIP.trim()}
                    className="bg-amber-500 hover:bg-amber-600"
                  >
                    {addingIP ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 ml-1" />}
                    إضافة
                  </Button>
                </div>

                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">كيفية معرفة عنوان IP الخاص بك:</p>
                  <p>1. افتح المتصفح واكتب في Google: "what is my ip"</p>
                  <p>2. أو زر موقع: <a href="https://whatismyipaddress.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">whatismyipaddress.com</a></p>
                </div>

                {/* Excluded IPs list */}
                <div className="space-y-2">
                  {excludedIPs.map((ip: any) => (
                    <div key={ip.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div>
                        <span className="font-mono font-medium">{ip.ip_address}</span>
                        {ip.description && (
                          <span className="text-gray-500 text-sm mr-2">- {ip.description}</span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveExcludedIP(ip.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {excludedIPs.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      لا توجد عناوين IP مستثناة حالياً
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AdminFooter backUrl="/admin" backLabel="الإدارة" />
    </div>
  )
}
