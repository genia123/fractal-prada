import * as React from "react";
import * as s from "./TextPanel.css";
import { Loop, loop, Cmd } from "redux-loop";

export interface State {
  type: "TextPanel";
  isEditModeEnabled: boolean;
  value: string;
}

class SwitchEditMode {
  readonly type = "SwitchEditMode";

  constructor(readonly isEnabled: boolean) {}
}

class ChangeValue {
  readonly type = "ChangeValue";

  constructor(readonly value: string) {}
}

export type Action = SwitchEditMode | ChangeValue;

export const getInitialState = (value: string): State => ({
  type: "TextPanel",
  isEditModeEnabled: false,
  value
});

export const reducer = (
  prevState: State,
  action: Action
): Loop<State, Action> => {
  switch (action.type) {
    case "SwitchEditMode":
      return loop(
        { ...prevState, isEditModeEnabled: action.isEnabled },
        Cmd.none
      );
    case "ChangeValue":
      return loop({ ...prevState, value: action.value }, Cmd.none);
  }
};

export const TextPanel: React.FunctionComponent<{
  state: State;
  dispatch: (action: Action) => void;
}> = ({ state, dispatch }) => (
  <div className={s.root}>
    <button
      type="button"
      onClick={() => dispatch(new SwitchEditMode(!state.isEditModeEnabled))}
    >
      {state.isEditModeEnabled ? "Disable" : "Enable"} edit mode
    </button>
    {state.isEditModeEnabled ? (
      <textarea
        value={state.value}
        onChange={event => dispatch(new ChangeValue(event.target.value))}
      />
    ) : (
      <div className={s.text}>{state.value}</div>
    )}
  </div>
);
