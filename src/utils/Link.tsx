import * as React from "react";
import {
  History,
  Location,
  createLocation,
  LocationDescriptorObject
} from "history";

export class RequestUrlChange {
  readonly type = "RequestUrlChange";

  constructor(readonly location: Location) {}
}

const isModifiedEvent = (event: React.MouseEvent<HTMLAnchorElement>) =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);

export interface LinkProps<T>
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: T;
  innerRef?: (node: HTMLAnchorElement | null) => void;
}

export type LinkType<T> =
  | React.ClassType<
      LinkProps<T>,
      React.Component<LinkProps<T>>,
      React.ComponentClass<LinkProps<T>>
    >
  | React.FunctionComponent<LinkProps<T>>;

export const createLink = function<T>(
  history: History,
  routeToLocation: (route: T) => LocationDescriptorObject,
  onUrlChangeRequest: (location: Location) => void
) {
  return class Link extends React.Component<LinkProps<T>> {
    handleClick(
      event: React.MouseEvent<HTMLAnchorElement>,
      toLocation: Location
    ) {
      if (this.props.onClick) {
        this.props.onClick(event);
      }

      if (
        !event.defaultPrevented && // onClick prevented default
        event.button === 0 && // ignore everything but left clicks
        (!this.props.target || this.props.target === "_self") && // let browser handle "target=_blank" etc.
        !isModifiedEvent(event) // ignore clicks with modifier keys
      ) {
        event.preventDefault();

        onUrlChangeRequest(toLocation);
      }
    }

    render() {
      const { innerRef, to, ...rest } = this.props;
      const toLocation = createLocation(routeToLocation(to));
      const href = history.createHref(toLocation);

      return (
        <a
          {...rest}
          onClick={event => this.handleClick(event, toLocation)}
          href={href}
          ref={innerRef}
        />
      );
    }
  };
};
