"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Send, MessageCircle, User, Shield } from "lucide-react"
import { toast } from "sonner"

interface Message {
  id: string
  request_id: string
  sender_type: "admin" | "customer"
  sender_name: string
  message: string
  created_at: string
  read: boolean
}

interface ChatDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  requestId: string
  requestNumber: string
  customerName: string
  isAdmin?: boolean
}

export function ChatDialog({
  open,
  onOpenChange,
  requestId,
  requestNumber,
  customerName,
  isAdmin = true,
}: ChatDialogProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) {
      loadMessages()
      const interval = setInterval(loadMessages, 5000)
      return () => clearInterval(interval)
    }
  }, [open, requestId])

  useEffect(() => {
    // التمرير إلى آخر رسالة
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const loadMessages = () => {
    try {
      setLoading(true)
      const allMessages = JSON.parse(localStorage.getItem("messages") || "[]") as Message[]
      const requestMessages = allMessages
        .filter((msg) => msg.request_id === requestId)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      setMessages(requestMessages)

      if (isAdmin) {
        const updatedMessages = allMessages.map((msg) =>
          msg.request_id === requestId && msg.sender_type === "customer" && !msg.read ? { ...msg, read: true } : msg,
        )
        localStorage.setItem("messages", JSON.stringify(updatedMessages))
      } else {
        const updatedMessages = allMessages.map((msg) =>
          msg.request_id === requestId && msg.sender_type === "admin" && !msg.read ? { ...msg, read: true } : msg,
        )
        localStorage.setItem("messages", JSON.stringify(updatedMessages))
      }
    } catch (error) {
      console.error("[v0] Error loading messages:", error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim()) return

    try {
      setSending(true)
      const allMessages = JSON.parse(localStorage.getItem("messages") || "[]") as Message[]

      const newMsg: Message = {
        id: Date.now().toString(),
        request_id: requestId,
        sender_type: isAdmin ? "admin" : "customer",
        sender_name: isAdmin ? "إدارة الشحن" : customerName,
        message: newMessage.trim(),
        created_at: new Date().toISOString(),
        read: false,
      }

      allMessages.push(newMsg)
      localStorage.setItem("messages", JSON.stringify(allMessages))

      setNewMessage("")
      loadMessages()
      toast.success("تم إرسال الرسالة")
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      toast.error("فشل إرسال الرسالة")
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("ar-JO", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "اليوم"
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "أمس"
    } else {
      return new Intl.DateTimeFormat("ar-JO", {
        month: "short",
        day: "numeric",
      }).format(date)
    }
  }

  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {}
    messages.forEach((msg) => {
      const date = new Date(msg.created_at).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(msg)
    })
    return groups
  }

  const messageGroups = groupMessagesByDate()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg">محادثة الطلب</DialogTitle>
              <DialogDescription className="text-sm">رقم الطلب: {requestNumber}</DialogDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <MessageCircle className="w-3 h-3" />
              {messages.length} رسالة
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6" ref={scrollRef}>
          {loading && messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="mt-2 text-sm text-muted-foreground">جاري التحميل...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">لا توجد رسائل بعد</p>
              <p className="text-sm text-muted-foreground mt-1">ابدأ المحادثة الآن</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(messageGroups).map(([date, msgs]) => (
                <div key={date} className="space-y-3">
                  <div className="flex items-center justify-center">
                    <Badge variant="secondary" className="text-xs">
                      {formatDate(msgs[0].created_at)}
                    </Badge>
                  </div>
                  {msgs.map((msg) => {
                    const isAdminMsg = msg.sender_type === "admin"
                    return (
                      <div key={msg.id} className={`flex gap-3 ${isAdminMsg ? "justify-end" : "justify-start"}`}>
                        {!isAdminMsg && (
                          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-secondary-foreground" />
                          </div>
                        )}
                        <div className={`flex flex-col gap-1 max-w-[70%] ${isAdminMsg ? "items-end" : "items-start"}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground">{msg.sender_name}</span>
                            {isAdminMsg && <Shield className="w-3 h-3 text-primary" />}
                          </div>
                          <div
                            className={`rounded-2xl px-4 py-2 ${
                              isAdminMsg
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-muted text-foreground rounded-bl-sm"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{formatTime(msg.created_at)}</span>
                        </div>
                        {isAdminMsg && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                            <Shield className="w-4 h-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t bg-muted/30">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب رسالتك هنا..."
              className="flex-1"
              disabled={sending}
            />
            <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="gap-2">
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              إرسال
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">اضغط Enter للإرسال</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
