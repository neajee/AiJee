export type RouteMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type RouteHandler = (request: Request) => Response | Promise<Response>;
