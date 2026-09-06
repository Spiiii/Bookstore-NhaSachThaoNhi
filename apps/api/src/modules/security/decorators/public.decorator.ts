import { SetMetadata } from '@nestjs/common';

export const PUBLIC_ROUTE = Symbol('PUBLIC_ROUTE');
export const Public = () => SetMetadata(PUBLIC_ROUTE, true);
/** Overrides a public controller at method level. */
export const Protected = () => SetMetadata(PUBLIC_ROUTE, false);
