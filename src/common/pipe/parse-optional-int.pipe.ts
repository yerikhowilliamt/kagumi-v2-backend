import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class ParseOptionalIntPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const val = parseInt(value, 10);
    
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed (integer expected)');
    }

    return val;
  }
}
