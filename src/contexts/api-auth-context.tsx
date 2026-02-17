import * as React from "react"

export interface ApiAuthContextValue {
  /** True after Supabase session has been exchanged for a backend JWT. */
  hasBackendToken: boolean
}

const ApiAuthContext = React.createContext<ApiAuthContextValue>({ hasBackendToken: false })

export function useApiAuth(): ApiAuthContextValue {
  return React.useContext(ApiAuthContext)
}

export { ApiAuthContext }
