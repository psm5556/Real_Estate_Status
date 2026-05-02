export interface RegionNode {
  code: string;
  name: string;
  fullName: string;
  children: RegionNode[];
}

export type RegionCode = string;

export interface RegionFlat {
  code: string;
  name: string;
  fullName: string;
  depth: number;
}
