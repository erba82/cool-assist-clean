// src/declarations.d.ts

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.jpeg' {
  const value: string;
  export default value;
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.gif' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

// Konva types fix
declare module 'react-konva' {
  import { Component } from 'react';
  
  export class Stage extends Component<any> {}
  export class Layer extends Component<any> {}
  export class Line extends Component<any> {}
  export class Rect extends Component<any> {}
  export class Circle extends Component<any> {}
  export class Text extends Component<any> {}
  export class Group extends Component<any> {}
  export class Image extends Component<any> {}
}