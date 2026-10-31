"use client"

import useSWR from "swr"

const fetcher = async (url: string) => {
  // منع تخزين المتصفح للنتيجة (خصوصاً على iOS Safari) حتى تظهر التحديثات فوراً
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    const error = new Error("Failed to fetch data")
    throw error
  }
  return res.json()
}

export function useDrivers() {
  const { data, error, isLoading, mutate } = useSWR("/api/drivers", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    errorRetryCount: 3,
    errorRetryInterval: 1000,
  })

  return {
    drivers: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    refresh: mutate,
  }
}

export function useDriver(driverId: string) {
  const { data, error, isLoading, mutate } = useSWR(driverId ? `/api/drivers/${driverId}` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    errorRetryCount: 3,
  })

  return {
    driver: data,
    isLoading,
    isError: error,
    refresh: mutate,
  }
}

export function useDriverTasks(driverId: string) {
  const { data, error, isLoading, mutate } = useSWR(driverId ? `/api/drivers/${driverId}/tasks` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3000,
    errorRetryCount: 3,
  })

  return {
    tasks: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    refresh: mutate,
  }
}

export function useDriverSessions(driverId: string) {
  const { data, error, isLoading, mutate } = useSWR(driverId ? `/api/drivers/${driverId}/sessions` : null, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 3000,
    errorRetryCount: 3,
  })

  return {
    sessions: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    refresh: mutate,
  }
}

export function useSession(driverId: string, sessionId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    driverId && sessionId ? `/api/drivers/${driverId}/sessions/${sessionId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3000,
      errorRetryCount: 3,
    },
  )

  return {
    session: data,
    isLoading,
    isError: error,
    refresh: mutate,
  }
}

export function useSessionTasks(driverId: string, sessionId: string) {
  const { data, error, isLoading, mutate } = useSWR(
    driverId && sessionId ? `/api/drivers/${driverId}/sessions/${sessionId}/tasks` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 3000,
      errorRetryCount: 3,
    },
  )

  return {
    tasks: Array.isArray(data) ? data : [],
    isLoading,
    isError: error,
    refresh: mutate,
  }
}
