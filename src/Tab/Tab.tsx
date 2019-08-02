import * as React from "react";
import { loop, Loop, Cmd } from "redux-loop";
import { run, flatten, mapModel, mapCmd } from "../utils/loopHelpers";
import { Action as ReduxAction } from "redux";
import * as TextPanel from "../TextPanel/TextPanel";
import * as SingleValuePanel from "../SingleValuePanel/SingleValuePanel";
import * as AnimalPanel from "../AnimalPanel/AnimalPanel";
import * as WeatherPanel from "../WeatherPanel/WeatherPanel";

type Panel =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "singleValue";
      value: number;
    }
  | {
      type: "animal";
      value: "cat" | "dog" | "turtle";
    }
  | {
      type: "weather";
      place: string;
      isOkay: boolean;
    };

type PanelState =
  | TextPanel.State
  | SingleValuePanel.State
  | AnimalPanel.State
  | WeatherPanel.State;

class NotLoadedData {
  readonly type = "NotLoadedData";
}

class SuccessData {
  readonly type = "SuccessData";

  constructor(readonly panels: PanelState[]) {}
}

export interface State {
  type: "Tab";
  id: number;
  data: NotLoadedData | SuccessData;
}

class FetchPanelsSuccess implements ReduxAction {
  readonly type = "FetchPanelsSuccess";

  constructor(readonly panels: Panel[]) {}
}

class TextPanelMsg implements ReduxAction {
  readonly type = "TextPanelMsg";

  constructor(readonly index: number, readonly action: TextPanel.Action) {}
}

class SingleValuePanelMsg implements ReduxAction {
  readonly type = "SingleValuePanelMsg";

  constructor(
    readonly index: number,
    readonly action: SingleValuePanel.Action
  ) {}
}

class AnimalPanelMsg implements ReduxAction {
  readonly type = "AnimalPanelMsg";

  constructor(readonly index: number, readonly action: AnimalPanel.Action) {}
}

export type Action =
  | FetchPanelsSuccess
  | TextPanelMsg
  | SingleValuePanelMsg
  | AnimalPanelMsg;

export const getInitialLoop = (id: number): Loop<State, Action> =>
  loop(
    { type: "Tab", id, data: new NotLoadedData() },
    run([id], fetchPanels, {
      successActionCreator: response => new FetchPanelsSuccess(response)
    })
  );

export const reducer = (
  prevState: State,
  action: Action
): Loop<State, Action> => {
  switch (action.type) {
    case "FetchPanelsSuccess": {
      const panelStates = action.panels.map(panel => {
        switch (panel.type) {
          case "text":
            return TextPanel.getInitialState(panel.value);
          case "singleValue":
            return SingleValuePanel.getInitialState(panel.value);
          case "animal":
            return AnimalPanel.getInitialState(panel.value);
          case "weather":
            return WeatherPanel.getInitialState(panel.place, panel.isOkay);
        }
      });

      return loop(
        { ...prevState, data: new SuccessData(panelStates) },
        Cmd.none
      );
    }
    case "TextPanelMsg": {
      if (prevState.data.type === "NotLoadedData") {
        return loop(prevState, Cmd.none);
      }

      const panelLoops: Loop<PanelState, Action>[] = prevState.data.panels.map(
        (panel, index) => {
          if (panel.type === "TextPanel" && action.index === index) {
            return mapCmd(
              TextPanel.reducer(panel, action.action),
              action => new TextPanelMsg(index, action)
            );
          }

          return loop(panel, Cmd.none);
        }
      );

      return mapModel(flatten(panelLoops), panels => ({
        ...prevState,
        data: new SuccessData(panels)
      }));
    }
    case "SingleValuePanelMsg": {
      if (prevState.data.type === "NotLoadedData") {
        return loop(prevState, Cmd.none);
      }

      const panelLoops: Loop<PanelState, Action>[] = prevState.data.panels.map(
        (panel, index) => {
          if (panel.type === "SingleValuePanel" && action.index === index) {
            return mapCmd(
              SingleValuePanel.reducer(panel, action.action),
              action => new SingleValuePanelMsg(index, action)
            );
          }

          return loop(panel, Cmd.none);
        }
      );

      return mapModel(flatten(panelLoops), panels => ({
        ...prevState,
        data: new SuccessData(panels)
      }));
    }
    case "AnimalPanelMsg": {
      if (prevState.data.type === "NotLoadedData") {
        return loop(prevState, Cmd.none);
      }

      const panelLoops: Loop<PanelState, Action>[] = prevState.data.panels.map(
        (panel, index) => {
          if (panel.type === "AnimalPanel" && action.index === index) {
            return mapCmd(
              AnimalPanel.reducer(panel, action.action),
              action => new AnimalPanelMsg(index, action)
            );
          }

          return loop(panel, Cmd.none);
        }
      );

      return mapModel(flatten(panelLoops), panels => ({
        ...prevState,
        data: new SuccessData(panels)
      }));
    }
  }
};

const fetchPanels = (tabId: number) =>
  fetch("http://localhost:3000/tab/" + tabId).then(response => response.json());

export const Tab: React.FunctionComponent<{
  state: State;
  dispatch: (action: Action) => void;
  weatherReportsEnabled: boolean;
}> = ({ state, dispatch, weatherReportsEnabled }) => {
  switch (state.data.type) {
    case "NotLoadedData":
      return <div>Loading...</div>;
    case "SuccessData":
      return (
        <div style={{ display: "flex", paddingTop: "1rem" }}>
          {state.data.panels.map((panel, index) => {
            switch (panel.type) {
              case "TextPanel":
                return (
                  <TextPanel.TextPanel
                    key={index}
                    state={panel}
                    dispatch={action =>
                      dispatch(new TextPanelMsg(index, action))
                    }
                  />
                );
              case "SingleValuePanel":
                return (
                  <SingleValuePanel.SingleValuePanel
                    key={index}
                    state={panel}
                    dispatch={action =>
                      dispatch(new SingleValuePanelMsg(index, action))
                    }
                  />
                );
              case "AnimalPanel":
                return (
                  <AnimalPanel.AnimalPanel
                    key={index}
                    state={panel}
                    dispatch={action =>
                      dispatch(new AnimalPanelMsg(index, action))
                    }
                  />
                );
              case "WeatherPanel":
                if (weatherReportsEnabled === false) {
                  return null;
                }

                return <WeatherPanel.WeatherPanel key={index} state={panel} />;
            }
          })}
        </div>
      );
  }
};
