import { NextResponse } from "next/server"
import { sql } from "@/lib/neon/server"

export async function GET() {
  try {
    // جلب الشحنات قيد الانتظار فقط (التي لم يتم تسليمها بعد)
    // delivery_status = 'pending' يعني لم يتم التسليم
    // استبعاد delivery_status = 'delivered' (تم التوصيل/التسليم)
    const shipments = await sql`
      SELECT 
        id,
        tracking_number,
        receiver_address,
        total_amount,
        price,
        status,
        delivery_status
      FROM shipments 
      WHERE delivery_status = 'pending'
        AND deleted_at IS NULL
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      success: true,
      shipments: shipments
    })
    
  } catch (error: any) {
    console.error('Error fetching pending shipments:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
