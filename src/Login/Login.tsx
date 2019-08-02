import * as React from "react";
import cx from "classnames";
import * as s from "./Login.css";

interface Props {
  setLoggedIn: (isLoggedIn: boolean) => void;
}

export const Login: React.FunctionComponent<Props> = ({ setLoggedIn }) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    setLoggedIn(true);
  };

  return (
    <div className={s.root}>
      <div className={s.content}>
        <h1 className={cx("title", "is-1", s.h1)}>Omus Logic</h1>
        <form className={s.form} action="" onSubmit={handleSubmit}>
          <input
            className={cx("input", s.field)}
            type="text"
            placeholder="Email"
          />
          <input
            className={cx("input", s.field)}
            type="text"
            placeholder="Password"
          />
          <button className={cx("button", "is-primary", s.field)} type="submit">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
};
