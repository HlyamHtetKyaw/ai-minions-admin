import { useState, useEffect } from "react"
import { codeValuesService, type CodeValueListResponse } from "../services/code-values.service"

interface UseCodeValuesOptions {
  constantValue: string
  autoFetch?: boolean
}

export function useCodeValues(options: UseCodeValuesOptions) {
  const { constantValue, autoFetch = true } = options

  const [data, setData] = useState<CodeValueListResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchCodeValues = async () => {
    if (!constantValue) {
      setData([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await codeValuesService.getByConstantValue(constantValue)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch code values"))
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch && constantValue) {
      fetchCodeValues()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [constantValue, autoFetch])

  return {
    data,
    loading,
    error,
    refetch: fetchCodeValues,
  }
}
