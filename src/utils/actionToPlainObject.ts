import { Middleware } from "redux";

export const actionToPlainObject: Middleware = () => next => action => {
  if (typeof action === "object" && action !== null) {
    return next({ ...action });
  }

  return action;
};
