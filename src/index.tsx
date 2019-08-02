import { createBrowserHistory, createLocation } from "history";
import { render } from "react-dom";
import * as React from "react";
import * as App from "./App/App";
import {
  compose,
  createStore,
  Action as ReduxAction,
  applyMiddleware
} from "redux";
import { actionToPlainObject } from "./utils/actionToPlainObject";
import { createLink } from "./utils/Link";
import { install, loop, Cmd, Loop, StoreCreator } from "redux-loop";
import {
  fromHistoryLocation,
  Location,
  toPartialHistoryLocation
} from "./utils/location";
import { Location as HistoryLocation } from "history";
import { run, mapLoop } from "./utils/loopHelpers";

const history = createBrowserHistory();

class Init implements ReduxAction {
  readonly type = "Init";
}

class RequestLocationChange implements ReduxAction {
  readonly type = "RequestLocationChange";

  constructor(readonly location: HistoryLocation) {}
}

class LocationChanged implements ReduxAction {
  readonly type = "LocationChanged";

  constructor(readonly location: Location) {}
}

class AppMsg implements ReduxAction {
  readonly type = "AppMsg";

  constructor(readonly action: App.Action) {}
}

type Action = Init | RequestLocationChange | LocationChanged | AppMsg;

interface State {
  app: App.State;
}

const reducer = (
  prevState: State | undefined,
  action: Action
): Loop<State, Action> => {
  if (prevState === undefined) {
    const initialLoop = mapLoop(
      App.getInitialLoop(
        App.routeFromLocation(fromHistoryLocation(history.location))
      ),
      app => ({ app }),
      action => new AppMsg(action)
    );

    return initialLoop;
  }

  switch (action.type) {
    case "RequestLocationChange":
      return loop(
        prevState,
        run([action.location], (location: HistoryLocation) =>
          history.push(location)
        )
      );
    case "LocationChanged":
    case "AppMsg": {
      const nestedAction =
        action.type === "LocationChanged"
          ? new App.RouteChanged(App.routeFromLocation(action.location))
          : action.action;

      return mapLoop(
        App.reducer(prevState.app, nestedAction),
        app => ({ app }),
        action => new AppMsg(action)
      );
    }
    default:
      return loop(prevState, Cmd.none);
  }
};

const composeEnhancers =
  (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const createLoopStore = createStore as StoreCreator;
const store = createLoopStore(
  reducer,
  undefined,
  composeEnhancers(install(), applyMiddleware(actionToPlainObject))
);

const requestRouteChange = (route: App.Route) => {
  const partialLocation = App.routeToLocation(route);
  const location = createLocation(toPartialHistoryLocation(partialLocation));

  store.dispatch(new RequestLocationChange(location));
};

const Link = createLink<App.Route>(
  history,
  (route: App.Route) => toPartialHistoryLocation(App.routeToLocation(route)),
  location => {
    store.dispatch(new RequestLocationChange(location));
  }
);

history.listen(toLocation => {
  store.dispatch(new LocationChanged(fromHistoryLocation(toLocation)));
});

const appDispatch = (action: App.Action) => store.dispatch(new AppMsg(action));

store.subscribe(() => {
  const state = store.getState();

  render(
    <App.App
      state={state.app}
      Link={Link}
      requestRouteChange={requestRouteChange}
      dispatch={appDispatch}
    />,
    document.getElementById("root")
  );
});

store.dispatch(new Init());
