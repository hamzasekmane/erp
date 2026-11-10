import type { PipeTransform, ArgumentMetadata } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import type { ZodType } from "zod";

/** Nest pipe that validates a payload with a Zod schema. */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodType) {}

  transform(value: unknown, _metadata: ArgumentMetadata) {
    return this.schema.parse(value);
  }
}

export function zodPipe<T extends ZodType>(schema: T) {
  return new ZodValidationPipe(schema);
}
