"use server"

import { sql } from "@/lib/db"

export async function getDriverPerformanceReport(startDate?: string, endDate?: string) {
  try {
    // Get all active drivers
    const drivers = await sql`
      SELECT id, name, phone FROM drivers WHERE status = 'active'
    `

    if (!drivers || drivers.length === 0) {
      return { success: true, data: [] }
    }

    // Get all delivered tasks
    let tasks: any[]
    if (startDate && endDate) {
      tasks = await sql`
        SELECT driver_id, driver_fee, status 
        FROM driver_tasks 
        WHERE status = 'delivered' 
        AND completed_date BETWEEN ${startDate} AND ${endDate}
      `
    } else if (startDate) {
      tasks = await sql`
        SELECT driver_id, driver_fee, status 
        FROM driver_tasks 
        WHERE status = 'delivered' 
        AND completed_date >= ${startDate}
      `
    } else {
      tasks = await sql`
        SELECT driver_id, driver_fee, status 
        FROM driver_tasks 
        WHERE status = 'delivered'
      `
    }

    // Get all approved sessions
    let sessions: any[]
    if (startDate && endDate) {
      sessions = await sql`
        SELECT driver_id, id FROM driver_sessions 
        WHERE is_approved = true 
        AND session_date BETWEEN ${startDate} AND ${endDate}
      `
    } else if (startDate) {
      sessions = await sql`
        SELECT driver_id, id FROM driver_sessions 
        WHERE is_approved = true 
        AND session_date >= ${startDate}
      `
    } else {
      sessions = await sql`
        SELECT driver_id, id FROM driver_sessions 
        WHERE is_approved = true
      `
    }

    // Group tasks by driver
    const tasksByDriver: { [key: number]: any[] } = {}
    ;(tasks || []).forEach((task: any) => {
      if (!tasksByDriver[task.driver_id]) {
        tasksByDriver[task.driver_id] = []
      }
      tasksByDriver[task.driver_id].push(task)
    })

    // Group sessions by driver
    const sessionsByDriver: { [key: number]: any[] } = {}
    ;(sessions || []).forEach((session: any) => {
      if (!sessionsByDriver[session.driver_id]) {
        sessionsByDriver[session.driver_id] = []
      }
      sessionsByDriver[session.driver_id].push(session)
    })

    // Build report
    const report = drivers.map((driver: any) => {
      const driverTasks = tasksByDriver[driver.id] || []
      const driverSessions = sessionsByDriver[driver.id] || []
      const totalEarnings = driverTasks.reduce((sum: number, task: any) => sum + (Number(task.driver_fee) || 0), 0)

      return {
        driverId: driver.id,
        driverName: driver.name,
        driverPhone: driver.phone,
        deliveredShipments: driverTasks.length,
        totalEarnings,
        averageRating: 0,
        ratingsCount: 0,
        approvedSessions: driverSessions.length,
      }
    })

    // Sort by delivered shipments
    report.sort((a, b) => b.deliveredShipments - a.deliveredShipments)

    return { success: true, data: report }
  } catch (error) {
    console.error("Error generating driver performance report:", error)
    return { success: false, error: "حدث خطأ غير متوقع", data: [] }
  }
}

export async function getAreasReport(startDate?: string, endDate?: string) {
  try {
    let shipments: any[]

    if (startDate && endDate) {
      shipments = await sql`
        SELECT receiver_country, price as amount, delivery_status
        FROM shipments
        WHERE deleted_at IS NULL
        AND created_at BETWEEN ${startDate} AND ${endDate}
      `
    } else if (startDate) {
      shipments = await sql`
        SELECT receiver_country, price as amount, delivery_status
        FROM shipments
        WHERE deleted_at IS NULL
        AND created_at >= ${startDate}
      `
    } else {
      shipments = await sql`
        SELECT receiver_country, price as amount, delivery_status
        FROM shipments
        WHERE deleted_at IS NULL
      `
    }

    if (!shipments || shipments.length === 0) {
      return { success: true, data: [] }
    }

    // Group by country
    const areaStats: { [key: string]: { count: number; totalAmount: number; delivered: number } } = {}
    shipments.forEach((shipment: any) => {
      const area = (shipment.receiver_country || "غير محدد").trim()
      if (!areaStats[area]) {
        areaStats[area] = { count: 0, totalAmount: 0, delivered: 0 }
      }
      areaStats[area].count++
      areaStats[area].totalAmount += Number(shipment.amount) || 0
      // Using delivery_status instead of status
      if (shipment.delivery_status === "delivered") {
        areaStats[area].delivered++
      }
    })

    // Calculate delivery rate correctly
    const report = Object.entries(areaStats)
      .map(([area, stats]) => {
        const deliveryRate = stats.count > 0 ? Math.round((stats.delivered / stats.count) * 100) : 0
        return {
          area,
          shipmentsCount: stats.count,
          totalAmount: stats.totalAmount,
          deliveredCount: stats.delivered,
          deliveryRate,
        }
      })
      .sort((a, b) => b.shipmentsCount - a.shipmentsCount)

    return { success: true, data: report }
  } catch (error) {
    console.error("Error generating areas report:", error)
    return { success: false, error: "حدث خطأ غير متوقع", data: [] }
  }
}

export async function getDelayedShipmentsReport() {
  try {
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const threeDaysAgoStr = threeDaysAgo.toISOString().split("T")[0]

    const pendingShipments = await sql`
      SELECT id, tracking_number, sender_name, receiver_name, receiver_phone, 
             delivery_status, created_at, NULL as delivered_at, 'pending' as delay_type
      FROM shipments
      WHERE deleted_at IS NULL 
        AND (delivery_status IS NULL OR delivery_status NOT IN ('delivered', 'cancelled', 'returned'))
        AND created_at::date < ${threeDaysAgoStr}::date
      ORDER BY created_at ASC
    `

    const deliveredShipments = await sql`
      SELECT s.id, s.tracking_number, s.sender_name, s.receiver_name, s.receiver_phone, 
             s.delivery_status, s.created_at, dt.completed_date as delivered_at, 'delivered_late' as delay_type
      FROM shipments s
      INNER JOIN driver_tasks dt ON dt.shipment_id = s.id AND dt.status = 'delivered'
      WHERE s.deleted_at IS NULL 
        AND s.delivery_status = 'delivered'
        AND dt.completed_date IS NOT NULL
        AND (dt.completed_date::date - s.created_at::date) > 5
      ORDER BY s.created_at ASC
    `

    // Combine both lists
    const allDelayedShipments = [...(pendingShipments || []), ...(deliveredShipments || [])]

    const report = allDelayedShipments.map((shipment: any) => {
      const createdDate = new Date(shipment.created_at)
      let daysDelayed: number
      let delayType: string

      if (shipment.delay_type === "delivered_late" && shipment.delivered_at) {
        const deliveredDate = new Date(shipment.delivered_at)
        daysDelayed = Math.floor((deliveredDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        delayType = "تأخر في التسليم"
      } else {
        // For pending shipments, calculate days from creation to now
        daysDelayed = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        delayType = "قيد الانتظار"
      }

      return {
        trackingNumber: shipment.tracking_number,
        senderName: shipment.sender_name,
        receiverName: shipment.receiver_name,
        receiverPhone: shipment.receiver_phone,
        status: shipment.delivery_status || "pending",
        expectedDelivery: shipment.created_at,
        deliveredAt: shipment.delivered_at,
        daysDelayed: Math.max(daysDelayed, 1),
        delayType,
      }
    })

    // Sort by days delayed descending
    report.sort((a, b) => b.daysDelayed - a.daysDelayed)

    return { success: true, data: report }
  } catch (error) {
    console.error("Error generating delayed shipments report:", error)
    return { success: false, error: "حدث خطأ غير متوقع", data: [] }
  }
}

export async function getTopCustomersReport(startDate?: string, endDate?: string, limit = 10) {
  try {
    let shipments: any[]

    if (startDate && endDate) {
      shipments = await sql`
        SELECT sender_name, sender_phone, price as amount 
        FROM shipments 
        WHERE deleted_at IS NULL
        AND created_at BETWEEN ${startDate} AND ${endDate}
      `
    } else if (startDate) {
      shipments = await sql`
        SELECT sender_name, sender_phone, price as amount 
        FROM shipments 
        WHERE deleted_at IS NULL
        AND created_at >= ${startDate}
      `
    } else {
      shipments = await sql`
        SELECT sender_name, sender_phone, price as amount 
        FROM shipments 
        WHERE deleted_at IS NULL
      `
    }

    if (!shipments || shipments.length === 0) {
      return { success: true, data: [] }
    }

    // Group by customer phone
    const customerStats: {
      [key: string]: { name: string; phone: string; shipmentsCount: number; totalAmount: number }
    } = {}

    shipments.forEach((shipment: any) => {
      const phone = shipment.sender_phone || "غير محدد"
      if (!customerStats[phone]) {
        customerStats[phone] = {
          name: shipment.sender_name || "غير محدد",
          phone,
          shipmentsCount: 0,
          totalAmount: 0,
        }
      }
      customerStats[phone].shipmentsCount++
      customerStats[phone].totalAmount += Number(shipment.amount) || 0
    })

    const report = Object.values(customerStats)
      .sort((a, b) => b.shipmentsCount - a.shipmentsCount)
      .slice(0, limit)

    return { success: true, data: report }
  } catch (error) {
    console.error("Error generating top customers report:", error)
    return { success: false, error: "حدث خطأ غير متوقع", data: [] }
  }
}

export async function getRevenueExpensesChart(months = 6) {
  try {
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - months)
    const startDateStr = startDate.toISOString().split("T")[0]

    // Get all shipments
    const allShipments = await sql`
      SELECT id, price as amount FROM shipments WHERE deleted_at IS NULL
    `

    const shipmentsMap = new Map()
    ;(allShipments || []).forEach((shipment: any) => {
      shipmentsMap.set(shipment.id, Number(shipment.amount) || 0)
    })

    // Get trips revenue by month
    const trips = await sql`
      SELECT notes, departure_date, shipment_ids
      FROM trips
      WHERE departure_date >= ${startDateStr}
    `

    // Get additional revenues by month
    const additionalRevenues = await sql`
      SELECT amount, revenue_date as date
      FROM additional_revenues
      WHERE revenue_date >= ${startDateStr}
    `

    // Get expenses by month
    const expenses = await sql`
      SELECT amount, expense_date as date
      FROM expenses
      WHERE expense_date >= ${startDateStr}
    `

    // Get driver sessions expenses by month
    const sessions = await sql`
      SELECT total_driver_fee, session_date
      FROM driver_sessions
      WHERE is_approved = true AND session_date >= ${startDateStr}
    `

    // Group by month
    const monthlyData: { [key: string]: { revenue: number; expenses: number } } = {}

    // Process trips
    ;(trips || []).forEach((trip: any) => {
      const month = new Date(trip.departure_date).toLocaleDateString("ar-SA", { year: "numeric", month: "long" })
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expenses: 0 }
      }

      let shipmentsTotal = 0
      if (trip.shipment_ids && Array.isArray(trip.shipment_ids)) {
        trip.shipment_ids.forEach((shipmentId: string) => {
          const amount = shipmentsMap.get(Number(shipmentId)) || 0
          shipmentsTotal += amount
        })
      }

      // Parse costs from notes
      let totalCosts = 0
      try {
        const notes = typeof trip.notes === "string" ? JSON.parse(trip.notes) : trip.notes
        totalCosts =
          (Number(notes?.delivery_costs) || 0) +
          (Number(notes?.porter_fees) || 0) +
          (Number(notes?.permit_fees) || 0) +
          (Number(notes?.tickets) || 0) +
          (Number(notes?.employee_daily_wages) || 0) +
          (Number(notes?.accommodation) || 0) +
          (Number(notes?.other_costs) || 0)

        // Add other revenues from trip
        const otherRevenues = (Number(notes?.tobacco_revenue) || 0) + (Number(notes?.other_revenue) || 0)
        shipmentsTotal += otherRevenues
      } catch (e) {
        // Ignore parsing errors
      }

      // Net profit = shipments total - costs
      const netProfit = shipmentsTotal - totalCosts
      monthlyData[month].revenue += netProfit
    })

    // Process additional revenues
    ;(additionalRevenues || []).forEach((revenue: any) => {
      const month = new Date(revenue.date).toLocaleDateString("ar-SA", { year: "numeric", month: "long" })
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expenses: 0 }
      }
      const amount = Number(revenue.amount) || 0
      monthlyData[month].revenue += amount
    })

    // Process expenses
    ;(expenses || []).forEach((expense: any) => {
      const month = new Date(expense.date).toLocaleDateString("ar-SA", { year: "numeric", month: "long" })
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expenses: 0 }
      }
      const amount = Number(expense.amount) || 0
      monthlyData[month].expenses += amount
    })

    // Process driver sessions
    ;(sessions || []).forEach((session: any) => {
      const month = new Date(session.session_date).toLocaleDateString("ar-SA", { year: "numeric", month: "long" })
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expenses: 0 }
      }
      const amount = Number(session.total_driver_fee) || 0
      monthlyData[month].expenses += amount
    })

    const chartData = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.revenue - data.expenses,
    }))

    return { success: true, data: chartData }
  } catch (error) {
    console.error("Unexpected error in getRevenueExpensesChart:", error)
    return { success: false, error: "حدث خطأ غير متوقع", data: [] }
  }
}
