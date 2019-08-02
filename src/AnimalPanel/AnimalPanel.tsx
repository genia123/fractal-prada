import * as React from "react";
import * as s from "./AnimalPanel.css";
import cat from "./cat.jpg";
import dog from "./dog.jpg";
import turtle from "./turtle.jpg";
import { Loop, loop, Cmd } from "redux-loop";

export type Animal = "cat" | "dog" | "turtle";

export interface State {
  type: "AnimalPanel";
  value: Animal;
}

class ChangeAnimal {
  readonly type = "ChangeAnimal";
}

export type Action = ChangeAnimal;

export const getInitialState = (value: Animal): State => ({
  type: "AnimalPanel",
  value
});

export const reducer = (
  prevState: State,
  action: Action
): Loop<State, Action> => {
  switch (action.type) {
    case "ChangeAnimal":
      const getNextAnimal = (): Animal => {
        switch (prevState.value) {
          case "cat":
            return "dog";
          case "dog":
            return "turtle";
          case "turtle":
            return "cat";
        }
      };

      return loop({ ...prevState, value: getNextAnimal() }, Cmd.none);
  }
};

export const AnimalPanel: React.FunctionComponent<{
  state: State;
  dispatch: (action: Action) => void;
}> = ({ state, dispatch }) => {
  const getImgSrc = () => {
    switch (state.value) {
      case "cat":
        return cat;
      case "dog":
        return dog;
      case "turtle":
        return turtle;
    }
  };

  return (
    <button className={s.root} onClick={() => dispatch(new ChangeAnimal())}>
      <img className={s.img} src={getImgSrc()} alt="" />
    </button>
  );
};
