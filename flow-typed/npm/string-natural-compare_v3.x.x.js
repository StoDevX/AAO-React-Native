// flow-typed signature: 96fd88430b8850710b06b1bfe5bae2df
// flow-typed version: <<STUB>>/string-natural-compare_v2.0.2/flow_v0.56.0

declare module 'string-natural-compare' {
  declare export default function naturalCompare(a: string, b: string): number;
  declare export function i(a: string, b: string): number;
  declare export function caseInsensitive(a: string, b: string): number;

  declare export var alphabet: string;
}
