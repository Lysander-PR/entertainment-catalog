import { Transform, TransformFnParams } from 'class-transformer';
import { cleanInputString } from '../helpers/clean-input-string.helper';

export function CleanInput() {
  return Transform(({ value }: TransformFnParams): string | undefined =>
    typeof value === 'string' ? cleanInputString(value) : value,
  );
}
