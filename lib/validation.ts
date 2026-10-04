import { z } from "zod"

// مساعدات للتحقق من الأرقام والنصوص العربية
const arabicTextRegex = /^[\u0600-\u06FF\s\d\-+$$$$]+$/
const phoneRegex = /^[+]?[\d\s\-()]+$/

// Shipment validation schema
export const shipmentSchema = z.object({
  trackingNumber: z.string().min(1, "رقم التتبع مطلوب").max(50, "رقم التتبع طويل جداً"),
  senderName: z.string().min(2, "اسم المرسل يجب أن يكون على الأقل حرفين").max(100, "اسم المرسل طويل جداً"),
  senderIdNumber: z.string().optional(),
  senderPhone: z
    .string()
    .min(8, "رقم الهاتف قصير جداً")
    .max(20, "رقم الهاتف طويل جداً")
    .regex(phoneRegex, "رقم الهاتف غير صحيح"),
  senderAddress: z.string().min(5, "العنوان قصير جداً").max(500, "العنوان طويل جداً"),
  senderCountry: z.string().min(2, "الدولة مطلوبة").max(100, "اسم الدولة طويل جداً"),
  receiverName: z.string().min(2, "اسم المستلم يجب أن يكون على الأقل حرفين").max(100, "اسم المستلم طويل جداً"),
  receiverPhone: z
    .string()
    .min(8, "رقم الهاتف قصير جداً")
    .max(20, "رقم الهاتف طويل جداً")
    .regex(phoneRegex, "رقم الهاتف غير صحيح"),
  receiverAddress: z.string().min(5, "العنوان قصير جداً").max(500, "العنوان طويل جداً"),
  receiverCountry: z.string().min(2, "الدولة مطلوبة").max(100, "اسم الدولة طويل جداً"),
  description: z.string().min(3, "الوصف قصير جداً").max(1000, "الوصف طويل جداً"),
  amount: z.number().min(0, "المبلغ يجب أن يكون موجباً").max(1000000, "المبلغ كبير جداً"),
  weight: z.number().min(0.1, "الوزن يجب أن يكون أكبر من 0").max(10000, "الوزن كبير جداً"),
  receivedDate: z.string().min(1, "تاريخ الاستلام مطلوب"),
  status: z.enum(["pending", "processing", "in_transit", "delivered", "cancelled"], {
    errorMap: () => ({ message: "حالة غير صحيحة" }),
  }),
  paymentStatus: z.enum(["unpaid", "paid", "partial"], {
    errorMap: () => ({ message: "حالة الدفع غير صحيحة" }),
  }),
  notes: z.string().optional(),
})

export type ShipmentInput = z.infer<typeof shipmentSchema>

// Trip validation schema
export const tripSchema = z.object({
  trip_number: z.string().min(1, "رقم الرحلة مطلوب").max(50, "رقم الرحلة طويل جداً"),
  departure_date: z.string().min(1, "تاريخ المغادرة مطلوب"),
  shipment_ids: z.array(z.string().uuid("معرف شحنة غير صحيح")).min(1, "يجب اختيار شحنة واحدة على الأقل"),
  people_count: z.number().int().min(0, "عدد الأشخاص يجب أن يكون موجباً").max(100),
  bags_count: z.number().int().min(0, "عدد الأكياس يجب أن يكون موجباً").max(1000),
  delivery_costs: z.number().min(0, "تكاليف التوصيل يجب أن تكون موجبة").max(1000000),
  porter_fees: z.number().min(0, "أجور الحمالين يجب أن تكون موجبة").max(1000000),
  permit_fees: z.number().min(0, "رسوم التصاريح يجب أن تكون موجبة").max(1000000),
  tickets: z.number().min(0, "التذاكر يجب أن تكون موجبة").max(1000000),
  employee_daily_wages: z.number().min(0, "أجور الموظفين يجب أن تكون موجبة").max(1000000),
  accommodation: z.number().min(0, "الإقامة يجب أن تكون موجبة").max(1000000),
  other_costs: z.number().min(0, "التكاليف الأخرى يجب أن تكون موجبة").max(1000000),
  tobacco_revenue: z.number().min(0, "إيرادات التبغ يجب أن تكون موجبة").max(1000000),
  other_revenue: z.number().min(0, "الإيرادات الأخرى يجب أن تكون موجبة").max(1000000),
})

export type TripInput = z.infer<typeof tripSchema>

// Driver validation schema
export const driverSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون على الأقل حرفين").max(100, "الاسم طويل جداً"),
  phone: z
    .string()
    .min(8, "رقم الهاتف قصير جداً")
    .max(20, "رقم الهاتف طويل جداً")
    .regex(phoneRegex, "رقم الهاتف غير صحيح"),
  vehicle_number: z.string().min(2, "رقم المركبة مطلوب").max(50, "رقم المركبة طويل جداً"),
  license_number: z.string().optional(),
  national_id: z.string().optional(),
})

export type DriverInput = z.infer<typeof driverSchema>

// User auth validation schema
export const loginSchema = z.object({
  username: z
    .string()
    .min(3, "اسم المستخدم يجب أن يكون على الأقل 3 أحرف")
    .max(50, "اسم المستخدم طويل جداً")
    .regex(/^[a-zA-Z0-9_]+$/, "اسم المستخدم يجب أن يحتوي على حروف وأرقام فقط"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون على الأقل 6 أحرف").max(100, "كلمة المرور طويلة جداً"),
})

export type LoginInput = z.infer<typeof loginSchema>

// Change password schema
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
    newPassword: z
      .string()
      .min(8, "كلمة المرور الجديدة يجب أن تكون على الأقل 8 أحرف")
      .max(100, "كلمة المرور الجديدة طويلة جداً")
      .regex(/[A-Za-z]/, "كلمة المرور يجب أن تحتوي على حرف واحد على الأقل")
      .regex(/[0-9]/, "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// Revenue schema
export const revenueSchema = z.object({
  amount: z.number().min(0.01, "المبلغ يجب أن يكون أكبر من 0").max(10000000, "المبلغ كبير جداً"),
  description: z.string().min(3, "الوصف قصير جداً").max(500, "الوصف طويل جداً"),
  date: z.string().min(1, "التاريخ مطلوب"),
})

export type RevenueInput = z.infer<typeof revenueSchema>

// Expense schema
export const expenseSchema = z.object({
  amount: z.number().min(0.01, "المبلغ يجب أن يكون أكبر من 0").max(10000000, "المبلغ كبير جداً"),
  description: z.string().min(3, "الوصف قصير جداً").max(500, "الوصف طويل جداً"),
  date: z.string().min(1, "التاريخ مطلوب"),
  category: z.string().optional(),
})

export type ExpenseInput = z.infer<typeof expenseSchema>

// Debt schema
export const debtSchema = z.object({
  customer_name: z.string().min(2, "اسم العميل يجب أن يكون على الأقل حرفين").max(100, "الاسم طويل جداً"),
  customer_phone: z
    .string()
    .min(8, "رقم الهاتف قصير جداً")
    .max(20, "رقم الهاتف طويل جداً")
    .regex(phoneRegex, "رقم الهاتف غير صحيح"),
  amount: z.number().min(0.01, "المبلغ يجب أن يكون أكبر من 0").max(10000000, "المبلغ كبير جداً"),
  description: z.string().min(3, "الوصف قصير جداً").max(500, "الوصف طويل جداً"),
  due_date: z.string().optional(),
  status: z.enum(["pending", "partial", "paid"], {
    errorMap: () => ({ message: "حالة غير صحيحة" }),
  }),
})

export type DebtInput = z.infer<typeof debtSchema>

// Rating schema
export const ratingSchema = z.object({
  driver_id: z.string().uuid("معرف السائق غير صحيح"),
  shipment_id: z.string().uuid("معرف الشحنة غير صحيح").optional(),
  rating: z.number().int().min(1, "التقييم يجب أن يكون من 1 إلى 5").max(5, "التقييم يجب أن يكون من 1 إلى 5"),
  comment: z.string().max(1000, "التعليق طويل جداً").optional(),
})

export type RatingInput = z.infer<typeof ratingSchema>

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1, "رقم الصفحة يجب أن يكون موجباً").optional(),
  pageSize: z.number().int().min(1).max(200, "حجم الصفحة يجب أن يكون بين 1 و 200").optional(),
})

export type PaginationInput = z.infer<typeof paginationSchema>

// Date range schema
export const dateRangeSchema = z
  .object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate)
      }
      return true
    },
    {
      message: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية",
      path: ["endDate"],
    },
  )

export type DateRangeInput = z.infer<typeof dateRangeSchema>

// Helper function to validate and return errors
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): {
  success: boolean
  data?: T
  errors?: Record<string, string>
} {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.errors.forEach((err) => {
        const path = err.path.join(".")
        errors[path] = err.message
      })
      return { success: false, errors }
    }
    return { success: false, errors: { _general: "خطأ في التحقق من البيانات" } }
  }
}
