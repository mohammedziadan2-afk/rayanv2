export interface Shipment {
  id: string
  customer_name: string
  phone_number: string
  address: string
  received_date: string
  delivery_date: string | null
  status: "pending" | "in-transit" | "delivered"
  price: number
  cost: number
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  date: string
  category: string
  created_at?: string
  updated_at?: string
}
