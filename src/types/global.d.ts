/** @format */
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Any function that returns a promise.
 * @returns A Promise.
 */
declare type AsyncAnyFunction<T = any> = (...args: any[]) => Promise<T>;
/**
 * Any function.
 * @returns Anything.
 */
declare type AnyFunction<T = any> = (...args: any[]) => T;

declare type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Any object.
 */
declare type AnyObj = Record<string, any>;
/**
 * An... Unknown object?
 */
declare type UnknownObj = Record<string, unknown>;

/**
 * An object that contains only functions.
 * @example
 * const myObj = {
 *     myFunc: () => {},
 *     myOtherFunc: () => {}
 * }
 */
declare type FunctionsObj<T> = {
    [K in keyof T]: T[K] extends AnyFunction
        ? T[K]
        : T[K] extends object
        ? FunctionsObj<T[K]>
        : never;
};

declare type FactoryObj<T = any> = IsAny<T> extends true
    ? {
          [K: string]: AnyFunction | { [L: string]: AnyFunction };
      }
    : FunctionsObj<T>;

declare type Factory<T> = () => FactoryObj<T>;

declare type JSONValue =
    | string
    | number
    | boolean
    | null
    | JSONObject
    | JSONArray;

declare interface JSONObject {
    [x: string]: JSONValue;
}

declare type JSONArray = Array<JSONValue>;


declare namespace generalTypes {
    export type CommandData<T> = {
        properties: {
            guild: boolean;
        };
        slashData: T;
    };
}