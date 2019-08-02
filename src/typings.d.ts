declare module '*.css' {
  const classNames: {
    [className: string]: string
  };
  export = classNames;
}