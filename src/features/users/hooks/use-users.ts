import { useState, useEffect } from "react"
import { usersService } from "../services/users.service"
import type {
  PaginationDTO,
  PageAndFilterDTO,
} from "@/types/api"
import type {
  User,
  UserRequest,
  UserFilter,
  CreateUserWithLoginCodeRequest,
} from "../types/users.types"

interface UseUsersOptions {
  page?: number
  size?: number
  sortBy?: string
  sortDirection?: "ASC" | "DESC"
  filter?: UserFilter
  autoFetch?: boolean
}

export function useUsers(options: UseUsersOptions = {}) {
  const {
    page = 0,
    size = 10,
    sortBy,
    sortDirection = "ASC",
    filter,
    autoFetch = true,
  } = options

  const [data, setData] = useState<PaginationDTO<User> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const pageAndFilter: PageAndFilterDTO<UserFilter> = {
        page,
        size,
        sortBy,
        sortDirection,
        filter,
      }
      const result = await usersService.getAll(pageAndFilter)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch users"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (autoFetch) {
      fetchUsers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, sortBy, sortDirection, filter, autoFetch])

  return {
    data,
    loading,
    error,
    refetch: fetchUsers,
  }
}

export function useUser(id: number | null) {
  const [data, setData] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!id) {
      setData(null)
      return
    }

    const fetchUser = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await usersService.getById(id)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch user"))
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [id])

  return {
    data,
    loading,
    error,
  }
}

export function useCreateUser() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = async (data: UserRequest) => {
    setLoading(true)
    setError(null)
    try {
      const result = await usersService.create(data)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to create user")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    create,
    loading,
    error,
  }
}

export function useUpdateUser() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = async (id: number, data: UserRequest) => {
    setLoading(true)
    setError(null)
    try {
      const result = await usersService.update(id, data)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to update user")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    update,
    loading,
    error,
  }
}

export function useDeleteUser() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteUser = async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      await usersService.delete(id)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to delete user")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    delete: deleteUser,
    loading,
    error,
  }
}

export function useCreateUserWithLoginCode() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = async (data: CreateUserWithLoginCodeRequest) => {
    setLoading(true)
    setError(null)
    try {
      const result = await usersService.createWithLoginCode(data)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to create user with login code")
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  return {
    create,
    loading,
    error,
  }
}
