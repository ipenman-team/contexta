export type SlateText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

export type SlateElement = {
  type: string;
  children: SlateNode[];
};

export type SlateNode = SlateText | SlateElement;

export type SlateValue = SlateElement[];
