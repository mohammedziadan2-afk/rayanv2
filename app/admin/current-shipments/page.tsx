import { getAllDriversActiveTasks, getDrivers } from "@/app/actions/drivers"
import { CurrentShipmentsClient } from "@/components/current-shipments-client"

export const dynamic = "force-dynamic"

export default async function CurrentShipmentsPage() {
  const [tasks, drivers] = await Promise.all([getAllDriversActiveTasks(), getDrivers()])

  // تجميع المهام حسب السائق
  const tasksByDriver: Record<string, any[]> = {}
  const driverInfo: Record<string, { name: string; phone: string }> = {}

  tasks.forEach((task: any) => {
    const driverId = task.driver_id
    if (!tasksByDriver[driverId]) {
      tasksByDriver[driverId] = []
      driverInfo[driverId] = {
        name: task.driver_name || "سائق غير معروف",
        phone: task.driver_phone || "",
      }
    }
    tasksByDriver[driverId].push(task)
  })

  return <CurrentShipmentsClient tasksByDriver={tasksByDriver} driverInfo={driverInfo} totalTasks={tasks.length} />
}
