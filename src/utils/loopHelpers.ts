import { Action } from "redux";
import { Loop, CmdType, Cmd, loop, RunCmd, ListCmd } from "redux-loop";

export const getCmd = <S, A extends Action>(loop: Loop<S, A>): CmdType<A> => {
  return loop[1];
};

export const getModel = <S, A extends Action>(loop: Loop<S, A>): S => {
  return loop[0];
};

export const mapModel = <SA, SB, A extends Action>(
  loopToMap: Loop<SA, A>,
  mapper: (from: SA) => SB
): Loop<SB, A> => {
  return loop(mapper(getModel(loopToMap)), getCmd(loopToMap));
};

export const mapCmd = <S, AA extends Action, AB extends Action>(
  loopToMap: Loop<S, AA>,
  mapper: (from: AA) => AB
): Loop<S, AB> => {
  return loop(getModel(loopToMap), Cmd.map(getCmd(loopToMap), mapper));
};

export const mapLoop = <SA, SB, AA extends Action, AB extends Action>(
  loopToMap: Loop<SA, AA>,
  modelMapper: (from: SA) => SB,
  actionMapper: (from: AA) => AB
): Loop<SB, AB> => {
  return loop(
    modelMapper(getModel(loopToMap)),
    Cmd.map(getCmd(loopToMap), actionMapper)
  );
};

export const flatten = <S, A extends Action>(
  loops: Loop<S, A>[]
): Loop<S[], A> => {
  const states = loops.map(loop => getModel(loop));
  const cmds = loops.map(loop => getCmd(loop));

  return loop(states, list(cmds));
};

export const run = <F extends (...args: any) => any, A extends Action>(
  args: Parameters<F>,
  func: F,
  options?: {
    failActionCreator?: (error: any) => A;
    successActionCreator?: (
      result: ReturnType<F> extends Promise<infer R> ? R : ReturnType<F>
    ) => A;
    forceSync?: boolean;
    testInvariants?: boolean;
  }
): RunCmd<A> => {
  return Cmd.run(func, { args, ...options });
};

export const list = <A extends Action>(cmds: CmdType<A>[]): ListCmd<A> =>
  Cmd.list(cmds, { batch: true });
