import { cep_node, cep, __adobe_cep__ } from './lib/cep-types';

declare module '*.png';
declare module '*.gif';
declare module '*.jpg';
declare module '*.svg';

declare global {
  interface Window {
    cep_node: cep_node;
    cep: cep;
    __adobe_cep__: __adobe_cep__;
  }
}


export interface SelectToolItem {
  value: string;
  label: string;
  component: any;
  apps: string[];
}

export   interface ToolData {
  name: string;
  version: string;
  description: string;
  filepath: string;
  author?: string;
  icon?: string;
}