import { ValidationArguments } from 'class-validator';

export function onlyAlphaWithSpaces(args: ValidationArguments): string {
  return `${args.property} must contain only letters and spaces: ${args.value}`;
}
