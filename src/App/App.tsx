import * as React from "react";
import * as s from "./App.css";
import { LinkType, LinkProps } from "../utils/Link";
import { Action as ReduxAction } from "redux";
import { Login } from "../Login/Login";
import * as Tabs from "../Tabs/Tabs";
import { Location } from "../utils/location";
import { Loop, loop, Cmd } from "redux-loop";
import { mapLoop, getModel, getCmd, list, run } from "../utils/loopHelpers";
// aspects to improve
// 1. duplicating of pages and routes
// 2. propagating epics requires boilerplate

interface Props {
  state: State;
  Link: LinkType<Route>;
  requestRouteChange: (route: Route) => void;
  dispatch: (action: Action) => void;
}

interface FeatureFlags {
  weatherReports: boolean;
}

class WelcomePage {
  readonly type = "WelcomePage";
}

class AboutPage {
  readonly type = "AboutPage";
}

class NotFoundPage {
  readonly type = "NotFoundPage";
}

type Page = WelcomePage | Tabs.State | AboutPage | NotFoundPage;

class WelcomeRoute {
  readonly type = "WelcomeRoute";
}

class TabsRoute {
  readonly type = "TabsRoute";

  constructor(readonly route: Tabs.Route) {}
}

class AboutRoute {
  readonly type = "AboutRoute";
}

class NotFoundRoute {
  readonly type = "NotFoundRoute";
}

export type Route = WelcomeRoute | TabsRoute | AboutRoute | NotFoundRoute;

export interface State {
  isLoggedIn: boolean;
  page: Page;
  flags: FeatureFlags;
}

class SetLoggedIn implements ReduxAction {
  readonly type = "SetLoggedIn";

  constructor(readonly isLoggedIn: boolean) {}
}

export class RouteChanged implements ReduxAction {
  readonly type = "RouteChanged";

  constructor(readonly route: Route) {}
}

export class TabsMsg implements ReduxAction {
  readonly type = "TabsMsg";

  constructor(readonly action: Tabs.Action) {}
}

export class FetchFeatureFlagsSuccess implements ReduxAction {
  readonly type = "FetchFeatureFlagsSuccess";

  constructor(readonly flags: FeatureFlags) {}
}

export type Action =
  | SetLoggedIn
  | RouteChanged
  | TabsMsg
  | FetchFeatureFlagsSuccess;

export const routeFromLocation = (location: Location): Route => {
  switch (location.paths[0]) {
    case "":
      return new WelcomeRoute();
    case "tabs":
      const tabsLocation: Location = {
        ...location,
        paths: location.paths.slice(1)
      };

      return new TabsRoute(Tabs.routeFromLocation(tabsLocation));
  }

  return new NotFoundRoute();
};

export const routeToLocation = (route: Route): Partial<Location> => {
  switch (route.type) {
    case "WelcomeRoute":
      return { paths: [] };
    case "TabsRoute":
      const tabsLocation = Tabs.routeToLocation(route.route);

      return {
        ...tabsLocation,
        paths: ["tabs"].concat(tabsLocation.paths || [])
      };
    case "AboutRoute":
      return { paths: ["about"] };
    case "NotFoundRoute":
      return { paths: ["not-found"] };
  }
};

export const getInitialLoop = (route: Route): Loop<State, Action> => {
  const correctRouteLoop = changeRoute(
    {
      isLoggedIn: true,
      page: { type: "WelcomePage" },
      flags: { weatherReports: false }
    },
    route
  );

  return loop(
    getModel(correctRouteLoop),
    list([getCmd(correctRouteLoop), fetchFeatureFlags])
  );
};

const fetchFeatureFlags = run(
  [],
  () =>
    fetch("http://localhost:3000/feature-flags").then(response =>
      response.json()
    ),
  {
    successActionCreator: response =>
      new FetchFeatureFlagsSuccess(response as FeatureFlags)
  }
);

const liftTabs = (
  prevState: State,
  tabsAction: Tabs.Action
): Loop<State, Action> => {
  if (prevState.page.type === "Tabs") {
    return mapLoop(
      Tabs.reducer(prevState.page, tabsAction),
      (tabsState): State => ({
        ...prevState,
        page: tabsState
      }),
      tabsAction => new TabsMsg(tabsAction)
    );
  }

  return loop(prevState, Cmd.none);
};

const changeRoute = (prevState: State, route: Route): Loop<State, Action> => {
  switch (route.type) {
    case "WelcomeRoute":
      return loop({ ...prevState, page: new WelcomePage() }, Cmd.none);
    case "TabsRoute": {
      return prevState.page.type === "Tabs"
        ? liftTabs(prevState, new Tabs.RouteChanged(route.route))
        : mapLoop(
            Tabs.getInitialLoop(route.route),
            tabs => ({ ...prevState, page: tabs }),
            action => new TabsMsg(action)
          );
    }
    case "AboutRoute":
      return loop({ ...prevState, page: new AboutPage() }, Cmd.none);
    case "NotFoundRoute":
      return loop({ ...prevState, page: new NotFoundPage() }, Cmd.none);
  }
};

export const reducer = (
  prevState: State,
  action: Action
): Loop<State, Action> => {
  switch (action.type) {
    case "SetLoggedIn":
      return loop({ ...prevState, isLoggedIn: action.isLoggedIn }, Cmd.none);
    case "RouteChanged": {
      return changeRoute(prevState, action.route);
    }
    case "TabsMsg":
      return liftTabs(prevState, action.action);
    case "FetchFeatureFlagsSuccess":
      return loop({ ...prevState, flags: action.flags }, Cmd.none);
  }
};

export const App: React.FunctionComponent<Props> = ({
  state,
  Link,
  requestRouteChange,
  dispatch
}) => {
  const getRouteView = () => {
    if (state.isLoggedIn === false) {
      return (
        <Login
          setLoggedIn={isLoggedIn => dispatch(new SetLoggedIn(isLoggedIn))}
        />
      );
    }

    switch (state.page.type) {
      case "WelcomePage":
        return <div className={s.paddings}>Welcome</div>;
      case "Tabs":
        const TabsLink: React.FunctionComponent<
          LinkProps<Tabs.Route>
        > = props => <Link {...props} to={new TabsRoute(props.to)} />;

        return (
          <Tabs.Tabs
            state={state.page}
            Link={TabsLink}
            dispatch={action => dispatch(new TabsMsg(action))}
            weatherReportsEnabled={state.flags.weatherReports}
          />
        );
      default:
        return <div className={s.paddings}>NotFound</div>;
    }
  };

  return (
    <>
      <nav className={s.nav}>
        <Link
          className={s.navLink}
          to={new TabsRoute(new Tabs.ChooseATabRoute())}
        >
          Tabs
        </Link>
        <Link className={s.navLink} to={new AboutRoute()}>
          About
        </Link>
      </nav>
      {getRouteView()}
    </>
  );
};
