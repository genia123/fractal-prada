import * as React from "react";
import * as s from "./SingleValuePanel.css";
import { Loop, loop, Cmd } from "redux-loop";

class Increment {
  readonly type = "Increment";
}

class Decrement {
  readonly type = "Decrement";
}

export type Action = Increment | Decrement;

export interface State {
  type: "SingleValuePanel";
  value: number;
}

export const getInitialState = (value: number): State => ({
  type: "SingleValuePanel",
  value
});

export const reducer = (
  prevState: State,
  action: Action
): Loop<State, Action> => {
  switch (action.type) {
    case "Increment":
      return loop({ ...prevState, value: prevState.value + 1 }, Cmd.none);
    case "Decrement":
      return loop({ ...prevState, value: prevState.value - 1 }, Cmd.none);
  }
};

export const SingleValuePanel: React.FunctionComponent<{
  state: State;
  dispatch: (action: Action) => void;
}> = ({ state, dispatch }) => (
  <div className={s.root}>
    <div className={s.value}>{state.value}</div>
    <div className={s.buttons}>
      <button type="button" onClick={() => dispatch(new Increment())}>
        Increment
      </button>
      <button type="button" onClick={() => dispatch(new Decrement())}>
        Decrement
      </button>
    </div>
  </div>
);
