import { User } from '@prisma/client';
import { LogtoUser } from './logto';

/**
 * Authentication type definitions
 *
 * #auth #types #logto
 */

/**
 * Authenticated request context
 * Contains both Logto token claims and database user record
 */
export interface AuthContext {
    logtoUser: LogtoUser;
    user: User;
}

/**
 * User creation data from Logto
 */
export interface CreateUserData {
    logtoId: string;
    email: string;
    name?: string;
    picture?: string;
}

/**
 * User update data
 */
export interface UpdateUserData {
    name?: string;
    picture?: string;
}
