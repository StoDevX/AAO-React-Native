// flow-typed signature: 4c386220938c0851ec2bde47c0e55e59
// flow-typed version: <<STUB>>/string-natural-compare_v3.0.1/flow_v0.122.0

declare module 'string-natural-compare' {
  declare export default function naturalCompare(a: string, b: string): number;
  declare export function i(a: string, b: string): number;
  declare export function caseInsensitive(a: string, b: string): number;

  declare export var alphabet: string;
}
