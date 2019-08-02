import * as React from "react";
import * as s from "./WeatherPanel.css";

export interface State {
  type: "WeatherPanel";
  place: string;
  isOkay: boolean;
}

export const getInitialState = (place: string, isOkay: boolean): State => ({
  type: "WeatherPanel",
  place,
  isOkay
});

export const WeatherPanel: React.FunctionComponent<{ state: State }> = ({
  state
}) => {
  return (
    <div className={s.root}>
      <div>Weather in</div>
      <div className={s.place}>{state.place}</div>
      <div className={s.emoji}>{state.isOkay ? "👍" : "👎"}</div>
      <div>{state.isOkay ? "Okay" : "Not okay"}</div>
    </div>
  );
};
