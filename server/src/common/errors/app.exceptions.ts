import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * All LLM/candidate-data failure modes are mapped to one of these controlled
 * exceptions so the global filter can return a safe, consistent error shape
 * without ever leaking a raw provider error or stack trace to the client.
 */

export class LlmTimeoutException extends HttpException {
  constructor() {
    super(
      { code: 'LLM_TIMEOUT', message: 'The AI took too long to respond. Please try again.' },
      HttpStatus.GATEWAY_TIMEOUT,
    );
  }
}

export class LlmRateLimitException extends HttpException {
  constructor() {
    super(
      {
        code: 'LLM_RATE_LIMITED',
        message: 'The AI service is temporarily busy. Please wait a moment and try again.',
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export class LlmInvalidResponseException extends HttpException {
  constructor() {
    super(
      {
        code: 'LLM_INVALID_RESPONSE',
        message: 'The AI returned an unexpected response. Please try again.',
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}

export class LlmUnavailableException extends HttpException {
  constructor() {
    super(
      {
        code: 'LLM_UNAVAILABLE',
        message: 'The AI service is currently unavailable. Please try again shortly.',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class UnknownCandidatesException extends HttpException {
  constructor() {
    super(
      {
        code: 'UNKNOWN_CANDIDATES',
        message: 'One or more referenced candidates could not be found.',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
