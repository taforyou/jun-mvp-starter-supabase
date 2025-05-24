import { authenticateLineUser } from "../functions/src";

export interface CallableRequest<T> {
  /**
   * The parameters used by a client when calling this function.
   */
  data: T;
  /**
   * The result of decoding and verifying a Firebase AppCheck token.
   */
  app?: AppCheckData;
  /**
   * The result of decoding and verifying a Firebase Auth ID token.
   */
  auth?: AuthData;
  /**
   * An unverified token for a Firebase Instance ID.
   */
  instanceIdToken?: string;
  /**
   * The raw request handled by the callable.
   */
  rawRequest: Request;
}

export interface AppCheckData {
  appId: string;
  token: AppCheckToken;
}

export interface AppCheckToken {
  /**
   * The Firebase App Check token
   */
  token: string;
}

export interface AuthData {
  /**
   * The uid of the authenticated user.
   */
  uid: string;
  /**
   * The Firebase Auth ID token for the authenticated user.
   */
  token: string;
}

interface CallableFunction<T, Return> {
  run(data: CallableRequest<T>): Return;
}

type AuthenticateLineUser = typeof authenticateLineUser;

export type AuthenticateLineUserParams = {
  token: string;
  tokenType: "id" | "access";
};

export type AuthenticateLineUserResult = Awaited<
  ReturnType<AuthenticateLineUser["run"]>
>;
