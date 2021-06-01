'use strict';

export enum CliStatus {
    SUCCESS = 0,
    CLI_ERROR = 1,
    HTTP_SUCCESS = 200,
    CREATED = 201,
    SEE_OTHER = 303,
    ERROR = 400,
    UNAUTHORIZED = 401,
    NOT_FOUND = 404,
    CONFLICT = 409,
    INTERNAL_SERVER_ERROR = 500
}
