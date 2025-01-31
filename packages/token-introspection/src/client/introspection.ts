import { HttpMethod, ResponseValidator } from 'openapi'
import { BaseDeps, RouteDeps } from '.'
import { IntrospectArgs, TokenInfo } from '../types'

export interface IntrospectionRoutes {
  introspect(args: IntrospectArgs): Promise<TokenInfo>
}

export const createIntrospectionRoutes = (
  deps: RouteDeps
): IntrospectionRoutes => {
  const { axiosInstance, openApi, logger } = deps

  const introspectOpenApiValidator = openApi.createResponseValidator<TokenInfo>(
    {
      path: '/',
      method: HttpMethod.POST
    }
  )

  return {
    introspect: (args: IntrospectArgs) =>
      introspectToken(
        { axiosInstance, logger },
        args,
        introspectOpenApiValidator
      )
  }
}

export const introspectToken = async (
  deps: BaseDeps,
  args: IntrospectArgs,
  validateOpenApiResponse: ResponseValidator<TokenInfo>
) => {
  const { axiosInstance, logger } = deps

  try {
    const { data, status } = await axiosInstance.request<TokenInfo>({
      data: args
    })

    try {
      validateOpenApiResponse({
        status,
        body: data
      })
    } catch (error) {
      const errorMessage = 'Failed to validate OpenApi response'
      logger.error(
        {
          data: JSON.stringify(data),
          validationError: error && error['message']
        },
        errorMessage
      )

      throw new Error(errorMessage)
    }

    return validateTokenInfo(data)
  } catch (error) {
    const errorMessage = `Error when making introspection request: ${
      error && error['message'] ? error['message'] : 'Unknown error'
    }`
    logger.error({ args }, errorMessage)

    throw new Error(errorMessage)
  }
}

export const validateTokenInfo = (tokenInfo: TokenInfo): TokenInfo => {
  // TODO: tokenInfo.access must include args.access
  // https://github.com/interledger/rafiki/issues/835
  // throw new Error(
  //   'Token info access does not match request access'
  // )
  return tokenInfo
}
