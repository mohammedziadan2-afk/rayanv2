// Twilio WhatsApp Integration using REST API directly

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER
const adminWhatsAppNumber = process.env.ADMIN_WHATSAPP_NUMBER

export interface ShipmentDeliveryNotification {
  trackingNumber: string
  driverName: string
  receiverName: string
  receiverAddress: string
  totalAmount: number
  deliveryDate: Date
}

async function sendTwilioMessage(to: string, body: string): Promise<boolean> {
  if (!accountSid || !authToken || !twilioWhatsAppNumber) {
    return false
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
  
  const params = new URLSearchParams()
  params.append('To', `whatsapp:${to}`)
  params.append('From', `whatsapp:${twilioWhatsAppNumber}`)
  params.append('Body', body)

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    return response.ok
  } catch (error) {
    return false
  }
}

export async function sendDeliveryNotification(data: ShipmentDeliveryNotification): Promise<boolean> {
  if (!adminWhatsAppNumber) {
    return false
  }

  const formattedDate = data.deliveryDate.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  const message = `تم تسليم شحنة

رقم الشحنة: ${data.trackingNumber}
السائق: ${data.driverName}
المستلم: ${data.receiverName}
العنوان: ${data.receiverAddress}
المبلغ: ${data.totalAmount} د.أ
التاريخ: ${formattedDate}`

  return sendTwilioMessage(adminWhatsAppNumber, message)
}

export async function sendCustomMessage(to: string, message: string): Promise<boolean> {
  return sendTwilioMessage(to, message)
}
