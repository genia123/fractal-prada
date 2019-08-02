import {
  LocationState,
  Search,
  Hash,
  LocationKey,
  Location as HistoryLocation
} from "history";

export interface Location<S = LocationState> {
  paths: string[];
  search: Search;
  state: S;
  hash: Hash;
  key?: LocationKey;
}

export const toHistoryLocation = ({
  paths,
  ...rest
}: Location): HistoryLocation => ({
  ...rest,
  pathname: "/" + paths.join("/")
});

export const toPartialHistoryLocation = ({
  paths,
  ...rest
}: Partial<Location>): Partial<HistoryLocation> => ({
  ...rest,
  pathname: paths && "/" + paths.join("/")
});

export const fromHistoryLocation = ({
  pathname,
  ...rest
}: HistoryLocation): Location => ({
  ...rest,
  paths: pathname.split("/").slice(1)
});
