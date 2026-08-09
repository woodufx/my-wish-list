import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/** MSW server for Node — used by unit tests. */
export const server = setupServer(...handlers);
