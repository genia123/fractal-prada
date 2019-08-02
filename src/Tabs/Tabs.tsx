import * as React from "react";
import * as s from "./Tabs.css";
import { LinkType } from "../utils/Link";
import { Action as ReduxAction } from "redux";
import cx from "classnames";
import { Location } from "../utils/location";
import { Loop, loop, Cmd } from "redux-loop";
import { run, mapLoop } from "../utils/loopHelpers";
import * as Tab from "../Tab/Tab";

export class ChooseATabRoute {
  readonly type = "ChooseATabRoute";
}

export class TabRoute {
  readonly type = "TabRoute";

  constructor(readonly id: number) {}
}

export type Route = TabRoute | ChooseATabRoute;

export class ChooseATabPage {
  readonly type = "ChooseATabPage";
}

export type Page = Tab.State | ChooseATabPage;

export const routeFromLocation = (location: Location): Route => {
  if (location.paths.length === 0) {
    return new ChooseATabRoute();
  }

  const convertedTabId = Number(location.paths[0]);

  if (Number.isNaN(convertedTabId) === false) {
    return new TabRoute(convertedTabId);
  }

  return new ChooseATabRoute();
};

export const routeToLocation = (route: Route): Partial<Location> => {
  switch (route.type) {
    case "ChooseATabRoute":
      return { paths: [] };
    case "TabRoute":
      return { paths: [route.id.toString()] };
  }
};

class FetchTabListSuccess implements ReduxAction {
  readonly type = "FetchTabListSuccess";

  constructor(readonly tabList: TabListItem[]) {}
}

class TabMsg implements ReduxAction {
  readonly type = "TabMsg";

  constructor(readonly action: Tab.Action) {}
}

export class RouteChanged implements ReduxAction {
  readonly type = "RouteChanged";

  constructor(readonly route: Route) {}
}

export type Action = FetchTabListSuccess | RouteChanged | TabMsg;

interface TabListItem {
  id: number;
  name: string;
}

interface LoadingState {
  type: "Tabs";
  readyType: "LoadingState";
  route: Route;
}

interface SuccessState {
  type: "Tabs";
  readyType: "SuccessState";
  tabList: TabListItem[];
  page: Page;
}

export type State = LoadingState | SuccessState;

interface Props {
  state: State;
  Link: LinkType<Route>;
  dispatch: (action: Action) => void;
  weatherReportsEnabled: boolean;
}

export const getInitialLoop = (route: Route): Loop<LoadingState, Action> =>
  loop(
    {
      type: "Tabs",
      readyType: "LoadingState",
      route
    },
    fetchTabList
  );

const changeRoute = (
  prevState: SuccessState,
  route: Route
): Loop<SuccessState, Action> => {
  switch (route.type) {
    case "TabRoute":
      return prevState.page.type === "Tab" && prevState.page.id === route.id
        ? loop(prevState, Cmd.none)
        : mapLoop(
            Tab.getInitialLoop(route.id),
            tab => ({ ...prevState, page: tab }),
            action => new TabMsg(action)
          );
    case "ChooseATabRoute":
      return loop({ ...prevState, page: new ChooseATabPage() }, Cmd.none);
  }
};

export const loadingReducer = (
  prevState: LoadingState,
  action: Action
): Loop<State, Action> => {
  switch (action.type) {
    case "FetchTabListSuccess": {
      const stateWithPage = changeRoute(
        {
          type: "Tabs",
          readyType: "SuccessState",
          tabList: action.tabList,
          page: new ChooseATabPage()
        },
        prevState.route
      );

      return stateWithPage;
    }
    case "RouteChanged": {
      return loop(
        {
          ...prevState,
          route: action.route
        },
        Cmd.none
      );
    }
    default:
      return loop(prevState, Cmd.none);
  }
};

export const successReducer = (
  prevState: SuccessState,
  action: Action
): Loop<State, Action> => {
  switch (action.type) {
    case "RouteChanged":
      return changeRoute(prevState, action.route);
    case "TabMsg":
      if (prevState.page.type === "Tab") {
        return mapLoop(
          Tab.reducer(prevState.page, action.action),
          tab => ({ ...prevState, page: tab }),
          action => new TabMsg(action)
        );
      }

      return loop(prevState, Cmd.none);
    default:
      return loop(prevState, Cmd.none);
  }
};

export const reducer = (
  prevState: State,
  action: Action
): Loop<State, Action> => {
  switch (prevState.readyType) {
    case "LoadingState":
      return loadingReducer(prevState, action);
    case "SuccessState":
      return successReducer(prevState, action);
  }
};

const fetchTabList = run(
  [],
  () => fetch("http://localhost:3000/tabs").then(response => response.json()),
  {
    successActionCreator: response =>
      new FetchTabListSuccess(response as TabListItem[])
  }
);

export const Tabs: React.FunctionComponent<Props> = ({
  state,
  Link,
  dispatch,
  weatherReportsEnabled
}) => {
  const getViewByState = () => {
    switch (state.readyType) {
      case "LoadingState":
        return "Loading";
      case "SuccessState": {
        const getRouteView = () => {
          switch (state.page.type) {
            case "ChooseATabPage":
              return (
                <div style={{ paddingTop: "1rem" }}>
                  Choose a tab from the buttons above
                </div>
              );
            case "Tab":
              return (
                <Tab.Tab
                  state={state.page}
                  dispatch={action => dispatch(new TabMsg(action))}
                  weatherReportsEnabled={weatherReportsEnabled}
                />
              );
          }
        };

        return (
          <>
            {state.tabList.map(tab => (
              <Link
                className={cx("button", s.tabLink)}
                key={tab.id}
                to={new TabRoute(tab.id)}
              >
                {tab.name}
              </Link>
            ))}
            {getRouteView()}
          </>
        );
      }
    }
  };

  return <div className={s.root}>{getViewByState()}</div>;
};
